import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {dockerArgs,validateFiles} from '../worker/runner.mjs';
const sql=new DatabaseSync(':memory:');for(const f of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(f,'utf8'));
class Stmt{constructor(s,a=[]){this.sql=s;this.args=a}bind(...a){return new Stmt(this.sql,a)}async all(){return{results:sql.prepare(this.sql).all(...this.args)}}async first(){return sql.prepare(this.sql).get(...this.args)||null}async run(){const r=sql.prepare(this.sql).run(...this.args);return {meta:{changes:Number(r.changes)}}}}
globalThis.__omniEnv={OMNI_VAULT_KEY:randomBytes(32).toString('base64'),OMNI_WORKER_TOKEN:'worker-test-credential',DB:{prepare:s=>new Stmt(s),batch:async ss=>{sql.exec('BEGIN');try{const r=ss.map(s=>({meta:{changes:Number(sql.prepare(s.sql).run(...s.args).changes)}}));sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}}};
const workspace=await import('../.test-runtime/route.mjs');const runtime=await import('../.test-runtime/runtime-route.mjs');const worker=await import('../.test-runtime/worker-route.mjs');const {candidate,applyPatches}=await import('../.test-runtime/runtime-contract.mjs');
let n=0;const ok=(v,l)=>{assert.ok(v,l);n++;console.log('PASS '+l)};
const req=(p,url='runtime')=>new Request('https://omni.example/api/'+url,{method:'POST',headers:{Origin:'https://omni.example','Content-Type':'application/json'},body:JSON.stringify(p)});
const post=async p=>{const r=await runtime.POST(req(p));return{status:r.status,data:await r.json()}};
let x=await workspace.POST(req({action:'example'},'workspace'));const example=await x.json();const pid=example.projectId;

const source=sql.prepare('SELECT * FROM records WHERE id=?').get(pid);const destination='destination-project';sql.prepare('INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(destination,'project','Destination','','active',JSON.stringify({files:[{path:'unrelated.txt',content:'keep me'}]}),source.created_at,source.updated_at);
let r=await post({action:'enqueue',mode:'native',projectId:pid,objective:'Create missing documentation'});const id=r.data.result.id;
r=await post({action:'tick',id});assert.equal(r.status,200);const before=sql.prepare('SELECT * FROM jobs WHERE id=?').get(id);
r=await post({action:'moveJob',id,projectId:'missing'});assert.equal(r.status,400);
r=await post({action:'moveJob',id,projectId:destination});assert.equal(r.status,200);const moved=sql.prepare('SELECT * FROM jobs WHERE id=?').get(id);assert.equal(moved.project_id,destination);assert.equal(moved.result,before.result);assert.equal(moved.status,before.status);assert.deepEqual(JSON.parse(moved.payload).baseline,JSON.parse(before.payload).baseline);assert.equal(JSON.parse(moved.payload).sourceProjectId,pid);
assert.equal(sql.prepare('SELECT project_id FROM records WHERE id=?').get('agent-'+id).project_id,destination);assert.equal(sql.prepare('SELECT project_id FROM records WHERE id=?').get('enqueue-'+id).project_id,destination);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM records WHERE json_extract(data,'$.jobId')=? AND project_id<>?").get(id,destination).n,0);
r=await post({action:'apply',id});assert.equal(r.status,200);assert.equal(JSON.parse(sql.prepare('SELECT data FROM records WHERE id=?').get(destination).data).files[0].content,'keep me');assert.notEqual(sql.prepare('SELECT data FROM records WHERE id=?').get(pid).data,source.data);
r=await post({action:'moveJob',id,projectId:pid});assert.equal(r.status,200);assert.equal(r.data.result.payload.moves.length,2);
r=await post({action:'rollback',id});assert.equal(r.status,200);

const old=sql.prepare('SELECT * FROM jobs WHERE id=?').get(id);
r=await post({action:'switchRepository',id,projectId:destination});assert.equal(r.status,200);const fresh=r.data.result;assert.notEqual(fresh.id,id);assert.equal(fresh.objective,old.objective);assert.equal(fresh.projectId,destination);assert.equal(fresh.payload.previousJobId,id);assert.equal(fresh.result.candidate,undefined);assert.equal(sql.prepare('SELECT result FROM jobs WHERE id=?').get(id).result,old.result);
const again=await post({action:'switchRepository',id,projectId:destination});assert.equal(again.data.result.id,fresh.id);
r=await post({action:'manageProject',projectId:destination,operation:'delete',confirmation:'Destination'});assert.equal(r.status,400);await post({action:'cancel',id:fresh.id});
r=await post({action:'manageProject',projectId:destination,operation:'delete',confirmation:'wrong'});assert.equal(r.status,400);
r=await post({action:'manageProject',projectId:destination,operation:'disconnect',confirmation:'Destination'});assert.equal(r.status,200);assert.equal(JSON.parse(sql.prepare('SELECT data FROM records WHERE id=?').get(destination).data).origin,null);
r=await post({action:'manageProject',projectId:destination,operation:'clearSnapshot',confirmation:'Destination'});assert.equal(r.status,200);assert.equal(JSON.parse(sql.prepare('SELECT data FROM records WHERE id=?').get(destination).data).files.length,0);assert.ok(sql.prepare('SELECT id FROM jobs WHERE id=?').get(fresh.id));
r=await post({action:'manageProject',projectId:destination,operation:'delete',confirmation:'Destination'});assert.equal(r.status,200);assert.equal(sql.prepare('SELECT id FROM records WHERE id=?').get(destination),undefined);assert.equal(sql.prepare('SELECT id FROM jobs WHERE id=?').get(fresh.id),undefined);assert.equal(sql.prepare('SELECT id FROM records WHERE id=?').get('agent-'+fresh.id),undefined);
console.log('PASS source switch creates idempotent fresh job without carrying stale evidence; deletion requires exact confirmation, refuses active jobs, distinguishes disconnect/snapshot/project and cleans linked records');
