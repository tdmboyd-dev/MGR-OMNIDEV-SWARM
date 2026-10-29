import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {after,beforeEach,test} from 'node:test';

const environment={DB:null};globalThis.__omniEnv=environment;
let sqlite;
function openStore(){
 sqlite?.close();sqlite=new DatabaseSync(':memory:');
 for(const path of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sqlite.exec(readFileSync(path,'utf8'));
 class Stmt{constructor(sql,args=[]){this.sql=sql;this.args=args;}bind(...args){return new Stmt(this.sql,args);}async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}}
 environment.DB={prepare:sql=>new Stmt(sql),batch:async statements=>{sqlite.exec('BEGIN');try{const result=statements.map(statement=>({meta:{changes:Number(sqlite.prepare(statement.sql).run(...statement.args).changes)}}));sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
}
openStore();const store=await import('../.test-runtime/store.mjs'),jobs=await import('../.test-runtime/jobs.mjs');
beforeEach(openStore);after(()=>sqlite.close());
async function expired(attempts=1){
 const project=store.record('project','Recovery fixture',{files:[{path:'src/value.js',content:'export const value=1;'}]});await store.insert(project).run();
 const job=await jobs.enqueue({projectId:project.id,mode:'native',objective:'Preserve all recovered work'});
 const evidence={candidate:{summary:'Saved candidate',patches:[{path:'README.md',before:null,after:'# Saved output'}]},reviews:[{domain:'Testing',approved:true,findings:[]}],usage:{total_tokens:150},externalTests:{passed:false,output:'Previous failed test'}};
 sqlite.prepare("UPDATE jobs SET status='running',lease_token='expired-lease',lease_until='2000-01-01T00:00:00.000Z',attempts=?,result=? WHERE id=?").run(String(attempts),JSON.stringify(evidence),job.id);
 sqlite.prepare("UPDATE records SET status='busy',data=json_set(data,'$.lifecycleStatus','busy') WHERE id=?").run('agent-'+job.id);
 return {job,project,evidence};
}
function saved(id){const raw=sqlite.prepare('SELECT * FROM jobs WHERE id=?').get(id);return {...raw,result:JSON.parse(raw.result)};}
function receipts(id){return sqlite.prepare("SELECT * FROM records WHERE kind='memory' AND json_extract(data,'$.type')='JobRecovery' AND json_extract(data,'$.jobId')=?").all(id).map(row=>({...row,data:JSON.parse(row.data)}));}

test('RUN-03 exhausted recovery preserves candidate, reviews and test output with an audit event',async()=>{
 const {job,evidence}=await expired(3);await jobs.recover();const actual=saved(job.id);
 assert.equal(actual.status,'failed');for(const [key,value] of Object.entries(evidence))assert.deepEqual(actual.result[key],value);
 assert.match(actual.result.error,/retry budget exhausted/);assert.equal(actual.lease_token,null);assert.equal(actual.lease_until,null);
 assert.equal(receipts(job.id).length,1);assert.equal(receipts(job.id)[0].data.outcome,'failed');
 assert.equal(sqlite.prepare('SELECT status FROM records WHERE id=?').get('agent-'+job.id).status,'dormant');
});

test('RUN-03 retry recovery is auditable, preserves attempts and executes the queued work',async()=>{
 const {job,evidence}=await expired(1);await jobs.recover();const recovered=saved(job.id);
 assert.equal(recovered.status,'queued');assert.equal(recovered.attempts,'1');assert.deepEqual(recovered.result.reviews,evidence.reviews);
 assert.equal(receipts(job.id).length,1);assert.equal(receipts(job.id)[0].data.outcome,'queued');
 assert.equal(sqlite.prepare('SELECT status FROM records WHERE id=?').get('agent-'+job.id).status,'active');
 const completed=await jobs.tick(job.id);assert.equal(completed.status,'awaiting review');assert.equal(completed.attempts,2);
 assert.equal(receipts(job.id).length,1);assert.equal(receipts(job.id)[0].data.jobId,job.id);
});

test('RUN-03 concurrent recovery and repeated requests record exactly one recovery',async()=>{
 const {job,evidence}=await expired(3);await Promise.all([jobs.recover(),jobs.recover(),jobs.recover()]);await jobs.recover();
 assert.equal(receipts(job.id).length,1);assert.deepEqual(saved(job.id).result.candidate,evidence.candidate);
 assert.equal(sqlite.prepare('SELECT json_extract(data,\'$.revision\') revision FROM records WHERE id=?').get('agent-'+job.id).revision,2);
});

test('RUN-03 recovery cannot overwrite a newer completed worker result',async()=>{
 const {job}=await expired(3),prepare=environment.DB.prepare;
 environment.DB.prepare=sql=>{if(sql.startsWith('UPDATE jobs SET status')){environment.DB.prepare=prepare;sqlite.prepare("UPDATE jobs SET status='awaiting review',lease_token=NULL,lease_until=NULL,result=? WHERE id=?").run(JSON.stringify({newer:'completed-work'}),job.id);}return prepare(sql);};
 await jobs.recover();assert.equal(saved(job.id).status,'awaiting review');assert.deepEqual(saved(job.id).result,{newer:'completed-work'});assert.equal(receipts(job.id).length,0);
});

test('RUN-03 audit persistence failure rolls recovery back atomically',async()=>{
 const {job,evidence}=await expired(3);
 sqlite.exec("CREATE TRIGGER refuse_recovery BEFORE INSERT ON records WHEN json_extract(NEW.data,'$.type')='JobRecovery' BEGIN SELECT RAISE(ABORT,'forced audit failure'); END;");
 await assert.rejects(()=>jobs.recover(),/forced audit failure/);
 assert.equal(saved(job.id).status,'running');assert.equal(saved(job.id).lease_token,'expired-lease');assert.deepEqual(saved(job.id).result,evidence);assert.equal(receipts(job.id).length,0);
});

test('RUN-03 healthy leases and terminal jobs are not recovered',async()=>{
 const {job,evidence}=await expired(3);
 sqlite.prepare('UPDATE jobs SET lease_until=? WHERE id=?').run(new Date(Date.now()+60000).toISOString(),job.id);
 await jobs.recover();assert.equal(saved(job.id).status,'running');assert.deepEqual(saved(job.id).result,evidence);
 sqlite.prepare("UPDATE jobs SET status='canceled',lease_until='2000-01-01T00:00:00.000Z' WHERE id=?").run(job.id);
 await jobs.recover();assert.equal(saved(job.id).status,'canceled');assert.equal(receipts(job.id).length,0);
});
