import {env} from 'cloudflare:workers';
import {db,record} from '@/db/store';
import {fingerprint} from './control-plane';
import {applyPatches} from './runtime-contract';
import {canonical,canonicalHash,decodeBase64,encodeBase64,exact,executionIdentity,hashBytes,snapshotCommand,validHex,validId,validSha,validateRequest,verifyReceipt} from './trilogy-contract';

type Role='owner'|'bridge'|'reader'|'worker';
export type Access={ownerId:string;projectId:string;repositoryId:string;role:Role};
export class TrilogyError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status;}}
const fail=(message:string,status=400):never=>{throw new TrilogyError(message,status);};
// Check time inside the atomic database statement as well as before dispatch.
// A queued statement must not use an expiry check captured before it waited.
export const TRILOGY_DATABASE_NOW_MS="(CAST(strftime('%s','now') AS INTEGER)*1000+CAST(substr(strftime('%f','now'),4,3) AS INTEGER))";
function scope():Omit<Access,'role'>{
 let value:any;try{value=JSON.parse(env.OMNI_TRILOGY_SCOPE||'');}catch{fail('Trilogy service policy is not configured',503);}
 if(!exact(value,['ownerId','projectId','repositoryId'])||!Object.values(value).every(validId)||!/^[-\w.]+\/[-\w.]+$/.test(value.repositoryId))fail('Trilogy service policy is not configured',503);
 return value;
}
export async function trilogyAccess(request:Request,role:Exclude<Role,'worker'>):Promise<Access>{
 const s=scope(),tokens=[env.OMNI_TRILOGY_OWNER_TOKEN,env.OMNI_TRILOGY_BRIDGE_TOKEN,env.OMNI_TRILOGY_READ_TOKEN];
 if(tokens.some(t=>typeof t!=='string'||t.length<32||t.length>512)||new Set(tokens).size!==3||tokens.includes(env.OMNI_WORKER_TOKEN))fail('Separate trilogy service credentials are required',503);
 const expected=role==='owner'?tokens[0]:role==='bridge'?tokens[1]:tokens[2];const received=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
 if(!received||received.length>512)fail('Trilogy authorization required',401);
 const a=await hashBytes(received!),b=await hashBytes(expected!);let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);if(difference)fail('Trilogy authorization required',401);
 return {...s,role};
}
function role(access:Access,roles:Role[]){if(!roles.includes(access.role)||canonical(scope())!==canonical({ownerId:access.ownerId,projectId:access.projectId,repositoryId:access.repositoryId}))fail('Trilogy scope refused',403);}
async function context(jobId:string,access:Access,allowRevoked=false){
 if(!validId(jobId))fail('Invalid job identity');
 if(access.role==='reader'&&jobId!==env.OMNI_TRILOGY_READ_JOB_ID)fail('Trilogy scope refused',403);
 const raw:any=await db().prepare('SELECT * FROM jobs WHERE id=?').bind(jobId).first();
 if(!raw||raw.project_id!==access.projectId)fail('Trilogy scope refused',403);
 const payload=JSON.parse(raw.payload),result=JSON.parse(raw.result);const project:any=await db().prepare("SELECT * FROM records WHERE id=? AND kind='project'").bind(access.projectId).first();
 if(!project||payload.sourceProjectId&&payload.sourceProjectId!==access.projectId||payload.pipelineParentId)fail('Trilogy scope refused',403);
 const data=JSON.parse(project.data),origin=data.origin;
 if(!origin||origin.url!=='https://github.com/'+access.repositoryId||!validSha(origin.commit)||payload.origin?.commit!==origin.commit||payload.origin?.url!==origin.url)fail('A current commit-pinned repository import is required',403);
 const sourceDigest=await fingerprint(payload.baseline);
 if(sourceDigest!==await fingerprint(data.files)||payload.commitment?.objectiveDigest!==await fingerprint(raw.objective))fail('Job source or objective changed',403);
 if(raw.status!=='awaiting review'||result.checks?.passed!==true||!result.candidate)fail('Existing candidate must await review with passing static checks',403);
 if(!allowRevoked){const policy:any=await db().prepare("SELECT data FROM runtime_settings WHERE id='effect-policy'").first();if(policy&&JSON.parse(policy.data).stopped===true)fail('Owner effect policy is stopped',403);}
 return {raw,payload,result,project,data,sourceDigest};
}
async function active(jobId:string,access:Access){
 const c=await context(jobId,access),entry=c.result.trilogy,g=entry?.grant;
 if(!g||g.revoked!==false||g.expiresAt<=Date.now()||g.actorId!==access.ownerId||g.permission!=='candidate-only')fail('Trilogy grant is unavailable, expired or revoked',403);
 validateRequest(g.request);
 if(g.sourceDigest!==c.sourceDigest||g.requestSha256!==await canonicalHash(g.request)||g.request.jobId!==jobId||g.request.projectId!==access.projectId||g.request.repositoryId!==access.repositoryId||g.request.ownerId!==access.ownerId||g.request.baseCommit!==c.data.origin.commit||entry.candidateDigest!==await fingerprint(c.result.candidate))fail('Trilogy grant no longer matches the current job',403);
 const command=await snapshotCommand();if(g.request.commandId!==command.commandId||g.request.commandSha256!==command.commandSha256)fail('Approved trilogy command changed',403);
 await assertCurrent(c,access);
 return {...c,entry,grant:g,command};
}
async function assertCurrent(c:any,access:Access){
 role(access,['owner','bridge','reader','worker']);
 if(c.result.trilogy?.grant.expiresAt<=Date.now())fail('Trilogy grant expired',403);
 const current=await db().prepare("SELECT id FROM jobs WHERE id=? AND project_id=? AND status='awaiting review' AND payload=? AND result=? AND objective=? AND json_extract(result,'$.trilogy.grant.revoked')=0 AND json_extract(result,'$.trilogy.grant.expiresAt')>"+TRILOGY_DATABASE_NOW_MS+" AND EXISTS (SELECT 1 FROM records WHERE id=? AND kind='project' AND data=?) AND COALESCE((SELECT json_extract(data,'$.stopped') FROM runtime_settings WHERE id='effect-policy'),0)=0").bind(c.raw.id,c.raw.project_id,c.raw.payload,c.raw.result,c.raw.objective,c.project.id,c.project.data).first();
 if(!current)fail('Job or authorization changed during trilogy observation',403);
}
async function store(c:any,entry:any,title:string,checkStop=true){
 const now=new Date().toISOString(),next=JSON.stringify({...c.result,trilogy:entry}),audit=record('memory',title,{type:'TrilogyControl',jobId:c.raw.id,requestSha256:entry.grant.requestSha256,grantId:entry.grant.grantId,statusRevision:entry.statusRevision,permission:'candidate-only',releaseApproved:false},c.raw.project_id,'saved');
 if(checkStop&&entry.grant.expiresAt<=Date.now())fail('Trilogy grant expired before update',403);
 const stopped=checkStop?" AND COALESCE((SELECT json_extract(data,'$.stopped') FROM runtime_settings WHERE id='effect-policy'),0)=0 AND ?>"+TRILOGY_DATABASE_NOW_MS:"";
 const args:any[]=[next,now,c.raw.id,c.raw.project_id,c.raw.payload,c.raw.result,c.raw.objective,c.project.id,c.project.data];if(checkStop)args.push(entry.grant.expiresAt);
 const updates=await db().batch([
  db().prepare("UPDATE jobs SET result=?,updated_at=? WHERE id=? AND project_id=? AND status='awaiting review' AND payload=? AND result=? AND objective=? AND EXISTS (SELECT 1 FROM records WHERE id=? AND kind='project' AND data=?)"+stopped).bind(...args),
  db().prepare("INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE changes()=1 AND EXISTS (SELECT 1 FROM jobs WHERE id=? AND result=?)").bind(audit.id,audit.kind,audit.title,audit.projectId,audit.status,JSON.stringify(audit.data),now,now,c.raw.id,next)
 ]);if(!updates[0].meta.changes)fail('Job or authorization changed during trilogy update',409);
}
async function planMatches(plan:any,c:any){
 if(!exact(plan,['contract','commit','method','state','stamp','selection','proposals','requiresTests','requiresOwnerApproval','confidence','applied','verified','performance','id','planSha256'])||plan.contract!=='mgr.imprint.plan.v1'||plan.commit!==c.data.origin.commit||plan.method!=='slot-composition'||plan.confidence!=='unassessed'||!validHex(plan.planSha256)||plan.id!=='IMP-'+plan.planSha256.slice(0,24)||plan.state!=='PROPOSED_NOT_APPLIED'||plan.requiresTests!==true||plan.requiresOwnerApproval!==true||plan.applied!==0||plan.verified!==0||!exact(plan.performance,['speedup','benchmarkStatus'])||plan.performance.speedup!==null||plan.performance.benchmarkStatus!=='not-measured')fail('Invalid candidate-only Imprint plan');
 const {id,planSha256,...body}=plan;if(await canonicalHash(body)!==planSha256)fail('Imprint plan digest mismatch');
 const patches=c.result.candidate.patches;if(!Array.isArray(plan.proposals)||!Array.isArray(patches)||!patches.length||plan.proposals.length!==patches.length)fail('Imprint plan does not match the existing candidate');
 const names=new Set();for(const proposal of plan.proposals){if(!proposal||typeof proposal.path!=='string'||names.has(proposal.path))fail('Invalid Imprint paths');names.add(proposal.path);const patch=patches.find((p:any)=>p.path===proposal.path);if(!patch||proposal.operation!==(patch.before===null?'create':'update')||proposal.beforeHash!==(patch.before===null?null:await hashBytes(patch.before))||proposal.afterHash!==await hashBytes(patch.after)||proposal.status!=='PROPOSED_NOT_APPLIED')fail('Imprint bytes differ from the approved job candidate');}
 // The existing patch function rechecks exact baseline bytes and path contracts.
 applyPatches(c.payload.baseline,patches);
}
export async function authorizeTrilogy(jobId:string,plan:any,access:Access){
 role(access,['owner']);const c=await context(jobId,access);if(c.payload.testProfile!=='snapshot')fail('This trilogy bridge supports the existing snapshot profile only');await planMatches(plan,c);
 if(c.result.workerAssignment?.expiresAt>Date.now()||c.result.externalTests)fail('Authorize trilogy before worker assignment or execution');
 if(c.result.trilogy){const current=await active(jobId,access);if(current.grant.request.planSha256!==plan.planSha256)fail('Use a fresh job for a different proposal');return {grant:current.grant,command:current.command};}
 const command=await snapshotCommand(),request={contract:'mgr.trilogy.job.v1',jobId,projectId:access.projectId,repositoryId:access.repositoryId,ownerId:access.ownerId,baseCommit:c.data.origin.commit,planSha256:plan.planSha256,candidateRef:'refs/heads/mgr/candidates/'+crypto.randomUUID(),commandId:command.commandId,commandSha256:command.commandSha256};
 validateRequest(request);const grant={grantId:crypto.randomUUID(),requestSha256:await canonicalHash(request),request,actorId:access.ownerId,expiresAt:Date.now()+15*60*1000,revoked:false,sourceDigest:c.sourceDigest,permission:'candidate-only'};
 await store(c,{grant,plan,candidateDigest:await fingerprint(c.result.candidate),statusRevision:1,result:null,proof:null},'Trilogy candidate-only grant recorded');return {grant,command};
}
export async function trilogyGrant(jobId:string,access:Access){role(access,['owner','bridge']);const c=await active(jobId,access);return {grant:c.grant,command:c.command};}
export async function revokeTrilogy(jobId:string,access:Access){role(access,['owner']);const c=await context(jobId,access,true),entry=c.result.trilogy;if(!entry)fail('No trilogy grant');if(entry.grant.revoked)return {revoked:true};await store(c,{...entry,grant:{...entry.grant,revoked:true},statusRevision:entry.statusRevision+1},'Trilogy candidate grant revoked',false);return {revoked:true};}
async function verifier(access:Access){const signerId=env.OMNI_TRILOGY_VERIFIER_ID,pem=env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY;if(!validId(signerId)||signerId===access.ownerId||!pem||env.OMNI_TRILOGY_VERIFIER_REVOKED==='true')fail('Registered separate verifier is unavailable',503);return {signerId:signerId!,pem:pem!};}
async function validateResult(value:any,c:any){
 const request=c.grant.request,{contract,...binding}=request;
 if(!exact(value,['contract','binding','requestSha256','sourceDigest','state','candidateCommit','files','verification','evidence','observedAt','requiresOwnerApproval','merged','released'])||value.contract!=='mgr.trilogy.job-result.v1'||canonical(value.binding)!==canonical(binding)||value.requestSha256!==c.grant.requestSha256||value.sourceDigest!==c.sourceDigest||!['candidate-pending-independent-verification','verified-pending-owner'].includes(value.state)||!validSha(value.candidateCommit)||value.candidateCommit===request.baseCommit||value.requiresOwnerApproval!==true||value.merged!==false||value.released!==false)fail('Trilogy result binding or authority rejected');
 const expected=c.entry.plan.proposals.map(({path,operation,beforeHash,afterHash}:any)=>({path,operation,beforeHash,afterHash}));if(canonical(value.files)!==canonical(expected))fail('Trilogy result file evidence changed');
 const identity=await executionIdentity(request),e=value.evidence,kinds=['trilogy.job_bound','task.batch_planned','trilogy.candidate_staged',...(value.state==='verified-pending-owner'?['task.verified_pending_owner','trilogy.receipt_bound']:[])];
 if(!exact(e,['streamId','lastSequence','headHash','eventRefs'])||e.streamId!=='campaign:'+identity.campaignId||e.lastSequence!==kinds.length-1||!validHex(e.headHash)||!Array.isArray(e.eventRefs)||e.eventRefs.length!==kinds.length)fail('Invalid trilogy event evidence');
 for(let i=0;i<e.eventRefs.length;i++){const event=e.eventRefs[i];if(!exact(event,['sequence','kind','hash'])||event.sequence!==i||event.kind!==kinds[i]||!validHex(event.hash))fail('Invalid trilogy event chain');}if(e.eventRefs.at(-1).hash!==e.headHash)fail('Trilogy head does not match event evidence');
 if(typeof value.observedAt!=='string'||!Number.isFinite(Date.parse(value.observedAt))||Date.parse(value.observedAt)>Date.now()+30000)fail('Invalid observation timestamp');
 if(value.state==='candidate-pending-independent-verification'&&value.verification!==null)fail('Unverified candidate cannot carry verified status');
}
async function proof(c:any,value:any,receipt:any,outputBase64:any,access:Access){
 const trusted=await verifier(access),output=decodeBase64(outputBase64);if(!output.length)fail('Execution output must be observed');
 const checked=await verifyReceipt({request:c.grant.request,candidateCommit:value.candidateCommit,receipt,output,publicKeyPem:trusted.pem,notBefore:Date.parse(c.entry.stagedAt||c.entry.result?.observedAt||value.observedAt),expiresAt:c.grant.expiresAt});
 if(canonical(value.verification)!==canonical({signerId:trusted.signerId,...checked}))fail('Result verification summary does not match signed execution');
 const current=await verifier(access);if(current.signerId!==trusted.signerId||current.pem!==trusted.pem)fail('Verifier registration changed during verification',409);
 return {receipt,outputBase64};
}
const withoutObservation=(value:any)=>{const {observedAt,...rest}=value;return rest;};
export async function acceptTrilogyResult(jobId:string,value:any,receipt:any,outputBase64:any,access:Access){
 role(access,['bridge']);const c=await active(jobId,access);await validateResult(value,c);const prior=c.entry.result;
 if(!prior&&value.state!=='candidate-pending-independent-verification')fail('Record the actual candidate stage before signed verification',409);
 const checked=value.state==='verified-pending-owner'?await proof(c,value,receipt,outputBase64,access):null;
 if(value.state==='candidate-pending-independent-verification'&&(receipt!==undefined||outputBase64!==undefined))fail('Pending stage must not claim signed proof');
 if(prior){
  if(value.candidateCommit!==prior.candidateCommit||value.evidence.lastSequence<prior.evidence.lastSequence)fail('Stale or substituted trilogy candidate',409);
  for(const event of prior.evidence.eventRefs)if(canonical(value.evidence.eventRefs[event.sequence])!==canonical(event))fail('Trilogy history was rewritten',409);
  if(value.evidence.lastSequence===prior.evidence.lastSequence){if(canonical(withoutObservation(value))!==canonical(withoutObservation(prior))||canonical(checked)!==canonical(c.entry.proof))fail('Conflicting trilogy replay',409);await assertCurrent(c,access);return {accepted:true,replayed:true,statusRevision:c.entry.statusRevision};}
  if(prior.state==='verified-pending-owner'||value.state!=='verified-pending-owner')fail('Unsupported trilogy state transition',409);
 }else if(value.state!=='candidate-pending-independent-verification')fail('Record the actual candidate stage before signed verification',409);
 const entry={...c.entry,stagedAt:c.entry.stagedAt||new Date().toISOString(),result:value,proof:checked,statusRevision:c.entry.statusRevision+1};await store(c,entry,'Trilogy '+value.state+' evidence recorded');return {accepted:true,replayed:false,statusRevision:entry.statusRevision};
}
export async function trilogyStatus(jobId:string,access:Access){
 role(access,['owner','reader']);const c=await active(jobId,access);if(c.entry.result?.state==='verified-pending-owner')await proof(c,c.entry.result,c.entry.proof?.receipt,c.entry.proof?.outputBase64,access);
 const latest=await active(jobId,access);if(latest.raw.result!==c.raw.result)fail('Trilogy status changed during observation',409);
 return {contract:'mgr.omnidev.trilogy-status.v1',jobId,projectId:access.projectId,repositoryId:access.repositoryId,ownerId:access.ownerId,grant:{id:c.grant.grantId,expiresAt:c.grant.expiresAt,status:'active'},execution:{host:'unqualified',isolationVerified:false},result:c.entry.result,statusRevision:c.entry.statusRevision,observedAt:new Date().toISOString()};
}

// Publishing is an owner action over the existing candidate and evidence. It
// must never create a second job, worker, or weaker verification route.
export async function trilogyPublicationContext(jobId:string,access:Access){
 role(access,['owner']);
 const c=await active(jobId,access);
 if(c.entry.result?.state!=='verified-pending-owner')fail('Signed candidate verification is required before publication',403);
 await planMatches(c.entry.plan,c);
 await validateResult(c.entry.result,c);
 await proof(c,c.entry.result,c.entry.proof?.receipt,c.entry.proof?.outputBase64,access);
 await assertCurrent(c,access);
 return c;
}

// Status, revocation, and reconciliation of an already-dispatched effect must
// remain available after an approval expires or a job is canceled. This grants
// no permission to create GitHub objects, refs, or pull requests.
export async function trilogyPublicationControlContext(jobId:string,access:Access){
 role(access,['owner']);if(!validId(jobId))fail('Invalid job identity');
 const raw:any=await db().prepare('SELECT * FROM jobs WHERE id=? AND project_id=?').bind(jobId,access.projectId).first();
 if(!raw)fail('Trilogy scope refused',403);
 const payload=JSON.parse(raw.payload),result=JSON.parse(raw.result),entry=result.trilogy,grant=entry?.grant;
 if(!grant||grant.actorId!==access.ownerId||grant.permission!=='candidate-only'||grant.request?.jobId!==jobId||grant.request?.projectId!==access.projectId||grant.request?.repositoryId!==access.repositoryId||grant.request?.ownerId!==access.ownerId)fail('Trilogy scope refused',403);
 const project:any=await db().prepare("SELECT * FROM records WHERE id=? AND kind='project'").bind(access.projectId).first();
 if(!project)fail('Trilogy project is unavailable',403);
 return {raw,payload,result,entry,grant,project,data:JSON.parse(project.data),sourceDigest:await fingerprint(payload.baseline)};
}

export async function saveTrilogyPublication(c:any,publication:any,title:string,checkAuthority=true,expectedExposure?:{status:string;data:string}|null){
 const now=new Date().toISOString(),entry={...c.entry,publication,statusRevision:c.entry.statusRevision+1};
 const next=JSON.stringify({...c.result,trilogy:entry,...(publication.state==='published'?{repository:publication.outcome}:{})});
 const audit=record('memory',title,{type:'TrilogyPublication',jobId:c.raw.id,authorizationId:publication.authorization.id,state:publication.state,attemptId:publication.attemptId,phase:publication.phase,permission:'draft-pr-exact-candidate',merged:false,released:false},c.raw.project_id,'saved');
 let guard=checkAuthority?" AND status='awaiting review' AND json_extract(result,'$.trilogy.grant.revoked')=0 AND json_extract(result,'$.trilogy.grant.expiresAt')>"+TRILOGY_DATABASE_NOW_MS+" AND ?>"+TRILOGY_DATABASE_NOW_MS+" AND COALESCE((SELECT json_extract(data,'$.stopped') FROM runtime_settings WHERE id='effect-policy'),0)=0":"";
 if(checkAuthority&&(publication.authorization.revoked!==false||publication.authorization.expiresAt<=Date.now()))fail('Publication approval expired or was revoked',403);
 const args:any[]=[next,now,c.raw.id,c.raw.project_id,c.raw.status,c.raw.payload,c.raw.result,c.raw.objective,c.project.id,c.project.data];
 if(checkAuthority)args.push(publication.authorization.expiresAt);
 const undispatched=publication.state==='canceled-before-dispatch';
 if(undispatched){
  if(checkAuthority||expectedExposure===undefined||!['authorized','canceled-before-dispatch'].includes(c.entry.publication?.state)||c.entry.publication.attemptId!==null||publication.attemptId!==null||publication.outcome!==null)fail('Undispatched publication cleanup requires its exact saved state',409);
  // Admission and the attempt journal are separate durable boundaries. Fence
  // both before releasing an orphan: a delayed starter or another reservation
  // must not be mistaken for the same undispatched effect.
  if(expectedExposure===null){guard+=" AND NOT EXISTS (SELECT 1 FROM records WHERE id=?)";args.push('exposure-pr-'+c.raw.id);}
  else if(expectedExposure){guard+=" AND EXISTS (SELECT 1 FROM records WHERE id=? AND kind='exposure' AND project_id=? AND status=? AND data=?)";args.push('exposure-pr-'+c.raw.id,c.raw.project_id,expectedExposure.status,expectedExposure.data);}
  else fail('Undispatched cleanup is missing its reservation observation',409);
 }
 const statements=[
  db().prepare("UPDATE jobs SET result=?,updated_at=? WHERE id=? AND project_id=? AND status=? AND payload=? AND result=? AND objective=? AND EXISTS (SELECT 1 FROM records WHERE id=? AND kind='project' AND data=?)"+guard).bind(...args),
  db().prepare("INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE changes()=1 AND EXISTS (SELECT 1 FROM jobs WHERE id=? AND result=?)").bind(audit.id,audit.kind,audit.title,audit.projectId,audit.status,JSON.stringify(audit.data),now,now,c.raw.id,next)
 ];
 // Confirmation or undispatched cancellation and capacity release share one
 // transaction. A process death cannot strand a completed effect's capacity.
 if(publication.state==='published'||undispatched)statements.push(db().prepare("UPDATE records SET status='released',data=json_set(data,'$.state','released','$.outcome',?),updated_at=? WHERE id=? AND kind='exposure' AND status IN ('active','reconciling','released') AND project_id=? AND json_extract(data,'$.operationId')=? AND json_extract(data,'$.target')=? AND json_extract(data,'$.action')='github-draft-pr' AND json_extract(data,'$.candidateDigest')=? AND json_extract(data,'$.sourceDigest')=? AND EXISTS (SELECT 1 FROM jobs WHERE id=? AND result=?)").bind(publication.state,now,'exposure-pr-'+c.raw.id,c.raw.project_id,c.raw.id,c.raw.project_id,await fingerprint(c.result.candidate.patches),await fingerprint(c.payload.baseline),c.raw.id,next));
 const updates=await db().batch(statements);
 if(!updates[0].meta.changes)fail('Job or approval changed during publication update',409);
}
// The existing owner workspace action still authorizes a local snapshot apply.
// This check adds proof requirements; it grants no repository release permission.
export async function assertTrilogySnapshotApply(jobId:string,expectedResult:any){
 const access={...scope(),role:'owner' as const},c=await active(jobId,access);
 if(c.raw.result!==JSON.stringify(expectedResult))fail('Trilogy job changed before snapshot apply',409);
 if(c.entry.result?.state!=='verified-pending-owner')fail('Trilogy candidate requires signed verification before snapshot apply',403);
 await proof(c,c.entry.result,c.entry.proof?.receipt,c.entry.proof?.outputBase64,access);
 const latest=await active(jobId,access);if(latest.raw.result!==c.raw.result)fail('Trilogy job changed during snapshot review',409);
}
export async function trilogyWorkerBinding(jobId:string,allowVerified=false){
 const access={...scope(),role:'worker' as const},c=await active(jobId,access);await verifier(access);
 if(c.entry.result?.state!=='candidate-pending-independent-verification'&&!(allowVerified&&c.entry.result?.state==='verified-pending-owner'))fail('Trilogy candidate must be staged before worker execution');
 return {request:c.grant.request,requestSha256:c.grant.requestSha256,grantId:c.grant.grantId,grantExpiresAt:c.grant.expiresAt,stagedAt:c.entry.stagedAt,candidateCommit:c.entry.result.candidateCommit,sourceDigest:c.sourceDigest,files:c.entry.plan.proposals.map(({path,operation,beforeHash,afterHash}:any)=>({path,operation,beforeHash,afterHash})),command:c.command,identity:await executionIdentity(c.grant.request)};
}
export async function checkTrilogyWorkerProof(jobId:string,p:any,assignment:any,allowVerified=false){
 const binding=await trilogyWorkerBinding(jobId,allowVerified);if(assignment?.trilogyBindingDigest!==await fingerprint(binding))fail('Worker trilogy assignment changed');
 const trusted=await verifier({...scope(),role:'worker'});const output=new TextEncoder().encode(p.output);
 if(p.passed!==true) return null;
 const checked=await verifyReceipt({request:binding.request,candidateCommit:binding.candidateCommit,receipt:p.trilogyReceipt,output,publicKeyPem:trusted.pem,notBefore:Date.parse(binding.stagedAt),expiresAt:Math.min(binding.grantExpiresAt,assignment.expiresAt)});
 const current=await verifier({...scope(),role:'worker'});if(current.signerId!==trusted.signerId||current.pem!==trusted.pem)fail('Worker verifier registration changed',409);
 if(p.trilogySignerId!==trusted.signerId)fail('Worker signer identity mismatch');return {receipt:p.trilogyReceipt,outputBase64:encodeBase64(output),signerId:trusted.signerId,...checked};
}
export async function trilogyExecution(jobId:string,access:Access){role(access,['bridge']);const c=await active(jobId,access);const saved=c.result.externalTests?.trilogyProof;if(!saved)return {available:false};const binding=await trilogyWorkerBinding(jobId,true);await checkTrilogyWorkerProof(jobId,{passed:true,output:new TextDecoder('utf-8',{fatal:true}).decode(decodeBase64(saved.outputBase64)),trilogyReceipt:saved.receipt,trilogySignerId:saved.signerId},c.result.workerAssignment,true);await assertCurrent(c,access);return {available:true,request:binding.request,receipt:saved.receipt,outputBase64:saved.outputBase64,scope:'Imported candidate snapshot profile; Docker isolation is not independently certified'};}
