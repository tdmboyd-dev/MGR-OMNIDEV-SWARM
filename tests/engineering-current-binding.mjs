import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const sql=new DatabaseSync(':memory:');
for(const p of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(p,'utf8'));
let onRun=null,onJobRead=null;
class Statement{
 constructor(query,args=[]){this.query=query;this.args=args;}
 bind(...args){return new Statement(this.query,args);}
 async first(){const row=sql.prepare(this.query).get(...this.args)??null;if(onJobRead&&this.query==='SELECT * FROM jobs WHERE id=?'){const f=onJobRead;onJobRead=null;f();}return row;}
 async all(){return {results:sql.prepare(this.query).all(...this.args)};}
 async run(){if(onRun&&this.query.startsWith('UPDATE jobs SET result=')){const f=onRun;onRun=null;f();}return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}
}
globalThis.__omniEnv={DB:{prepare:q=>new Statement(q)}};
const jobs=await import('../.test-runtime/jobs.mjs');
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const baseline=[{path:'src/value.mjs',content:'export const value=1;\n'},{path:'tests/omni-snapshot.test.mjs',content:'// unchanged owner oracle\n'}];
const files=baseline.map(f=>f.path==='src/value.mjs'?{...f,content:'export const value=2;\n'}:f);
const command=['node','--preserve-symlinks','--preserve-symlinks-main','--test','--test-isolation=none','tests/omni-snapshot.test.mjs'];
const policy={version:1,enabled:true,hostId:'software-fixture-not-qualified',launcherSha256:'a'.repeat(64),runtimeSha256:'b'.repeat(64),qualificationDigest:'c'.repeat(64),scope:'approved-mgr-snapshot',allowedSourceDigests:[sha(baseline)],allowedCandidateDigests:[sha(files)],allowedTestManifestDigests:[sha(command)]};
globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify(policy);
function fixture({held=true}={}){
 const workspaceId=randomUUID(),jobId=randomUUID(),requestId='owner-request-'+randomUUID(),data=JSON.stringify({files:baseline,revision:3});
 const payload={workerKind:'windows-appcontainer',testProfile:'snapshot',baseline},result={checks:{passed:true},candidate:{patches:[{path:'src/value.mjs',before:baseline[0].content,after:files[0].content}],experts:[]},...(held?{verificationOwner:{requestId,inputDigest:'f'.repeat(64),state:'reserved'}}:{})};
 sql.prepare("INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) VALUES(?,'project','Fixture','','active',?,'now','now')").run(workspaceId,data);
 sql.prepare("INSERT INTO jobs(id,project_id,objective,mode,status,phase,payload,result,created_at,updated_at) VALUES(?,?,?,'account','awaiting review','review',?,?,'now','now')").run(jobId,workspaceId,'Exact approved fixture behavior',JSON.stringify(payload),JSON.stringify(result));
 return {workspaceId,jobId,requestId,data};
}
const result=id=>JSON.parse(sql.prepare('SELECT result FROM jobs WHERE id=?').get(id).result);
const admission=async f=>{const b=await jobs.engineeringBinding(f.jobId,f.workspaceId);return {requestId:f.requestId,binding:Object.fromEntries(['workspaceId','jobId','sourceDigest','candidateDigest','testManifestDigest','workspaceDataDigest'].map(k=>[k,b[k]]))};};
test('current native binding uses original candidate, immutable oracle, workspace and enrolled policy',async()=>{
 const f=fixture(),binding=await jobs.engineeringBinding(f.jobId,f.workspaceId);
 assert.equal(binding.sourceDigest,sha(baseline));assert.equal(binding.candidateDigest,sha(files));assert.equal(binding.testManifestDigest,sha(command));assert.equal(binding.workspaceDataDigest,sha(JSON.parse(f.data)));assert.equal(binding.currentBindingVerified,true);assert.equal(binding.workspaceRevision,3);assert.equal(binding.policyIdentity.hostId,policy.hostId);
 await assert.rejects(jobs.engineeringBinding(f.jobId,randomUUID()),/scope/);
});
test('binding distinguishes changed workspace from a valid applied candidate',async()=>{
 const f=fixture();sql.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({files:[],revision:4}),f.workspaceId);assert.equal((await jobs.engineeringBinding(f.jobId,f.workspaceId)).currentBindingVerified,false);
 sql.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({files,revision:4}),f.workspaceId);sql.prepare("UPDATE jobs SET status='applied' WHERE id=?").run(f.jobId);assert.equal((await jobs.engineeringBinding(f.jobId,f.workspaceId)).currentBindingVerified,true);
});
test('binding refuses a changed job during its asynchronous observation',async()=>{
 const f=fixture();onJobRead=()=>sql.prepare('UPDATE jobs SET objective=? WHERE id=?').run('Changed objective',f.jobId);await assert.rejects(jobs.engineeringBinding(f.jobId,f.workspaceId),/changed during binding/);
});
test('reserved verification admits only its exact internal request and current bound source',async()=>{
 const f=fixture(),context=await admission(f);await assert.rejects(jobs.workerJob(f.jobId,'windows-appcontainer'),/ownership is held/);
 await assert.rejects(jobs.workerJob(f.jobId,'windows-appcontainer',{...context,requestId:'other'}),/ownership|verification/);
 const assigned=await jobs.workerJob(f.jobId,'windows-appcontainer',context);assert.equal(assigned.workerKind,'windows-appcontainer');assert.ok(assigned.assignment.trilogyLink);assert.equal(result(f.jobId).nativeExecutionUnknown,true);assert.equal(result(f.jobId).verificationOwner.requestId,f.requestId);await assert.rejects(jobs.workerJob(f.jobId,'windows-appcontainer',context),/reconciliation/);
});
for(const field of ['workspaceId','jobId','sourceDigest','candidateDigest','testManifestDigest','workspaceDataDigest'])test('internal verification claim refuses substituted '+field,async()=>{
 const f=fixture(),context=await admission(f);context.binding[field]=field.endsWith('Digest')?'0'.repeat(64):randomUUID();await assert.rejects(jobs.workerJob(f.jobId,'windows-appcontainer',context));assert.equal(result(f.jobId).workerAssignment,undefined);
});
test('project edit immediately before claim SQL cannot retain an obsolete assignment',async()=>{
 const f=fixture(),context=await admission(f);onRun=()=>sql.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({files:baseline,revision:4}),f.workspaceId);await assert.rejects(jobs.workerJob(f.jobId,'windows-appcontainer',context),/Candidate changed/);assert.equal(result(f.jobId).workerAssignment,undefined);
});
test('internal admission cannot waive an unreserved job or unknown execution',async()=>{
 const f=fixture({held:false}),context=await admission(f);await assert.rejects(jobs.workerJob(f.jobId,'windows-appcontainer',context),/verification/);assert.equal(result(f.jobId).workerAssignment,undefined);
 const g=fixture(),gctx=await admission(g);sql.prepare('UPDATE jobs SET result=? WHERE id=?').run(JSON.stringify({...result(g.jobId),nativeExecutionUnknown:true}),g.jobId);await assert.rejects(jobs.workerJob(g.jobId,'windows-appcontainer',gctx),/ownership|verification|reconciliation/);
});
