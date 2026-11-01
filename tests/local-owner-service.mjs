import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {nativeLauncherDigest,nativeRuntimeDigest} from '../worker/windows-appcontainer.mjs';
const token=()=>randomBytes(32).toString('hex');
async function fixture(t,{engineering=false}={}){
 const root=await mkdtemp(join(tmpdir(),'omni-owner-service-')),stateRoot=join(root,'state');await mkdir(stateRoot);
 const config={deployment:'owner',stateRoot,ownerToken:token(),nativeWorkerToken:token(),tenantId:'fixture-tenant',actorId:'fixture-owner',port:0};
 if(engineering){config.engineeringToken=token();config.nativePolicyPath=join(stateRoot,'native-policy.json');config.nativeWorkerRoot=join(stateRoot,'native-attempts');config.nativeReceiptRoot=join(stateRoot,'worker-receipts');config.workerPolicy={version:1,enabled:true,hostId:'11111111-1111-4111-8111-111111111111',launcherSha256:await nativeLauncherDigest(),runtimeSha256:await nativeRuntimeDigest(),qualificationDigest:'c'.repeat(64),scope:'approved-mgr-snapshot',allowedSourceDigests:['d'.repeat(64)],allowedCandidateDigests:['e'.repeat(64)],allowedTestManifestDigests:['f'.repeat(64)]};await writeFile(config.nativePolicyPath,JSON.stringify(config.workerPolicy));}
 let child=null,ended=null;
 async function open(patch={},requestPatch={}){
  let readyResolve,readyReject,buffer='',error='';const ready=new Promise((yes,no)=>{readyResolve=yes;readyReject=no;});
  child=spawn(process.execPath,['tests/fixtures/local-owner-service.mjs'],{cwd:resolve('.'),windowsHide:true,stdio:['pipe','pipe','pipe']});
  ended=new Promise((yes,no)=>{child.once('error',no);child.once('close',code=>{readyReject(Error('fixture-exited-before-ready '+code));yes(code);});});
  child.stdout.on('data',data=>{buffer+=data.toString();for(;;){const end=buffer.indexOf('\n');if(end<0)break;const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{const value=JSON.parse(line);if(Object.hasOwn(value,'ready'))readyResolve(value);}catch{readyReject(Error('fixture-protocol-invalid'));}}});child.stderr.on('data',data=>{error+=data.toString();if(error.length>4096)readyReject(Error('fixture-error-limit'));});
  child.stdin.write(JSON.stringify({config:{...config,...patch},...requestPatch})+'\n');let timer;try{return await Promise.race([ready,new Promise((_,no)=>{timer=setTimeout(()=>no(Error('fixture-start-timeout')),30000);})]);}finally{clearTimeout(timer);}
 }
 async function close(){if(!child)return;child.stdin.end();const code=await ended;child=null;assert.equal(code,0,'fixture original service closes normally');}
 t.after(async()=>{if(child){child.stdin.end();await ended;child=null;}await rm(root,{recursive:true,force:true});});
 const request=(origin,path,body,credential=config.ownerToken,extra={})=>fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+credential,'x-tenant-id':config.tenantId,'x-actor-id':config.actorId,'content-type':'application/json',connection:'close',...extra},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 return {root,stateRoot,config,open,close,request,get ended(){return ended;}};
}
test('owner service uses protected-root callback, original route storage and source-pinned runtime across restart',async t=>{
 const f=await fixture(t),first=await f.open();assert.equal(first.ready,true);assert.match(first.sourceFingerprint,/^[a-f0-9]{64}$/);
 const response=await f.request(first.origin,'/api/workspace',{action:'import',title:'Actual owner route fixture',files:[{path:'src/value.mjs',content:'export const value=1;\n'}]});assert.equal(response.status,200);const result=await response.json();assert.ok(result.projectId);
 assert.equal((await f.request(first.origin,'/api/runtime',{action:'enqueue',projectId:result.projectId,objective:'Do not call a model',mode:'ai'})).status,403);
 await f.close();const second=await f.open();assert.equal(second.ready,true);assert.equal(second.sourceFingerprint,first.sourceFingerprint);
 const db=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'),{readOnly:true});try{assert.ok(db.prepare("SELECT id FROM records WHERE kind='project' AND id=?").get(result.projectId));assert.equal(db.prepare('SELECT count(*) n FROM jobs').get().n,0);}finally{db.close();}
 await f.close();
});
test('owner mode refuses absent host permission verification and a denied private root before database creation',async t=>{
 const f=await fixture(t);const {startLocalWorkerApi}=await import('../scripts/local-worker-api.mjs');await assert.rejects(startLocalWorkerApi(f.config),/private-state verification/);
 const rejected=await f.open({}, {rejectPrivate:true});assert.equal(rejected.ready,false);await f.ended;
 await assert.rejects(readFile(join(f.stateRoot,'omnidev.sqlite')),e=>e.code==='ENOENT');
});
test('owner service denies wrong credentials, cross-origin and foreign principals without admitting model work',async t=>{
 const f=await fixture(t),ready=await f.open();assert.equal(ready.ready,true);
 assert.equal((await f.request(ready.origin,'/api/workspace',undefined,'wrong')).status,401);
 assert.equal((await f.request(ready.origin,'/api/workspace',undefined,f.config.ownerToken,{'x-actor-id':'foreign'})).status,403);
 assert.equal((await f.request(ready.origin,'/api/workspace',undefined,f.config.ownerToken,{origin:'https://foreign.invalid'})).status,403);
 assert.equal((await f.request(ready.origin,'/api/worker',undefined,f.config.ownerToken)).status,401);
 await f.close();
});
test('a second process cannot replace the original live service in the same owner root',async t=>{
 const f=await fixture(t),ready=await f.open();assert.equal(ready.ready,true);
 const other=spawn(process.execPath,['tests/fixtures/local-owner-service.mjs'],{cwd:resolve('.'),windowsHide:true,stdio:['pipe','pipe','pipe']});let output='';other.stdout.on('data',b=>output+=b.toString());other.stderr.on('data',()=>{});other.stdin.end(JSON.stringify({config:f.config})+'\n');const code=await new Promise((yes,no)=>{other.once('error',no);other.once('close',yes);});assert.equal(code,1);assert.match(output,/"ready":false/);assert.equal((await f.request(ready.origin,'/api/runtime')).status,200);await f.close();
});
test('actual native-policy binding service enforces engineering credential and body budget without native admission',async t=>{
 if(process.platform!=='win32'){t.skip('Actual native policy loader requires Windows; other route/SQLite checks are portable');return;}
 const f=await fixture(t,{engineering:true}),ready=await f.open();assert.equal(ready.ready,true);
 assert.equal((await f.request(ready.origin,'/v1/engineering/verifications/missing',undefined,f.config.ownerToken)).status,401);
 assert.equal((await f.request(ready.origin,'/v1/engineering/verifications/missing',undefined,f.config.engineeringToken,{'x-tenant-id':'foreign'})).status,403);
 assert.equal((await f.request(ready.origin,'/v1/engineering/verifications',{oversized:'x'.repeat(9000)},f.config.engineeringToken)).status,400);
 const db=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'),{readOnly:true});try{assert.equal(db.prepare("SELECT count(*) n FROM records WHERE kind='engineering_verify'").get().n,0);assert.equal(db.prepare('SELECT count(*) n FROM jobs').get().n,0);}finally{db.close();}
 await f.close();
});

test('native receiver decodes identifiers once and body reads recover literal dot segments',async t=>{
 if(process.platform!=='win32'){t.skip('Actual native policy loader requires Windows');return;}
 const f=await fixture(t,{engineering:true}),ready=await f.open();assert.equal(ready.ready,true);
 const {canonical}=await import('../scripts/engineering-verifications.mjs');
 const digest=x=>createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex'),workspaceId=randomUUID(),jobId=randomUUID(),identities=['.','..','owner:trial_revision','_draft','-draft'];
 const db=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'));
 try{for(const requestId of identities){const input={requestId,workspaceId,jobId,sourceDigest:'d'.repeat(64),candidateDigest:'e'.repeat(64),testManifestDigest:'f'.repeat(64)},identity={actorId:f.config.actorId,tenantId:f.config.tenantId},record={...identity,...input,inputDigest:digest({...identity,...input}),policyIdentity:Object.fromEntries(['hostId','launcherSha256','runtimeSha256','qualificationDigest'].map(k=>[k,f.config.workerPolicy[k]])),revision:0,status:'cancelled',cancelRequested:true};db.prepare("INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) VALUES(?,'engineering_verify','Synthetic retained cancellation','','cancelled',?,'now','now')").run('engineering-verification:'+digest({...identity,requestId}),JSON.stringify(record));}}finally{db.close();}
 for(const requestId of identities){const dot=requestId==='.'||requestId==='..',path=dot?'/v1/engineering/verification-status':'/v1/engineering/verifications/'+encodeURIComponent(requestId),response=await f.request(ready.origin,path,dot?{requestId}:undefined,f.config.engineeringToken);assert.equal(response.status,200);assert.equal((await response.json()).requestId,requestId);}
 for(const value of ['%2e','outside/path'])assert.equal((await f.request(ready.origin,'/v1/engineering/verifications/'+encodeURIComponent(value),undefined,f.config.engineeringToken)).status,400);
 assert.equal((await f.request(ready.origin,'/v1/engineering/verification-status',{requestId:'.',extra:'denied'},f.config.engineeringToken)).status,400);
 const inspected=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'),{readOnly:true});try{assert.equal(inspected.prepare('SELECT count(*) n FROM jobs').get().n,0);}finally{inspected.close();}
 await f.close();
});
