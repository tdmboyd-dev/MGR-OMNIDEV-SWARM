// Source identity only. Original native approval and independent signed-worker
// verification remain separate; no grant or code execution is created here.
import {exact,requestKeys,validateRequest,canonicalHash,hashBytes,validHex,validSha,validId} from './trilogy-contract';
import {safePath} from './runtime-contract';
const fail=()=>{throw Error('Reviewed native source does not match the original job');};
const json=(value:any)=>JSON.stringify(value);
const stable=(value:any):any=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const files=(value:any)=>Array.isArray(value)&&value.length>0&&value.length<=300&&value.every((f:any)=>exact(f,['path','content'])&&safePath(f.path)&&typeof f.content==='string'&&f.content.isWellFormed()&&new TextEncoder().encode(f.content).byteLength<100000)&&new Set(value.map((f:any)=>f.path.toLowerCase())).size===value.length;
const sameFiles=(left:any[],right:any[])=>left.length===right.length&&left.every((f,i)=>f.path===right[i].path&&f.content===right[i].content);
const patchRows=(value:any)=>Array.isArray(value)&&value.length<=12&&value.every((p:any)=>exact(p,['path','before','after'])&&safePath(p.path)&&(p.before===null||typeof p.before==='string')&&typeof p.after==='string'&&p.after.isWellFormed()&&(p.before===null||p.before.isWellFormed()));
const normalizedPatches=(value:any[])=>value.map(({path,before,after})=>({path,before,after}));
export async function reviewedNativeSourceLink({snapshot,workspaceId,jobId,principal,nativeBinding,baseline,candidate}:any){
 const serialized=json(snapshot);if(!serialized||new TextEncoder().encode(serialized).byteLength>2200200)fail();const value=JSON.parse(serialized);
 if(!exact(value,['contract','binding','recipe','paths','baseline','candidate','requiresNativeApproval','signedCandidateVerificationTransferred','snapshotSha256'])||value.contract!=='mgr.trilogy.reviewed-native-snapshot.v1'||value.requiresNativeApproval!==true||value.signedCandidateVerificationTransferred!==false||!validHex(value.snapshotSha256))fail();
 const {snapshotSha256,...body}=value;if(await hashBytes(json(body))!==snapshotSha256)fail();
 if(!exact(value.binding,[...requestKeys,'requestSha256','candidateCommit','sourceDigest','ledgerHead']))fail();
 const request=Object.fromEntries(requestKeys.map(key=>[key,value.binding[key]]));validateRequest(request);
 if(await canonicalHash(request)!==value.binding.requestSha256||!validSha(value.binding.candidateCommit)||!['sourceDigest','ledgerHead'].every(k=>validHex(value.binding[k])))fail();
 const recipe=value.recipe;if(!exact(recipe,['contract','id','version','stampSha256','admissionHash'])||recipe.contract!=='mgr.imprint.recipe-use.v1'||!validId(recipe.id)||!Number.isSafeInteger(recipe.version)||recipe.version<1||!validHex(recipe.stampSha256)||!validHex(recipe.admissionHash))fail();
 if(!files(value.baseline)||!files(baseline)||!sameFiles(value.baseline,baseline)||!exact(value.candidate,['summary','patches','experts'])||typeof value.candidate.summary!=='string'||value.candidate.summary.length>4000||!Array.isArray(value.candidate.experts)||value.candidate.experts.length!==0||!patchRows(value.candidate.patches)||!patchRows(candidate?.patches)||json(normalizedPatches(value.candidate.patches))!==json(normalizedPatches(candidate.patches)))fail();
 const paths=[...new Set([...baseline.map((f:any)=>f.path),...candidate.patches.map((p:any)=>p.path)])].sort();
 if(!Array.isArray(value.paths)||value.paths.length!==paths.length||value.paths.some((path:any,i:number)=>path!==paths[i])||!paths.includes('tests/omni-snapshot.test.mjs')||candidate.patches.some((p:any)=>p.path==='tests/omni-snapshot.test.mjs'))fail();
 const payload={contract:'mgr.omnidev.reviewed-native-source.v1',workspaceId,jobId,actorId:principal.actorId,tenantId:principal.tenantId,snapshotSha256,requestSha256:value.binding.requestSha256,request,candidateCommit:value.binding.candidateCommit,sourceContextDigest:value.binding.sourceDigest,ledgerHead:value.binding.ledgerHead,recipe,paths,nativeBinding,exactSnapshotMatched:true,authorityTransferred:false,independentSignatureVerified:false,originalSourceAuthorityRevalidated:false,provenanceVerification:'snapshot-and-checksum; producer-identity-not-independently-attested'};
 return {...payload,linkSha256:await hashBytes(json(stable(payload)))};
}
