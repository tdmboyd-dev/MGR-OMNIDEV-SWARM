import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {runNativeWithBackpack} from '../scripts/native-backpack-context.mjs';
import {runOnce} from '../worker/windows-worker.mjs';
import {nativeLauncherDigest,nativeRuntimeDigest} from '../worker/windows-appcontainer.mjs';

const toolkit=process.env.MGR_BACKPACK_TEST_ROOT||path.resolve(import.meta.dirname,'../../../../outputs/MGR-BACKPACK');
const peer=fs.existsSync(path.join(toolkit,'src/host-config.js'));
const optional={skip:peer?false:'Optional reviewed Backpack SDK peer is not installed; this integration is unverified here.'};
async function fixture(t){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'omni-backpack-context-')),root=path.join(base,'source');fs.mkdirSync(root);fs.writeFileSync(path.join(root,'source.md'),'Reviewed source anchor.');
 const {Backpack}=await import(pathToFileURL(path.join(toolkit,'src/engine.js')).href),config={dataDir:path.join(base,'store'),roots:[root],actor:'owned-context-fixture'},file=path.join(base,'backpack.json');fs.writeFileSync(file,JSON.stringify(config));let engine=new Backpack(config);engine.register({id:'project',root,purpose:'Owned integration fixture',owner:'fixture'});engine.close();
 t.after(()=>{assert.equal(path.dirname(fs.realpathSync(base)),fs.realpathSync(os.tmpdir()));assert(path.basename(base).startsWith('omni-backpack-context-'));fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:100});});
 return {base,root,config,file,Backpack,input:{workerConfigPath:path.join(base,'worker.json'),expectedJobId:randomUUID(),backpack:{toolkitRoot:toolkit,configPath:file,project:'project',sourcePath:'source.md',record:true}}};
}
test('required Backpack context precedes the exact job and source-linked note reopens without copied jobs',optional,async t=>{
 const f=await fixture(t);let called=0;const result=await runNativeWithBackpack(f.input,{execute:async(file,options)=>{called++;assert.equal(file,f.input.workerConfigPath);assert.equal(options.expectedJobId,f.input.expectedJobId);assert.equal(options.context.project.id,'project');return {claimed:1,jobId:options.expectedJobId,passed:true};}});
 assert.equal(called,1);assert.equal(result.backpack.recorded,true);const e=new f.Backpack(f.config);try{const m=e.memories('project',result.backpack.memoryKey);assert.equal(m.length,1);assert.equal(m[0].current,true);assert(m[0].text.includes('passed'));assert.equal(e.listTasks('project').items.length,0);assert.equal(e.listRuns('project').items.length,0);}finally{e.close();}
});
test('missing enrollment and excluded source refuse before the worker is called',optional,async t=>{
 const f=await fixture(t);let called=0;const execute=async()=>{called++;throw Error('must not dispatch');};await assert.rejects(runNativeWithBackpack({...f.input,backpack:{...f.input.backpack,project:'missing'}},{execute}));fs.writeFileSync(path.join(f.root,'.env'),'DO_NOT_DELIVER');await assert.rejects(runNativeWithBackpack({...f.input,backpack:{...f.input.backpack,sourcePath:'.env'}},{execute}));assert.equal(called,0);
});
test('source drift after execution preserves actual job result but refuses a current-source note',optional,async t=>{
 const f=await fixture(t);const r=await runNativeWithBackpack(f.input,{execute:async()=>{fs.writeFileSync(path.join(f.root,'source.md'),'changed by another writer');return {claimed:1,jobId:f.input.expectedJobId,passed:true};}});assert.equal(r.passed,true);assert.equal(r.backpack.recorded,false);assert.equal(r.backpack.recordError,'SOURCE_CHANGED_AFTER_RUN');
});
test('record-off keeps the existing store unchanged and does not turn context into authority',optional,async t=>{
 const f=await fixture(t),e=new f.Backpack(f.config),before=e.verifyLedger();e.close();const result=await runNativeWithBackpack({...f.input,backpack:{...f.input.backpack,record:false}},{execute:async()=>({claimed:0,delivered:[]})});assert.equal(result.backpack.recorded,false);const after=new f.Backpack(f.config);try{assert.deepEqual(after.verifyLedger(),before);assert.equal(after.memories('project').length,0);}finally{after.close();}
});
test('unknown native outcome never triggers another execution or manufactures passing memory',optional,async t=>{
 const f=await fixture(t);let calls=0;await assert.rejects(runNativeWithBackpack(f.input,{execute:async()=>{calls++;throw Error('worker outcome requires reconciliation');}}),/reconciliation/);assert.equal(calls,1);const e=new f.Backpack(f.config);try{assert.equal(e.memories('project').length,0);}finally{e.close();}
});
test('foreign worker result cannot be associated with the configured project/job',optional,async t=>{
 const f=await fixture(t);await assert.rejects(runNativeWithBackpack(f.input,{execute:async()=>({claimed:1,jobId:randomUUID(),passed:true})}),/exact owner-bound job/);
});
test('malformed job identity rejects before native policy load or network',async()=>{await assert.rejects(runOnce('unused-config.json',{expectedJobId:'not-a-job'}),/Exact native job identity/);});
test('a different queued native job is refused before any claim or sandbox dispatch',{skip:process.platform!=='win32'?'Windows-only native policy preflight.':false},async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'omni-backpack-queue-')),policyPath=path.join(base,'policy.json'),workerPath=path.join(base,'worker.json');
 const policy={version:1,enabled:true,hostId:randomUUID(),launcherSha256:await nativeLauncherDigest(),runtimeSha256:await nativeRuntimeDigest(),qualificationDigest:'a'.repeat(64),scope:'approved-mgr-snapshot',allowedSourceDigests:['b'.repeat(64)],allowedCandidateDigests:['c'.repeat(64)],allowedTestManifestDigests:['d'.repeat(64)]};fs.writeFileSync(policyPath,JSON.stringify(policy));let claims=0;const server=createServer((req,res)=>{if(req.url!=='/api/worker?kind=windows-appcontainer')claims++;res.setHeader('content-type','application/json');res.end(JSON.stringify({jobs:[{id:randomUUID()}]}));});server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(async()=>{server.closeAllConnections();await new Promise(done=>server.close(done));assert.equal(path.dirname(fs.realpathSync(base)),fs.realpathSync(os.tmpdir()));fs.rmSync(base,{recursive:true,force:true,maxRetries:5,retryDelay:100});});
 fs.writeFileSync(workerPath,JSON.stringify({siteUrl:'http://127.0.0.1:'+server.address().port,nativeWorkerToken:'owned-preclaim-token-not-a-live-secret',nativePolicyPath:policyPath,nativeReceiptRoot:path.join(base,'receipts'),tenantId:'fixture',actorId:'fixture'}));await assert.rejects(runOnce(workerPath,{expectedJobId:randomUUID()}),/no claim dispatched/);assert.equal(claims,0);assert(!fs.readdirSync(path.join(base,'receipts')).some(n=>n.startsWith('active-')));
});


test('a claimed job without a boolean execution verdict cannot manufacture a host verification',optional,async t=>{
 const f=await fixture(t);await assert.rejects(runNativeWithBackpack(f.input,{execute:async()=>({claimed:1,jobId:f.input.expectedJobId})}),/exact owner-bound job/);
});
