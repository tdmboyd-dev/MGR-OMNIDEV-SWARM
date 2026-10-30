import {db,record,insert} from '@/db/store';
import {fingerprint,reserveSnapshot,releaseSnapshot} from './control-plane';
import {combinedReport} from './review-planner';
import {repositoryClient,repositorySettings} from './repository';
import {canonical,canonicalHash,decodeBase64,hashBytes,validId} from './trilogy-contract';
import {Access,TrilogyError,trilogyPublicationContext,trilogyPublicationControlContext,saveTrilogyPublication} from './trilogy-jobs';

const fail=(message:string,status=409):never=>{throw new TrilogyError(message,status);};
const SHA=/^[a-f0-9]{40}$/;
const identity={name:'MGR Code Monster',email:'machine@mgr.invalid'};
const message='mgr: candidate evidence change\n';
const bytes=(text:string)=>new TextEncoder().encode(text);
const same=(a:any,b:any)=>canonical(a)===canonical(b);
const branchPath=(branch:string)=>'/git/ref/heads/'+encodeURIComponent(branch);
const branchName=(c:any)=>c.grant.request.candidateRef.slice('refs/heads/'.length);
const pathOK=(path:any)=>typeof path==='string'&&path.length>0&&path.length<1024&&!/[\0\\]/.test(path)&&!path.split('/').some((p:string)=>!p||p==='.'||p==='..'||p==='.git')&&!/(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/.test(path);
const refOK=(ref:any)=>typeof ref==='string'&&ref.length<200&&/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref)&&!ref.includes('..')&&!ref.split('/').some((p:string)=>!p||p.startsWith('.')||p.endsWith('.')||p.endsWith('.lock'));
type GitNode={mode:string;type:string;sha:string};

async function gitHash(type:string,body:Uint8Array){
 const prefix=bytes(type+' '+body.length+'\0'),buffer=new Uint8Array(prefix.length+body.length);buffer.set(prefix);buffer.set(body,prefix.length);
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',buffer)),v=>v.toString(16).padStart(2,'0')).join('');
}
function compareNames(a:{name:string;node:GitNode},b:{name:string;node:GitNode}){
 const x=bytes(a.name+(a.node.type==='tree'?'/':'')),y=bytes(b.name+(b.node.type==='tree'?'/':''));
 for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];return x.length-y.length;
}
async function treeHash(nodes:Map<string,GitNode>){
 const directories=new Map<string,Array<{name:string;node:GitNode;path:string}>>([['',[]]]);
 for(const [path,node] of nodes)if(node.type==='tree')directories.set(path,[]);
 for(const [path,node] of nodes){const split=path.lastIndexOf('/'),parent=split<0?'':path.slice(0,split),name=path.slice(split+1),children=directories.get(parent);if(!children)fail('GitHub returned an incomplete repository tree');children!.push({name,node,path});}
 const visit=async(path:string,depth=0):Promise<string>=>{
  if(depth>64)fail('Repository tree exceeds publication depth');const entries=directories.get(path)!.sort(compareNames),parts:Uint8Array[]=[];let length=0;
  for(const entry of entries){const sha=entry.node.type==='tree'?await visit(entry.path,depth+1):entry.node.sha;const prefix=bytes((entry.node.type==='tree'?'40000':entry.node.mode)+' '+entry.name+'\0'),raw=new Uint8Array(prefix.length+20);raw.set(prefix);for(let i=0;i<20;i++)raw[prefix.length+i]=parseInt(sha.slice(i*2,i*2+2),16);parts.push(raw);length+=raw.length;}
  const raw=new Uint8Array(length);let offset=0;for(const part of parts){raw.set(part,offset);offset+=part.length;}return gitHash('tree',raw);
 };return visit('');
}
async function connectionDigest(settings:any){
 if(!settings)fail('GitHub connection is unavailable',403);
 const account:any=settings.authMethod==='oauth'?await db().prepare("SELECT data FROM runtime_settings WHERE id='github-account'").first():null;
 return fingerprint({settings,account:account?.data||null});
}
function requireReviews(c:any){
 if(c.result.reviewPlan&&combinedReport(c.result)?.status!=='reviewed'||c.result.externalTests?.passed===false||c.result.reviews?.some((r:any)=>r.approved!==true))fail('Complete passing candidate reviews before publication',403);
}
async function remoteBase(c:any,client:any){
 const branch=c.data.origin.ref;if(!refOK(branch)||!SHA.test(c.data.origin.commit)||!SHA.test(c.entry.result.candidateCommit))fail('A supported SHA-1 GitHub branch import is required',403);
 if(client.s.repository!==c.grant.request.repositoryId||!client.s.verifiedAt)fail('Verify the same GitHub repository before publication',403);
 const repository=await client.request('');
 if(typeof repository.full_name!=='string'||repository.full_name.toLowerCase()!==client.s.repository.toLowerCase()||repository.permissions?.push!==true||repository.archived===true)fail('GitHub repository identity or write access changed',403);
 const head=await client.request(branchPath(branch));if(head?.object?.type!=='commit'||head.object.sha!==c.data.origin.commit)fail('GitHub base changed; import and test the new source before publication');
 return branch;
}
async function candidateObjects(c:any,client:any){
 const base=await client.request('/git/commits/'+c.data.origin.commit);
 if(base?.sha!==c.data.origin.commit||!SHA.test(base.tree?.sha)||typeof base.committer?.date!=='string')fail('Invalid pinned GitHub base commit');
 const timestamp=Date.parse(base.committer.date)/1000;if(!Number.isSafeInteger(timestamp)||timestamp<0)fail('Unsupported parent commit timestamp');
 const remote=await client.request('/git/trees/'+base.tree.sha+'?recursive=1');
 if(remote?.sha!==base.tree.sha||remote.truncated===true||!Array.isArray(remote.tree)||remote.tree.length>20000)fail('Complete bounded GitHub tree required');
 const nodes=new Map<string,GitNode>();
 for(const value of remote.tree){
  if(!pathOK(value.path)||nodes.has(value.path)||!SHA.test(value.sha)||!['100644:blob','100755:blob','120000:blob','160000:commit','040000:tree'].includes(value.mode+':'+value.type))fail('Unsupported or ambiguous GitHub tree entry');
  nodes.set(value.path,{mode:value.mode,type:value.type,sha:value.sha});
 }
 if(await treeHash(nodes)!==base.tree.sha)fail('GitHub base tree content does not match its identity');
 const changes:any[]=[];const patches=c.result.candidate.patches;
 if(!Array.isArray(patches)||!patches.length||patches.length>50)fail('Bounded tested candidate required');
 const seen=new Set<string>();
 for(const patch of patches){
  if(!pathOK(patch.path)||seen.has(patch.path)||typeof patch.after!=='string'||bytes(patch.after).length>1048576)fail('Invalid candidate path or bytes');seen.add(patch.path);
  const old=nodes.get(patch.path);
  if(old&&!['100644','100755'].includes(old.mode)||patch.before===null&&old||patch.before!==null&&(!old||typeof patch.before!=='string'||old.sha!==await gitHash('blob',bytes(patch.before))))fail('Pinned GitHub source differs from the tested candidate: '+patch.path);
  const pieces=patch.path.split('/');for(let count=1;count<pieces.length;count++){const path=pieces.slice(0,count).join('/'),parent=nodes.get(path);if(parent&&parent.type!=='tree')fail('Candidate path crosses a non-directory Git entry');if(!parent)nodes.set(path,{mode:'040000',type:'tree',sha:'0'.repeat(40)});}
  const node={mode:old?.mode||'100644',type:'blob',sha:await gitHash('blob',bytes(patch.after))};nodes.set(patch.path,node);changes.push({path:patch.path,...node,content:patch.after});
 }
 const tree=await treeHash(nodes),date=new Date(timestamp*1000).toISOString();
 const raw='tree '+tree+'\nparent '+base.sha+'\nauthor '+identity.name+' <'+identity.email+'> '+timestamp+' +0000\ncommitter '+identity.name+' <'+identity.email+'> '+timestamp+' +0000\n\n'+message;
 const commit=await gitHash('commit',bytes(raw));
 if(commit!==c.entry.result.candidateCommit)fail('Recreated Git object differs from the exact tested candidate; publication refused');
 return {baseTree:base.tree.sha,tree,commit,date,timestamp,changes,body:{message,tree,parents:[base.sha],author:{...identity,date},committer:{...identity,date}}};
}
async function buildPreview(jobId:string,access:Access){
 const c=await trilogyPublicationContext(jobId,access);requireReviews(c);const client=await repositoryClient(),configuration=await connectionDigest(client.s),baseBranch=await remoteBase(c,client),objects=await candidateObjects(c,client);
 const body={contract:'mgr.trilogy.publication-preview.v1',jobId,projectId:access.projectId,repositoryId:access.repositoryId,ownerId:access.ownerId,baseBranch,baseCommit:c.data.origin.commit,candidateCommit:objects.commit,candidateTree:objects.tree,parentTimestamp:objects.timestamp,candidateRef:c.grant.request.candidateRef,requestSha256:c.grant.requestSha256,sourceDigest:c.sourceDigest,candidateDigest:c.entry.candidateDigest,receiptSha256:c.entry.result.verification.receiptSha256,reviewDigest:await fingerprint({reviewPlan:c.result.reviewPlan||null,reviews:c.result.reviews||[]}),repositoryVerifiedAt:client.s.verifiedAt,commandSha256:c.command.commandSha256,summary:c.result.candidate.summary,changedFiles:c.entry.plan.proposals.map(({path,operation}:any)=>({path,operation})),permission:'draft-pr-exact-candidate',merged:false,released:false};
 const preview={...body,previewSha256:await canonicalHash(body)};
 const current=await trilogyPublicationContext(jobId,access);if(current.raw.result!==c.raw.result||configuration!==await connectionDigest(await repositorySettings()))fail('Job or GitHub connection changed during publication preview');
 await remoteBase(current,client);return {c,client,configuration,objects,preview};
}
export async function previewTrilogyPublication(jobId:string,access:Access){return (await buildPreview(jobId,access)).preview;}
function visible(publication:any){return publication?{authorizationId:publication.authorization.id,expiresAt:publication.authorization.expiresAt,revoked:publication.authorization.revoked,state:publication.state,preview:publication.authorization.preview,outcome:publication.outcome||null,merged:false,released:false}:null;}
export async function trilogyPublicationStatus(jobId:string,access:Access){const c=await trilogyPublicationControlContext(jobId,access);return {publication:visible(c.entry.publication)};}
export async function authorizeTrilogyPublication(jobId:string,expectedPreview:any,access:Access){
 if(!expectedPreview||typeof expectedPreview!=='object')fail('Review the exact publication preview first',400);
 const {c,preview,configuration}=await buildPreview(jobId,access);if(!same(expectedPreview,preview))fail('Publication preview changed; review the current exact candidate');
 const previous=c.entry.publication;
 if(previous){
  if(['publishing','uncertain','published'].includes(previous.state))fail('Existing publication must be inspected before another authorization');
  if(previous.authorization.revoked===false&&previous.authorization.expiresAt>Date.now()&&same(previous.authorization.preview,preview)&&previous.authorization.connectionDigest===configuration)return visible(previous);
 }
 const exposure:any=previous?.state==='retryable'?await db().prepare("SELECT status FROM records WHERE id=? AND kind='exposure'").bind('exposure-pr-'+jobId).first():null;
 const retryable=exposure?.status==='active';
 const publication={contract:'mgr.trilogy.publication.v1',authorization:{id:crypto.randomUUID(),actorId:access.ownerId,permission:'draft-pr-exact-candidate',expiresAt:Math.min(c.grant.expiresAt,Date.now()+5*60*1000),revoked:false,preview,connectionDigest:configuration},state:retryable?'retryable':'authorized',attemptId:retryable?previous.attemptId:null,phase:'approved',outcome:null};
 await saveTrilogyPublication(c,publication,'Owner approved exact tested candidate for GitHub draft');return visible(publication);
}
export async function revokeTrilogyPublication(jobId:string,authorizationId:string,access:Access){
 const c=await trilogyPublicationControlContext(jobId,access),publication=c.entry.publication;
 if(!validId(authorizationId)||publication?.authorization.id!==authorizationId)fail('Publication authorization not found',403);
 if(publication.authorization.revoked)return visible(publication);
 const next={...publication,authorization:{...publication.authorization,revoked:true}};await saveTrilogyPublication(c,next,'Owner revoked GitHub publication approval',false);return visible(next);
}
async function approved(jobId:string,authorizationId:string,access:Access,attemptId?:string){
 const c=await trilogyPublicationContext(jobId,access);requireReviews(c);const publication=c.entry.publication,a=publication?.authorization;
 if(!validId(authorizationId)||!a||a.id!==authorizationId||a.actorId!==access.ownerId||a.permission!=='draft-pr-exact-candidate'||a.revoked!==false||a.expiresAt<=Date.now())fail('Publication approval is unavailable, expired or revoked',403);
 if(attemptId!==undefined&&(publication.attemptId!==attemptId||publication.state!=='publishing'))fail('Publication operation changed');
 const p=a.preview;if(p.requestSha256!==c.grant.requestSha256||p.candidateCommit!==c.entry.result.candidateCommit||p.sourceDigest!==c.sourceDigest||p.candidateDigest!==c.entry.candidateDigest||p.receiptSha256!==c.entry.result.verification.receiptSha256||p.baseCommit!==c.data.origin.commit||p.baseBranch!==c.data.origin.ref||p.reviewDigest!==await fingerprint({reviewPlan:c.result.reviewPlan||null,reviews:c.result.reviews||[]})||a.connectionDigest!==await connectionDigest(await repositorySettings()))fail('Publication approval no longer matches this job or GitHub connection',403);
 const {previewSha256,...body}=p;if(previewSha256!==await canonicalHash(body))fail('Publication preview identity changed',403);
 return c;
}
function checkBranch(value:any,c:any,allowMissing=false){if(value===null&&allowMissing)return null;if(!value||value.ref!==c.grant.request.candidateRef||value.object?.type!=='commit'||value.object.sha!==c.entry.result.candidateCommit)fail('Candidate branch changed or is unreadable; it will never be overwritten');return value;}
function checkPull(pr:any,c:any){
 const p=c.entry.publication.authorization.preview,repository=c.grant.request.repositoryId;
 if(!pr||!Number.isSafeInteger(pr.number)||pr.number<1||pr.state!=='open'||pr.draft!==true||pr.merged_at||pr.merged===true||pr.head?.sha!==p.candidateCommit||pr.head?.ref!==branchName(c)||pr.head?.repo?.full_name?.toLowerCase()!==repository.toLowerCase()||pr.base?.sha!==p.baseCommit||pr.base?.ref!==p.baseBranch||pr.base?.repo?.full_name?.toLowerCase()!==repository.toLowerCase()||typeof pr.html_url!=='string'||pr.html_url.toLowerCase()!==('https://github.com/'+repository+'/pull/'+pr.number).toLowerCase())fail('Existing pull request does not preserve the approved exact candidate and base');
 return {url:pr.html_url,number:pr.number,state:pr.state,draft:true,branch:branchName(c),commit:p.candidateCommit,baseBranch:p.baseBranch,baseCommit:p.baseCommit};
}
async function findPull(client:any,c:any){
 const owner=c.grant.request.repositoryId.split('/')[0],list=await client.request('/pulls?state=all&head='+encodeURIComponent(owner+':'+branchName(c))+'&base='+encodeURIComponent(c.data.origin.ref)+'&per_page=100');
 if(!Array.isArray(list)||list.length>1)fail('Ambiguous candidate pull request history');return list.length?list[0]:null;
}
async function finish(jobId:string,authorizationId:string,access:Access,client:any,outcome:any,attemptId?:string){
 const c=await approved(jobId,authorizationId,access,attemptId);await remoteBase(c,client);checkBranch(await client.request(branchPath(branchName(c))),c);const observed=checkPull(await client.request('/pulls/'+outcome.number),c);if(!same(outcome,observed))fail('GitHub publication changed during final observation');
 const latest=await approved(jobId,authorizationId,access,attemptId);
 const publication={...latest.entry.publication,state:'published',phase:'confirmed',outcome:observed};
 await saveTrilogyPublication(latest,publication,'Exact tested candidate GitHub draft confirmed');return visible(publication);
}

// Recover provider facts after a timeout, expiry or revocation, or retire an
// abandoned approval that never reached dispatch. Provider requests are GET
// only. This does not renew authority or restart a write.
export async function reconcileTrilogyPublication(jobId:string,access:Access){
 const c=await trilogyPublicationControlContext(jobId,access),publication=c.entry.publication,a=publication?.authorization,p=a?.preview;
 if(!a||!p||!['authorized','canceled-before-dispatch','publishing','uncertain','published','retryable'].includes(publication.state))fail('No saved publication is available to reconcile');
 const {previewSha256,...body}=p;
 if(previewSha256!==await canonicalHash(body)||p.jobId!==jobId||p.projectId!==access.projectId||p.ownerId!==access.ownerId||p.repositoryId!==access.repositoryId||p.candidateCommit!==c.entry.result?.candidateCommit||p.requestSha256!==c.grant.requestSha256||p.requestSha256!==await canonicalHash(c.grant.request)||p.candidateRef!==c.grant.request.candidateRef||p.baseCommit!==c.grant.request.baseCommit||p.sourceDigest!==c.sourceDigest||p.candidateDigest!==await fingerprint(c.result.candidate)||p.receiptSha256!==c.entry.result?.verification?.receiptSha256||p.receiptSha256!==await canonicalHash(c.entry.proof?.receipt))fail('Saved publication identity changed; recovery cannot confirm it');
 const output=decodeBase64(c.entry.proof.outputBase64),receipt=c.entry.proof.receipt;
 if(output.length!==receipt.outputBytes||await hashBytes(output)!==receipt.outputSha256)fail('Saved signed execution output changed; recovery cannot confirm it');
 if(['authorized','canceled-before-dispatch'].includes(publication.state)){
  const alreadyCleared=publication.state==='canceled-before-dispatch';
  if(publication.phase!==(alreadyCleared?'not-dispatched':'approved')||publication.attemptId!==null||publication.outcome!==null||c.result.repository)fail('Publication dispatch history is ambiguous; capacity cannot be cleared');
  if(!alreadyCleared&&c.raw.status==='awaiting review'&&a.revoked===false&&a.expiresAt>Date.now()&&c.grant.revoked===false&&c.grant.expiresAt>Date.now())fail('This undispatched approval is still active; resume it or revoke it before clearing');
  const exposure:any=await db().prepare("SELECT data,status,project_id FROM records WHERE id=? AND kind='exposure'").bind('exposure-pr-'+jobId).first();
  if(exposure){
   const data=JSON.parse(exposure.data);
   if(!['active','released'].includes(exposure.status)||exposure.project_id!==access.projectId||data.operationId!==jobId||data.target!==access.projectId||data.action!=='github-draft-pr'||data.candidateDigest!==await fingerprint(c.result.candidate.patches)||data.sourceDigest!==await fingerprint(c.payload.baseline))fail('Undispatched reservation has a different identity; it will not be released');
  }
  const next={...publication,state:'canceled-before-dispatch',phase:'not-dispatched',outcome:null};
  await saveTrilogyPublication(c,next,'Undispatched GitHub approval cleared without provider writes',false,exposure);
  return {...visible(next),authorizationActive:false,reconciliation:'not-dispatched'};
 }
 const client=await repositoryClient();
 if(client.s.repository!==access.repositoryId)fail('Connect the same GitHub repository to inspect this saved attempt',403);
 const repo=await client.request('');if(repo.full_name?.toLowerCase()!==access.repositoryId.toLowerCase())fail('GitHub repository identity changed',403);
 const base=await client.request(branchPath(p.baseBranch));if(base?.object?.type!=='commit'||base.object.sha!==p.baseCommit)fail('GitHub base changed; this draft cannot be confirmed against the saved approval');
 const ref=checkBranch(await client.request(branchPath(branchName(c)),undefined,true),c,true),pr=await findPull(client,c);
 if(!ref||!pr)fail('The saved GitHub draft is not confirmed; no write was retried');
 const observed=checkPull(pr,c);
 const latest=await trilogyPublicationControlContext(jobId,access);
 if(latest.raw.result!==c.raw.result||latest.raw.payload!==c.raw.payload)fail('Publication changed during recovery; inspect it again');
 const next={...publication,state:'published',phase:'confirmed',outcome:observed};
 await saveTrilogyPublication(latest,next,'Existing GitHub draft reconciled without new provider writes',false);
 return {...visible(next),authorizationActive:a.revoked===false&&a.expiresAt>Date.now()&&c.grant.revoked===false&&c.grant.expiresAt>Date.now()};
}
async function reconcile(jobId:string,authorizationId:string,access:Access,client:any):Promise<any>{
 const c=await approved(jobId,authorizationId,access);await remoteBase(c,client);const ref=checkBranch(await client.request(branchPath(branchName(c)),undefined,true),c,true),pr=await findPull(client,c);
 if(pr){if(!ref)fail('Pull request exists but its exact candidate branch is missing');return finish(jobId,authorizationId,access,client,checkPull(pr,c));}
 // No PR intent was recorded in these phases. A current owner request may
 // fence the old attempt and resume after observing its exact branch. An old
 // in-flight attempt cannot advance because every later write checks its ID.
 if(c.entry.publication.phase==='objects'||c.entry.publication.phase==='branch'&&ref){
  await saveTrilogyPublication(c,{...c.entry.publication,state:'retryable',phase:'objects'},'Incomplete exact candidate attempt reconciled before draft intent');
  return publishTrilogyCandidate(jobId,authorizationId,access);
 }
 fail('GitHub publication is not confirmed yet; this retry only inspects the existing attempt');
}
async function reservePublication(c:any,access:Access){
 const id='exposure-pr-'+c.raw.id,prior:any=await db().prepare("SELECT data,status FROM records WHERE id=? AND kind='exposure'").bind(id).first();
 const job={id:c.raw.id,projectId:access.projectId,objective:c.raw.objective,mode:c.raw.mode,payload:c.payload,result:c.result};
 if(!prior)return reserveSnapshot(job,true);
 if(!['released','active'].includes(prior.status))fail('Publication exposure requires reconciliation');
 // A local start failure can release its reservation before any provider write.
 // Reactivate that exact historical record under the original capacity rules;
 // never delete it, create a second exposure or adopt an active reservation.
 const data=JSON.parse(prior.data),hash=await fingerprint(c.result.candidate.patches);
 if(data.operationId!==c.raw.id||data.target!==access.projectId||data.action!=='github-draft-pr'||data.candidateDigest!==hash||data.sourceDigest!==await fingerprint(c.payload.baseline))fail('Released publication reservation has a different identity');
 // A crash can occur between the atomic reservation and attempt journal. Only
 // the same still-authorized, undispatched job may reuse that exact slot; the
 // subsequent job CAS decides one winner among concurrent resumptions.
 if(prior.status==='active'){
  if(c.entry.publication.state!=='authorized'||c.entry.publication.attemptId!=null)fail('Active publication requires its existing attempt to be reconciled');
  return {id,hash};
 }
 const now=new Date().toISOString(),resumed=JSON.stringify({...data,state:'active',resumedAt:now,resumeCount:(data.resumeCount||0)+1});
 const updated=await db().prepare("UPDATE records SET status='active',data=?,updated_at=? WHERE id=? AND kind='exposure' AND status='released' AND data=? AND COALESCE((SELECT json_extract(data,'$.stopped') FROM runtime_settings WHERE id='effect-policy'),0)=0 AND (SELECT COUNT(*) FROM records WHERE kind='exposure' AND status IN ('active','reconciling','quarantined'))<5 AND NOT EXISTS (SELECT 1 FROM records WHERE kind='exposure' AND project_id=? AND status IN ('active','reconciling','quarantined')) AND (SELECT COUNT(*) FROM records WHERE kind='exposure' AND json_extract(data,'$.recipe')=? AND status IN ('active','reconciling','quarantined'))<2").bind(resumed,now,id,prior.data,access.projectId,data.recipe).run();
 if(!updated.meta.changes)fail('Publication reservation is stopped, in use or exceeds capacity');return {id,hash};
}
export async function publishTrilogyCandidate(jobId:string,authorizationId:string,access:Access):Promise<any>{
 let c=await approved(jobId,authorizationId,access),client=await repositoryClient();
 if(['publishing','uncertain','published'].includes(c.entry.publication.state))return reconcile(jobId,authorizationId,access,client);
 if(!['authorized','retryable'].includes(c.entry.publication.state))fail('Publication cannot start from its current state');
 const startingState=c.entry.publication.state,startingAttempt=c.entry.publication.attemptId;
 const unchangedAttempt=(value:any)=>{if(value.entry.publication.state!==startingState||value.entry.publication.attemptId!==startingAttempt)fail('Another publication attempt already started');};
 const built=await buildPreview(jobId,access);if(!same(built.preview,c.entry.publication.authorization.preview)||built.configuration!==c.entry.publication.authorization.connectionDigest)fail('Approved publication changed before execution');client=built.client;c=await approved(jobId,authorizationId,access);unchangedAttempt(c);
 let admission:any,createdReservation=false;if(c.entry.publication.state==='retryable'){
  const existing:any=await db().prepare("SELECT data,status FROM records WHERE id=? AND kind='exposure'").bind('exposure-pr-'+jobId).first();if(!existing||existing.status!=='active')fail('Publication exposure requires reconciliation');admission={id:'exposure-pr-'+jobId};
 }else {admission=await reservePublication(c,access);createdReservation=true;}
 const attemptId=crypto.randomUUID();let phase='objects';
 try{
  c=await approved(jobId,authorizationId,access);unchangedAttempt(c);await saveTrilogyPublication(c,{...c.entry.publication,state:'publishing',attemptId,phase,outcome:null},'Exact candidate publication attempt started');
 }catch(error){
  if(createdReservation){const current:any=await db().prepare('SELECT result FROM jobs WHERE id=?').bind(jobId).first(),publication=current?JSON.parse(current.result).trilogy?.publication:null;if(publication?.state==='authorized'&&publication.attemptId===startingAttempt)await releaseSnapshot(admission.id,jobId,c.raw.status).run();}
  throw error;
 }
 const boundary=async()=>{const current=await approved(jobId,authorizationId,access,attemptId);await remoteBase(current,client);return approved(jobId,authorizationId,access,attemptId);};
 try{
  for(const change of built.objects.changes){await boundary();const blob=await client.request('/git/blobs',{content:change.content,encoding:'utf-8'});if(blob?.sha!==change.sha)fail('GitHub altered the approved blob bytes');}
  await boundary();const tree=await client.request('/git/trees',{base_tree:built.objects.baseTree,tree:built.objects.changes.map(({path,mode,type,sha}:any)=>({path,mode,type,sha}))});if(tree?.sha!==built.objects.tree)fail('GitHub tree differs from the tested candidate');
  await boundary();const commit=await client.request('/git/commits',built.objects.body);if(commit?.sha!==built.objects.commit)fail('GitHub commit differs from the exact tested candidate');
  c=await boundary();const existing=checkBranch(await client.request(branchPath(branchName(c)),undefined,true),c,true);
  if(!existing){c=await boundary();phase='branch';await saveTrilogyPublication(c,{...c.entry.publication,phase},'Exact candidate branch creation intent recorded');await boundary();const ref=await client.request('/git/refs',{ref:c.grant.request.candidateRef,sha:built.objects.commit});checkBranch(ref,c);}
  c=await boundary();checkBranch(await client.request(branchPath(branchName(c))),c);let pr=await findPull(client,c);
  if(!pr){c=await boundary();phase='pull-request';await saveTrilogyPublication(c,{...c.entry.publication,phase},'Exact candidate draft creation intent recorded');c=await boundary();checkBranch(await client.request(branchPath(branchName(c))),c);await approved(jobId,authorizationId,access,attemptId);pr=await client.request('/pulls',{title:c.raw.objective.slice(0,100),head:branchName(c),base:c.data.origin.ref,draft:true,maintainer_can_modify:false,body:c.result.candidate.summary+'\n\nJob: '+jobId+'\nExact tested commit: '+built.objects.commit+'\nSigned execution receipt: '+c.entry.result.verification.receiptSha256+'\nOwner approval: '+authorizationId+'\n\nDraft review only. Merge and deployment are separate owner actions.'});}
  const outcome=checkPull(pr,c);return await finish(jobId,authorizationId,access,client,outcome,attemptId);
 }catch(error){
  // An interrupted provider request may already have succeeded. Do not delete,
  // overwrite or replay uncertain external writes. Keep capacity reserved.
  try{const current=await approved(jobId,authorizationId,access,attemptId);await saveTrilogyPublication(current,{...current.entry.publication,state:phase==='objects'?'retryable':'uncertain',phase},'GitHub publication requires '+(phase==='objects'?'object retry':'provider reconciliation'));}catch{/* A revoke or competing change wins; it must never be overwritten. */}
  await insert(record('memory','GitHub publication attempt did not confirm',{type:'TrilogyPublication',jobId,authorizationId,attemptId,phase,outcome:'unconfirmed',merged:false,released:false},access.projectId,'saved')).run();
  throw error;
 }
}
