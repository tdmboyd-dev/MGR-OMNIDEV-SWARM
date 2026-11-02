import {createHash,generateKeyPairSync,sign,randomBytes} from 'node:crypto';
import {openStore,closeStore,database,environment,importProject,writeProject} from './workspace-fixture.mjs';
export {closeStore,database,environment,writeProject};
export const contract=await import('../.test-runtime/trilogy-contract.mjs');
export const control=await import('../.test-runtime/trilogy-jobs.mjs');
export const route=await import('../.test-runtime/trilogy-route.mjs');
export const jobs=await import('../.test-runtime/jobs.mjs');
export const clone=value=>JSON.parse(JSON.stringify(value));
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const canon=contract.canonical;
export const dbSnapshot=()=>({records:database().prepare('SELECT * FROM records ORDER BY id').all(),jobs:database().prepare('SELECT * FROM jobs ORDER BY id').all()});
export const rawJob=id=>database().prepare('SELECT * FROM jobs WHERE id=?').get(id);
export const resultOf=id=>JSON.parse(rawJob(id).result);
export function mutateJob(id,fn){const row=rawJob(id),value={...row,payload:JSON.parse(row.payload),result:JSON.parse(row.result)};fn(value);database().prepare('UPDATE jobs SET payload=?,result=?,objective=?,status=? WHERE id=?').run(JSON.stringify(value.payload),JSON.stringify(value.result),value.objective,value.status,id);}
export async function post(payload,token,extra={}){const response=await route.POST(new Request('https://omni.example/api/trilogy',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...extra},body:JSON.stringify(payload)}));return {status:response.status,headers:response.headers,data:await response.json()};}
export async function get(jobId,token,action=''){const response=await route.GET(new Request('https://omni.example/api/trilogy?jobId='+encodeURIComponent(jobId)+(action?'&action='+action:''),{headers:token?{Authorization:'Bearer '+token}:{}}));return {status:response.status,headers:response.headers,data:await response.json()};}
export async function fixture(options={}){
 openStore();for(const key of Object.keys(environment))if(key!=='DB')delete environment[key];
 const keys=generateKeyPairSync('ed25519'),base=options.baseCommit||'a'.repeat(40),candidate='b'.repeat(40),ownerId='fixture-owner',repositoryId='fixture/project';
 const files=[{path:'src/value.mjs',content:'export const value=1;\n'},...(options.testProfile==='node-application'?[{path:'package.json',content:JSON.stringify({name:'fixture',version:'1.0.0',scripts:{test:options.applicationTestScript??'node --test tests/application.test.mjs'}})},{path:'package-lock.json',content:JSON.stringify({name:'fixture',version:'1.0.0',lockfileVersion:3,packages:{'':{name:'fixture',version:'1.0.0'}}})},{path:'tests/application.test.mjs',content:'import test from "node:test";import assert from "node:assert/strict";import {value} from "../src/value.mjs";test("application",()=>assert.equal(value,2));\n'}]:[])];
 const project=await importProject('Trilogy fixture',files.filter(f=>!options.omitApplicationLock||f.path!=='package-lock.json'));
 await writeProject(project.id,data=>{data.origin={url:'https://github.com/'+repositoryId,commit:base,ref:options.sourceRef||'main',partial:true};});
 const queued=await jobs.enqueue({mode:options.testProfile==='node-application'?'account':'native',testProfile:options.testProfile??'snapshot',projectId:project.id,objective:'Add snapshot integrity checks'});
 const account=options.testProfile==='node-application'?await jobs.accountRequest(queued.id):null;
 const job=account?await jobs.submitAccountCandidate(queued.id,{jobId:queued.id,sourceDigest:account.sourceDigest,candidate:{summary:'Application candidate fixture',patches:[{path:'src/value.mjs',before:files[0].content,after:'export const value=2;\n'}]}}):await jobs.tick(queued.id);
 const tokens={owner:randomBytes(32).toString('hex'),bridge:randomBytes(32).toString('hex'),reader:randomBytes(32).toString('hex'),worker:randomBytes(32).toString('hex')};
 Object.assign(environment,{OMNI_TRILOGY_SCOPE:JSON.stringify({ownerId,projectId:project.id,repositoryId}),OMNI_TRILOGY_OWNER_TOKEN:tokens.owner,OMNI_TRILOGY_BRIDGE_TOKEN:tokens.bridge,OMNI_TRILOGY_READ_TOKEN:tokens.reader,OMNI_WORKER_TOKEN:tokens.worker,OMNI_TRILOGY_READ_JOB_ID:job.id,OMNI_TRILOGY_VERIFIER_ID:'fixture-verifier',OMNI_TRILOGY_VERIFIER_PUBLIC_KEY:keys.publicKey.export({type:'spki',format:'pem'}),OMNI_TRILOGY_VERIFIER_REVOKED:'false'});
 const body={contract:'mgr.imprint.plan.v1',commit:base,method:'slot-composition',state:'PROPOSED_NOT_APPLIED',stamp:{id:'Fixture',version:1,sha256:'c'.repeat(64)},selection:{contract:'mgr.slot-machine.selection.v1',order:['Content'],decisions:[{slotId:'Content',optionId:'Native',optionSha256:'d'.repeat(64),declaredPreference:0,frozen:false,reason:'Explicit test fixture'}],searchSteps:1},proposals:job.result.candidate.patches.map(p=>({path:p.path,operation:p.before===null?'create':'update',beforeHash:p.before===null?null:hash(p.before),afterHash:hash(p.after),risk:'verification-required',status:'PROPOSED_NOT_APPLIED'})).sort((a,b)=>a.path.localeCompare(b.path)),requiresTests:true,requiresOwnerApproval:true,confidence:'unassessed',applied:0,verified:0,performance:{speedup:null,benchmarkStatus:'not-measured'}};
 const planSha256=hash(canon(body)),plan={...body,id:'IMP-'+planSha256.slice(0,24),planSha256};
 const actualCandidate=typeof options.candidateCommit==='function'?options.candidateCommit({job,base,project,plan}):candidate;
 const f={keys,base,candidate:actualCandidate,ownerId,repositoryId,project,job,tokens,plan};
 f.authorize=()=>post({action:'authorize',jobId:job.id,plan},tokens.owner);
 f.pending=async()=>{
  const granted=await f.authorize();if(granted.status!==200)throw Error(JSON.stringify(granted));const grant=granted.data.grant,request=grant.request,{contract:ignored,...binding}=request;
  const identity=await contract.executionIdentity(request),eventRefs=['trilogy.job_bound','task.batch_planned','trilogy.candidate_staged'].map((kind,sequence)=>({kind,sequence,hash:hash(kind+sequence)}));
  const result={contract:'mgr.trilogy.job-result.v1',binding,requestSha256:grant.requestSha256,sourceDigest:grant.sourceDigest,state:'candidate-pending-independent-verification',candidateCommit:actualCandidate,files:plan.proposals.map(({path,operation,beforeHash,afterHash})=>({path,operation,beforeHash,afterHash})),verification:null,evidence:{streamId:'campaign:'+identity.campaignId,lastSequence:2,headHash:eventRefs.at(-1).hash,eventRefs},observedAt:new Date().toISOString(),requiresOwnerApproval:true,merged:false,released:false};
  return {grant,request,result,command:granted.data.command};
 };
 f.verified=async pending=>{
  const output=Buffer.from('Local test fixture passed. This is not independent production evidence.\n'),identity=await contract.executionIdentity(pending.request),time=new Date().toISOString();
  const unsigned={version:2,campaignId:identity.campaignId,taskId:identity.taskId,baseCommit:base,targetCommit:actualCandidate,commandId:pending.request.commandId,commandSha256:pending.request.commandSha256,exitCode:0,outputSha256:hash(output),outputBytes:output.length,startedAt:time,endedAt:time};
  const receipt={...unsigned,signature:sign(null,Buffer.from(canon(unsigned)),keys.privateKey).toString('base64')};
  const verification={signerId:environment.OMNI_TRILOGY_VERIFIER_ID,receiptSha256:hash(canon(receipt)),signerKeySha256:hash(keys.publicKey.export({type:'spki',format:'der'})),outputSha256:receipt.outputSha256,outputBytes:receipt.outputBytes,commandSha256:receipt.commandSha256,startedAt:time,endedAt:time};
  const eventRefs=[...pending.result.evidence.eventRefs,...['task.verified_pending_owner','trilogy.receipt_bound'].map((kind,i)=>({kind,sequence:i+3,hash:hash(kind+(i+3))}))];
  return {result:{...clone(pending.result),state:'verified-pending-owner',verification,evidence:{...pending.result.evidence,eventRefs,lastSequence:4,headHash:eventRefs.at(-1).hash},observedAt:new Date().toISOString()},receipt,outputBase64:output.toString('base64')};
 };
 f.save=async value=>post({action:'result',jobId:job.id,...value},tokens.bridge);
 return f;
}
