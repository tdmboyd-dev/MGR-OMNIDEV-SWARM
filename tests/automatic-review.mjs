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

const {nativeCandidate}=await import('../.test-runtime/runtime-contract.mjs');const {fingerprint}=await import('../.test-runtime/control-plane.mjs');
let r=await post({action:'enqueue',mode:'account',projectId:pid,objective:'Review all security, backend and documentation',automaticReview:true,reviewBudget:3});assert.equal(r.status,200);const id=r.data.result.id;const raw=sql.prepare('SELECT * FROM jobs WHERE id=?').get(id);const files=JSON.parse(raw.payload).baseline;const c=nativeCandidate(files,'Fixture','Add documentation');c.experts=[{domain:'Quantum Robotics',task:'Assess robot safety',parent:'Omni Core'}];
r=await post({action:'submitAccountCandidate',id,candidate:{jobId:id,sourceDigest:await fingerprint(files),candidate:c}});assert.equal(r.status,200);assert.ok(r.data.result.result.reviewPlan.tasks.length>3);assert.ok(r.data.capabilityGaps.some(g=>g.title==='Quantum Robotics'));
let requests=[];for(let index=0;index<3;index++){const response=await runtime.GET(new Request('https://omni.example/api/runtime?action=accountReviewRequest&id='+id+'&index='+index));assert.equal(response.status,200);const request=await response.json();requests.push(request);r=await post({action:'submitAccountReview',id,index,candidate:{jobId:request.jobId,sourceDigest:request.sourceDigest,candidate:{approved:true,findings:index===0?['CAPABILITY GAP: Need authenticated staging service for integration checks']:[]}}});assert.equal(r.status,200);}
let response=await runtime.GET(new Request('https://omni.example/api/runtime?action=accountReviewRequest&id='+id+'&index=3'));assert.notEqual(response.status,200);r=await post({action:'apply',id});assert.equal(r.status,400);
r=await post({action:'extendReviews',id,budget:48});assert.equal(r.status,200);const total=r.data.result.result.reviewPlan.tasks.length;for(let index=3;index<total;index++){response=await runtime.GET(new Request('https://omni.example/api/runtime?action=accountReviewRequest&id='+id+'&index='+index));assert.equal(response.status,200);const req=await response.json();r=await post({action:'submitAccountReview',id,index,candidate:{jobId:req.jobId,sourceDigest:req.sourceDigest,candidate:{approved:true,findings:[]}}});assert.equal(r.status,200);}
assert.equal(r.data.result.result.report.status,'reviewed');assert.equal(r.data.result.result.report.completed,total);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM records WHERE kind='agent_run' AND json_extract(data,'$.jobId')=? AND status='completed'").get(id).n,total);assert.equal(r.data.result.result.report.runtime,'not run');assert.ok(r.data.capabilityGaps.some(g=>g.data.kind==='specialist-reported-gap'));const gap=r.data.capabilityGaps.find(g=>g.title==='Quantum Robotics');r=await post({action:'proposeCapability',id:gap.id});assert.equal(r.status,200);assert.equal(r.data.result.status,'proposed');
r=await post({action:'apply',id});assert.equal(r.status,200);
console.log('PASS automatic relevant-domain plan exceeds two reviews, enforces visible budget and completion gates, preserves source-digest evidence and records owner build proposals without activating capabilities');
const nativeFetch=globalThis.fetch;let inferenceCalls=0;let responseBody={summary:'Candidate',patches:[{path:'review-note.md',before:null,after:'# Review note\n'}],experts:[]};
globalThis.fetch=async()=>{inferenceCalls++;await new Promise(resolve=>setTimeout(resolve,20));return Response.json({choices:[{message:{content:JSON.stringify(responseBody)}}],usage:{total_tokens:20}});};
r=await post({action:'provider',provider:'openai',model:'fixture',apiKey:'fixture-provider-secret'});assert.equal(r.status,200);
r=await post({action:'enqueue',mode:'ai',projectId:pid,objective:'Review source',automaticReview:true,reviewBudget:6});const apiId=r.data.result.id;r=await post({action:'tick',id:apiId});assert.equal(r.status,200);assert.equal(r.data.result.status,'awaiting review');responseBody={approved:true,findings:[]};const beforeCalls=inferenceCalls;
const results=await Promise.all([post({action:'runAssignedReview',id:apiId,index:0}),post({action:'runAssignedReview',id:apiId,index:0})]);assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(inferenceCalls-beforeCalls,1);r=await post({action:'runAssignedReview',id:apiId,index:0});assert.equal(r.status,400);assert.equal(inferenceCalls-beforeCalls,1);
const parallelBefore=inferenceCalls;
const parallelResults=await Promise.all([1,2,3,4].map(index=>post({action:'runAssignedReview',id:apiId,index})));
assert.ok(parallelResults.every(r=>r.status===200),JSON.stringify(parallelResults.map(r=>r.data.error)));assert.equal(inferenceCalls-parallelBefore,4);
const final=sql.prepare('SELECT result FROM jobs WHERE id=?').get(apiId);assert.equal(JSON.parse(final.result).reviews.length,5);
console.log('PASS independent API specialist requests execute concurrently and all receipts survive storage contention');
globalThis.fetch=nativeFetch;
console.log('PASS concurrent API coordinators claim one review and issue exactly one provider request; completed review cannot be charged twice');
