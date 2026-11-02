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

test('prepared policy changes block direct service startup until original records are reconciled',async t=>{
 const f=await fixture(t);assert.equal((await f.open()).ready,true);await f.close();
 const db=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'));try{db.prepare("INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) VALUES('policy-interruption','native_policy_change','Original pending policy','','prepared','{\"state\":\"prepared\"}','now','now')").run();}finally{db.close();}
 const refused=await f.open();assert.equal(refused.ready,false);assert.equal(await f.ended,1);
 const reconcile=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'));try{assert.equal(reconcile.prepare("SELECT status FROM records WHERE id='policy-interruption'").get().status,'prepared');assert.equal(reconcile.prepare('SELECT count(*) n FROM jobs').get().n,0);reconcile.prepare("UPDATE records SET status='committed',data='{\"state\":\"committed\"}' WHERE id='policy-interruption'").run();}finally{reconcile.close();}
 assert.equal((await f.open()).ready,true);await f.close();
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

const trilogyConfig=(f,projectId='selected-project',readJobId='selected-job')=>({scope:{ownerId:f.config.actorId,projectId,repositoryId:'fixture/project'},ownerToken:token(),bridgeToken:token(),readToken:token(),readJobId});

test('configured original Trilogy route reaches its own scope checks without native-worker authority',async t=>{
 const f=await fixture(t),trilogy=trilogyConfig(f),ready=await f.open({trilogy});assert.equal(ready.ready,true);
 const response=await f.request(ready.origin,'/api/trilogy?jobId=selected-job&action=grant',undefined,trilogy.bridgeToken);
 assert.equal(response.status,403);assert.match((await response.json()).error,/scope refused/i);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await f.request(ready.origin,'/api/trilogy?jobId=selected-job&action=grant',undefined,f.config.ownerToken)).status,401);
 assert.equal((await f.request(ready.origin,'/api/worker',undefined,trilogy.bridgeToken)).status,401);
 assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'publish',jobId:'selected-job',authorizationId:'none'},trilogy.ownerToken)).status,403);
 await f.close();
});

test('Trilogy startup refuses shared credentials before database creation',async t=>{
 const f=await fixture(t),trilogy=trilogyConfig(f);trilogy.bridgeToken=f.config.ownerToken;
 assert.equal((await f.open({trilogy})).ready,false);assert.equal(await f.ended,1);
 await assert.rejects(readFile(join(f.stateRoot,'omnidev.sqlite')),e=>e.code==='ENOENT');
});


const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const canonicalText=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0)):v);
function originalPlan(job){
 const body={contract:'mgr.imprint.plan.v1',commit:'a'.repeat(40),method:'slot-composition',state:'PROPOSED_NOT_APPLIED',stamp:{id:'LocalTransportFixture',version:1,sha256:'c'.repeat(64)},selection:{contract:'mgr.slot-machine.selection.v1',order:['Content'],decisions:[{slotId:'Content',optionId:'Native',optionSha256:'d'.repeat(64),declaredPreference:0,frozen:false,reason:'Explicit protocol fixture'}],searchSteps:1},proposals:job.result.candidate.patches.map(p=>({path:p.path,operation:p.before===null?'create':'update',beforeHash:p.before===null?null:digest(p.before),afterHash:digest(p.after),risk:'verification-required',status:'PROPOSED_NOT_APPLIED'})),requiresTests:true,requiresOwnerApproval:true,confidence:'unassessed',applied:0,verified:0,performance:{speedup:null,benchmarkStatus:'not-measured'}};
 const planSha256=digest(canonicalText(body));return {...body,id:'IMP-'+planSha256.slice(0,24),planSha256};
}

test('original HTTP import job authority stage restart replay and revoke persist in the SAME owner database',async t=>{
 const f=await fixture(t),trilogy=trilogyConfig(f);let ready=await f.open({trilogy},{githubFixture:{}});assert.equal(ready.ready,true);
 for(const location of ['foreign/repo','https://github.com/fixture/project/extra'])assert.equal((await f.request(ready.origin,'/api/workspace',{action:'github',location})).status,403);
 const imported=await f.request(ready.origin,'/api/workspace',{action:'github',location:'https://github.com/fixture/project',sourceIdentity:'exact-reviewed-git'});assert.equal(imported.status,200);const {projectId}=await imported.json();
 await f.close();trilogy.scope.projectId=projectId;ready=await f.open({trilogy});assert.equal(ready.ready,true);
 for(const body of [{mode:'ai'},{projectId:'foreign-project'},{automaticReview:true},{automaticRepair:true},{testProfile:'unregistered'}])assert.equal((await f.request(ready.origin,'/api/runtime',{action:'enqueue',mode:'account',workerKind:'docker-isolated',testProfile:'snapshot',projectId,objective:'Exercise original job authority without execution',...body})).status,403);
 let response=await f.request(ready.origin,'/api/runtime',{action:'enqueue',mode:'account',workerKind:'docker-isolated',testProfile:'snapshot',projectId,objective:'Exercise original job authority without execution'});assert.equal(response.status,200);const jobId=(await response.json()).result.id;
 response=await f.request(ready.origin,'/api/runtime?action=accountRequest&id='+encodeURIComponent(jobId));assert.equal(response.status,200);const account=await response.json();assert.equal(account.jobId,jobId);assert.equal(account.files[0].content,'export const value=1;\n');
 response=await f.request(ready.origin,'/api/runtime',{action:'submitAccountCandidate',id:jobId,candidate:{jobId,sourceDigest:account.sourceDigest,candidate:{summary:'A staged fixture change, no execution',patches:[{path:'src/value.js',before:account.files[0].content,after:'export const value=2;\n'}]}}});assert.equal(response.status,200);const job=(await response.json()).result;assert.equal(job.status,'awaiting review');
 await f.close();trilogy.readJobId=jobId;ready=await f.open({trilogy});assert.equal(ready.ready,true);
 const plan=originalPlan(job),path='/api/trilogy?jobId='+encodeURIComponent(jobId);
 for(const credential of [f.config.ownerToken,f.config.nativeWorkerToken,trilogy.bridgeToken,trilogy.readToken])assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'authorize',jobId,plan},credential)).status,401);
 response=await f.request(ready.origin,'/api/trilogy',{action:'authorize',jobId,plan},trilogy.ownerToken);assert.equal(response.status,200);const granted=await response.json();assert.equal(granted.grant.permission,'candidate-only');
 response=await f.request(ready.origin,path+'&action=grant',undefined,trilogy.bridgeToken);assert.equal(response.status,200);assert.equal((await response.json()).grant.grantId,granted.grant.grantId);
 const {contract,...binding}=granted.grant.request,identity='trilogy:'+digest(canonicalText({jobId,ownerId:trilogy.scope.ownerId,projectId,repositoryId:trilogy.scope.repositoryId})),events=['trilogy.job_bound','task.batch_planned','trilogy.candidate_staged'].map((kind,sequence)=>({kind,sequence,hash:digest(kind+sequence)}));
 const result={contract:'mgr.trilogy.job-result.v1',binding,requestSha256:granted.grant.requestSha256,sourceDigest:granted.grant.sourceDigest,state:'candidate-pending-independent-verification',candidateCommit:'e'.repeat(40),files:plan.proposals.map(({path,operation,beforeHash,afterHash})=>({path,operation,beforeHash,afterHash})),verification:null,evidence:{streamId:'campaign:'+identity,lastSequence:2,headHash:events.at(-1).hash,eventRefs:events},observedAt:new Date().toISOString(),requiresOwnerApproval:true,merged:false,released:false};
 for(const credential of [trilogy.ownerToken,trilogy.readToken])assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'result',jobId,result},credential)).status,401);
 assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'authorize',jobId,plan,executionApproved:true},trilogy.ownerToken)).status,400);
 assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'result',jobId,oversized:'x'.repeat(256001)},trilogy.bridgeToken)).status,400);
 response=await f.request(ready.origin,'/api/trilogy',{action:'result',jobId,result},trilogy.bridgeToken);assert.equal(response.status,200);assert.equal((await response.json()).replayed,false);
 assert.equal((await f.request(ready.origin,path+'&action=execution',undefined,trilogy.bridgeToken)).status,200);
 for(const action of ['publicationPreview','authorizePublication','publish','revokePublication','reconcilePublication'])assert.equal((await f.request(ready.origin,'/api/trilogy',{action,jobId},trilogy.ownerToken)).status,403);
 assert.equal((await f.request(ready.origin,path+'&action=publication',undefined,trilogy.ownerToken)).status,403);
 assert.equal((await f.request(ready.origin,path+'&jobId=another',undefined,trilogy.readToken)).status,400);
 assert.equal((await f.request(ready.origin,'/api/trilogy?jobId=another',undefined,trilogy.readToken)).status,403);
 assert.equal((await f.request(ready.origin,path,undefined,trilogy.readToken,{origin:'https://foreign.invalid'})).status,403);
 assert.equal((await f.request(ready.origin,'/api/runtime',{action:'apply',id:jobId})).status,400);
 await f.close();ready=await f.open({trilogy});assert.equal(ready.ready,true);
 response=await f.request(ready.origin,path,undefined,trilogy.readToken);assert.equal(response.status,200);const viewed=await response.json();assert.equal(viewed.result.state,result.state);assert.equal(viewed.execution.isolationVerified,false);assert.equal(viewed.execution.host,'unqualified');
 for(const secret of [trilogy.ownerToken,trilogy.bridgeToken,trilogy.readToken,account.files[0].content])assert.ok(!JSON.stringify(viewed).includes(secret));
 response=await f.request(ready.origin,'/api/trilogy',{action:'result',jobId,result},trilogy.bridgeToken);assert.equal(response.status,200);assert.equal((await response.json()).replayed,true);
 assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'revoke',jobId},trilogy.bridgeToken)).status,401);
 assert.equal((await f.request(ready.origin,'/api/trilogy',{action:'revoke',jobId},trilogy.ownerToken)).status,200);
 assert.equal((await f.request(ready.origin,path+'&action=grant',undefined,trilogy.bridgeToken)).status,403);
 await f.close();
 const db=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'),{readOnly:true});try{
  const project=JSON.parse(db.prepare('SELECT data FROM records WHERE id=?').get(projectId).data);assert.equal(project.origin.commit,'a'.repeat(40));assert.equal(project.origin.url,'https://github.com/fixture/project');
  const saved=JSON.parse(db.prepare('SELECT result FROM jobs WHERE id=?').get(jobId).result);assert.equal(saved.trilogy.grant.revoked,true);assert.deepEqual(saved.trilogy.result,result);assert.equal(saved.externalTests,null);
  assert.equal(db.prepare('SELECT count(*) n FROM jobs').get().n,1);assert.equal(db.prepare("SELECT count(*) n FROM records WHERE json_extract(data,'$.type')='TrilogyControl'").get().n,3);
  assert.ok(db.prepare("SELECT count(*) n FROM omni_local_http_audit WHERE principal='trilogy-owner' AND status=200").get().n>=2);
 }finally{db.close();}
});

import {localTrilogyPolicy} from '../scripts/local-trilogy-policy.mjs';
test('startup Trilogy scope and credentials are exact bounded owner-only data',()=>{
 const config={deployment:'owner',actorId:'owner',ownerToken:token(),nativeWorkerToken:token(),engineeringToken:token()},valid={scope:{ownerId:'owner',projectId:'project',repositoryId:'fixture/project'},ownerToken:token(),bridgeToken:token(),readToken:token(),readJobId:'job'};
 for(const mutation of [p=>p.scope.ownerId='foreign',p=>p.scope.extra=true,p=>p.readJobId='',p=>p.ownerToken='x'.repeat(513),p=>p.ownerToken='x'.repeat(31),p=>p.bridgeToken=p.readToken,p=>p.bridgeToken=config.nativeWorkerToken,p=>p.readToken=config.engineeringToken,p=>p.scope.repositoryId='https://foreign.invalid',p=>p.publish=true]){
  const p=structuredClone(valid);mutation(p);assert.throws(()=>localTrilogyPolicy({...config,trilogy:p}));
 }
 assert.throws(()=>localTrilogyPolicy({...config,deployment:'laboratory',trilogy:valid}));assert.equal(localTrilogyPolicy(config),null);
 const selected=localTrilogyPolicy({...config,trilogy:valid});valid.scope.projectId='changed';assert.equal(selected.scope.projectId,'project');assert.ok(Object.isFrozen(selected));assert.ok(Object.isFrozen(selected.scope));
});


test('original HTTP npm source import and registered application authority share one job without execution',async t=>{
 const f=await fixture(t),trilogy=trilogyConfig(f),files=[{path:'src/value.mjs',content:'export const value=1;\n'},{path:'package.json',content:JSON.stringify({name:'fixture',version:'1.0.0',scripts:{test:'node --test tests/application.test.mjs'}})},{path:'package-lock.json',content:JSON.stringify({name:'fixture',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'fixture',version:'1.0.0'}}})},{path:'tests/application.test.mjs',content:'import test from "node:test";import assert from "node:assert/strict";import {value} from "../src/value.mjs";test("application",()=>assert.equal(value,2));\n'}];
 let ready=await f.open({trilogy},{githubFixture:{files}});assert.equal(ready.ready,true);
 let response=await f.request(ready.origin,'/api/workspace',{action:'github',location:'fixture/project',sourceIdentity:'exact-reviewed-git'});assert.equal(response.status,200);const {projectId}=await response.json();
 await f.close();trilogy.scope.projectId=projectId;ready=await f.open({trilogy});assert.equal(ready.ready,true);
 response=await f.request(ready.origin,'/api/runtime',{action:'enqueue',mode:'account',workerKind:'docker-isolated',testProfile:'node-application',projectId,objective:'Register the imported real application recipe'});assert.equal(response.status,200);const jobId=(await response.json()).result.id;
 response=await f.request(ready.origin,'/api/runtime?action=accountRequest&id='+jobId);assert.equal(response.status,200);const account=await response.json();assert.equal(account.files.length,4);assert.equal(account.files.find(file=>file.path==='src/value.mjs').content,files[0].content);
 response=await f.request(ready.origin,'/api/runtime',{action:'submitAccountCandidate',id:jobId,candidate:{jobId,sourceDigest:account.sourceDigest,candidate:{summary:'Original npm application candidate',patches:[{path:'src/value.mjs',before:files[0].content,after:'export const value=2;\n'}]}}});assert.equal(response.status,200);const job=(await response.json()).result;
 response=await f.request(ready.origin,'/api/trilogy',{action:'authorize',jobId,plan:originalPlan(job)},trilogy.ownerToken);assert.equal(response.status,200);const {command}=await response.json();
 const {applicationDockerArgs}=await import('../worker/application-profile.mjs'),image='node@sha256:'+'a'.repeat(64),args=applicationDockerArgs('/fixture','fixture',image);assert.deepEqual([command.executable,...command.args],args.slice(args.indexOf(image)+1));
 await f.close();const db=new DatabaseSync(join(f.stateRoot,'omnidev.sqlite'),{readOnly:true});try{const saved=JSON.parse(db.prepare('SELECT result FROM jobs WHERE id=?').get(jobId).result);assert.equal(saved.trilogy.grant.request.commandId,'omni-node-application-v1');assert.equal(saved.externalTests,null);assert.equal(saved.workerAssignment,undefined);}finally{db.close();}
});
