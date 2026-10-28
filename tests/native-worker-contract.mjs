import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const sql=new DatabaseSync(':memory:');
for(const path of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(path,'utf8'));
class Statement{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Statement(this.query,args);}async first(){return sql.prepare(this.query).get(...this.args)??null;}async all(){return {results:sql.prepare(this.query).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}}
globalThis.__omniEnv={OMNI_WORKER_TOKEN:'docker-contract-test-token',OMNI_WINDOWS_WORKER_TOKEN:'native-contract-test-token',DB:{prepare:q=>new Statement(q)}};
const {nativeWorkerPolicy,nativeAssignment,validateNativeReport,validateNativeOracle,nativeCommand}=await import('../.test-runtime/worker-policy.mjs');
const {workerJob,submitAccountCandidate}=await import('../.test-runtime/jobs.mjs');
const route=await import('../.test-runtime/worker-route.mjs');
const nonce='ae2a26fb-55f5-453e-9f48-6fe56812e783';
const unitPolicy={version:1,enabled:true,hostId:'contract-test-not-an-enrolled-host',launcherSha256:'a'.repeat(64),runtimeSha256:'b'.repeat(64),qualificationDigest:'c'.repeat(64),scope:'approved-mgr-snapshot',allowedSourceDigests:['d'.repeat(64)],allowedCandidateDigests:['e'.repeat(64)],allowedTestManifestDigests:['f'.repeat(64)]};
const scope={sourceDigest:'d'.repeat(64),candidateDigest:'e'.repeat(64),testManifestDigest:'f'.repeat(64)};
// This file verifies rejection/contracts only. These manufactured policy hashes never qualify an OS or execute project code.
test('native enrollment is absent by default, malformed policy/nonce deny, and missing policy never writes an assignment',async()=>{
 assert.equal(nativeWorkerPolicy(),null);assert.throws(()=>nativeAssignment(nonce),/not enrolled/);assert.throws(()=>nativeAssignment('../../other'),/nonce/);
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify({...unitPolicy,enabled:false});assert.throws(()=>nativeWorkerPolicy(),/invalid/);delete globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON;
 const payload={workerKind:'windows-appcontainer',baseline:[{path:'tests/omni-snapshot.test.mjs',content:'// owner-approved oracle'}],testProfile:'snapshot'},result={checks:{passed:true},candidate:{patches:[]}};
 sql.prepare('INSERT INTO jobs(id,project_id,objective,mode,status,phase,payload,result,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run('native-no-policy','project','contract denial only','native','awaiting review','review',JSON.stringify(payload),JSON.stringify(result),'now','now');
 await assert.rejects(workerJob('native-no-policy','windows-appcontainer'),/not enrolled/);assert.deepEqual(JSON.parse(sql.prepare('SELECT result FROM jobs WHERE id=?').get('native-no-policy').result),result);await assert.rejects(workerJob('native-no-policy'),/different worker/);
});
test('native credentials cannot use Docker scope, model/audit/recovery actions, or another worker report identity',async()=>{
 const get=(kind,token)=>route.GET(new Request('https://omni.example/api/worker?kind='+kind,{headers:{Authorization:'Bearer '+token}}));
 assert.equal((await get('windows-appcontainer','wrong')).status,401);
 assert.equal((await get('windows-appcontainer','docker-contract-test-token')).status,403);
 assert.equal((await get('docker-isolated','native-contract-test-token')).status,403);
 for(const action of ['tick','review','recover','auditStep']){const response=await route.POST(new Request('https://omni.example/api/worker',{method:'POST',headers:{Authorization:'Bearer native-contract-test-token'},body:JSON.stringify({action,id:'unrelated'})}));assert.equal(response.status,403,action);}
 const response=await route.POST(new Request('https://omni.example/api/worker',{method:'POST',headers:{Authorization:'Bearer native-contract-test-token'},body:JSON.stringify({worker:'docker-isolated',id:'unrelated'})}));assert.equal(response.status,403);
});
test('native report rejects changed host/runtime/qualification/profile and incomplete process/cleanup proof',()=>{
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify(unitPolicy);
 const assignment={id:nonce,...nativeAssignment(nonce,scope),...scope,profile:'snapshot',expiresAt:Date.now()+60000};
 for(const key of ['hostId','launcherSha256','runtimeSha256','qualificationDigest','profileName'])assert.throws(()=>validateNativeReport(assignment,{assignment:{...assignment,[key]:'changed'}}),/changed/);
 const common={worker:'windows-appcontainer',assignment,...unitPolicy};
 assert.throws(()=>validateNativeReport(assignment,common),/boundary receipt/);
 // A claimed AppContainer flag with absent actual cleanup is insufficient.
 const native={profileName:assignment.profileName,packageSid:'S-1-15-2-1-2-3-4-5-6-7',tokenIsAppContainer:true,capabilityCount:0,jobAssignedAtCreation:true};
 assert.throws(()=>validateNativeReport(assignment,{...common,native}),/cleanup/);
 for(const cleanup of [{verifiedAbsent:false},{verifiedAbsent:true,activeProcessesAfter:1,profileDeletionHResult:0,workspaceAbsent:true},{verifiedAbsent:true,activeProcessesAfter:0,profileDeletionHResult:5,workspaceAbsent:true},{verifiedAbsent:true,activeProcessesAfter:0,profileDeletionHResult:0,workspaceAbsent:false}])assert.throws(()=>validateNativeReport(assignment,{...common,native,cleanup}),/cleanup/);
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify({...unitPolicy,runtimeSha256:'d'.repeat(64)});assert.throws(()=>validateNativeReport(assignment,common),/changed/);delete globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON;
});

test('native source/candidate/command allowlists, immutable oracle and distinct credentials are enforced',async()=>{
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify(unitPolicy);
 for(const key of ['sourceDigest','candidateDigest','testManifestDigest'])assert.throws(()=>nativeAssignment(nonce,{...scope,[key]:'9'.repeat(64)}),/outside approved snapshot/);
 assert.deepEqual([...nativeCommand],['node','--preserve-symlinks','--preserve-symlinks-main','--test','--test-isolation=none','tests/omni-snapshot.test.mjs']);
 const original=[{path:'tests/omni-snapshot.test.mjs',content:'real immutable owner oracle'}];
 assert.throws(()=>validateNativeOracle([],original),/unchanged owner-approved/);assert.throws(()=>validateNativeOracle(original,[]),/unchanged owner-approved/);assert.throws(()=>validateNativeOracle(original,[{...original[0],content:'weakened'}]),/unchanged owner-approved/);validateNativeOracle(original,original);
 const saved=globalThis.__omniEnv.OMNI_WINDOWS_WORKER_TOKEN;globalThis.__omniEnv.OMNI_WINDOWS_WORKER_TOKEN=globalThis.__omniEnv.OMNI_WORKER_TOKEN;
 const response=await route.GET(new Request('https://omni.example/api/worker?kind=windows-appcontainer',{headers:{Authorization:'Bearer '+saved}}));assert.equal(response.status,503);assert.match((await response.json()).error,/distinct/);globalThis.__omniEnv.OMNI_WINDOWS_WORKER_TOKEN=saved;delete globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON;
});

test('model output cannot weaken the native test oracle before candidate persistence',async()=>{
 const id='native-no-policy',row=sql.prepare('SELECT * FROM jobs WHERE id=?').get(id),payload=JSON.parse(row.payload);sql.prepare("UPDATE jobs SET mode='account',status='queued' WHERE id=?").run(id);
 const {fingerprint}=await import('../.test-runtime/control-plane.mjs');
 await assert.rejects(submitAccountCandidate(id,{jobId:id,sourceDigest:await fingerprint(payload.baseline),candidate:{summary:'weakened test',patches:[{path:'tests/omni-snapshot.test.mjs',before:payload.baseline[0].content,after:'// weakened'}],experts:[]}}),/unchanged owner-approved test oracle/);
 const saved=sql.prepare('SELECT status,result FROM jobs WHERE id=?').get(id);assert.equal(saved.status,'queued');assert.equal(saved.result,row.result);
});
