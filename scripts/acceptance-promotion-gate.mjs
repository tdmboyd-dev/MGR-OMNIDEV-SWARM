import {verify,createPublicKey} from 'node:crypto';
import {verifyAcceptanceReceipt} from './verify-acceptance-receipt.mjs';
const id=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function checkSignature(payload,signature,key){
 try{const k=key?.type==='public'?key:createPublicKey(key);return k.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(payload).sort(([a],[b])=>a.localeCompare(b))))),k,Buffer.from(signature,'base64'));}
 catch{return false;}
}
/** Read-only eligibility decision, never a write or deployment. Both qualified runner
 * and separately authorized human approval signatures must be verified upstream. */
export function assessParentAcceptance({backlog,register,parentId,receipts,trustRegistry,ownerApproval,ownerPublicKey,sourceCommit}){
 if(!id.test(parentId??'')||!Array.isArray(backlog?.tasks)||!Array.isArray(register?.tasks))return {eligible:false,reason:'invalid-parent-or-register'};
 const task=backlog.tasks.find(x=>x.id===parentId),row=register.tasks.find(x=>x.id===parentId);
 if(!task||!row||row.acceptance?.length!==task.acceptance?.length)return {eligible:false,reason:'task-or-criterion-mismatch'};
 if(!Array.isArray(receipts)||receipts.length!==row.acceptance.length||!Array.isArray(trustRegistry))return {eligible:false,reason:'incomplete-receipts-or-trust-registry'};
 const keys=new Map(trustRegistry.map(x=>[x.signerId,x]));
 for(let i=0;i<row.acceptance.length;i++){
  const criterion=row.acceptance[i],receipt=receipts.find(x=>x.criterionId===criterion.criterionId);
  if(criterion.requirement!==task.acceptance[i]||criterion.status!=='VERIFIED'||!receipt)return {eligible:false,reason:'original-criterion-not-verified',criterionId:criterion.criterionId};
  const identity=keys.get(receipt.signerId);
  if(!identity||identity.status!=='active'||identity.qualification!=='independent-isolated-runner'||identity.allowedSourceCommits?.includes(sourceCommit)!==true)return {eligible:false,reason:'unqualified-runner',criterionId:criterion.criterionId};
  const result=verifyAcceptanceReceipt({criterion,receipt,publicKey:identity.publicKey,expectedCommit:sourceCommit});
  if(!result.ok)return {eligible:false,reason:result.reason,criterionId:criterion.criterionId};
  if(receipt.environment==='fixture'||receipt.sourceCoverage!=='complete')return {eligible:false,reason:'fixture-or-incomplete-source',criterionId:criterion.criterionId};
 }
 const approval=ownerApproval?.payload;
 if(!approval||approval.parentId!==parentId||approval.sourceCommit!==sourceCommit||approval.decision!=='approve'||!id.test(approval.ownerId??'')||!ownerApproval.signature||!ownerPublicKey||!checkSignature(approval,ownerApproval.signature,ownerPublicKey))return {eligible:false,reason:'missing-authenticated-owner-approval'};
 return {eligible:true,status:'ELIGIBLE_FOR_FINAL_OWNER_CONTROLLED_PROMOTION',parentId,criteriaVerified:row.acceptance.length,sourceCommit};
}
