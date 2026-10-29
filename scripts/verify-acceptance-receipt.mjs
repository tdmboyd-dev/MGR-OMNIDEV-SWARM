import {createHash,verify,createPublicKey} from 'node:crypto';
const sha=/^[a-f0-9]{64}$/;
const commit=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
export function verifyAcceptanceReceipt({criterion,receipt,publicKey,expectedCommit}){
 if(!criterion||!receipt||!publicKey||!commit.test(expectedCommit??''))return {ok:false,reason:'missing-trust-input'};
 if(receipt.schema!=='mgr.acceptance.receipt.v1'||receipt.criterionId!==criterion.criterionId||receipt.requirement!==criterion.requirement||receipt.sourceCommit!==expectedCommit)return {ok:false,reason:'criterion-or-source-mismatch'};
 if(!sha.test(receipt.outputSha256??'')||!sha.test(receipt.commandSha256??'')||receipt.exitCode!==0||receipt.truncated!==false||receipt.timedOut!==false)return {ok:false,reason:'failed-or-incomplete-execution'};
 if(typeof receipt.signerId!=='string'||!receipt.signerId||typeof receipt.signature!=='string')return {ok:false,reason:'missing-signer'};
 const {signature,...body}=receipt;
 const payload=JSON.stringify(Object.fromEntries(Object.entries(body).sort(([a],[b])=>a.localeCompare(b))));
 try{if((publicKey.type==='public'?publicKey:createPublicKey(publicKey)).asymmetricKeyType!=='ed25519')return {ok:false,reason:'unqualified-key'};
 const good=verify(null,Buffer.from(payload),publicKey,Buffer.from(signature,'base64'));
 return {ok:good,reason:good?'cryptographic-receipt-valid-needs-independent-runner':'signature-rejected'};
 }catch{return {ok:false,reason:'signature-invalid'};}
}
