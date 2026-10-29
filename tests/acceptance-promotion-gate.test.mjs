import test from 'node:test';import assert from 'node:assert/strict';
import {assessParentAcceptance} from '../scripts/acceptance-promotion-gate.mjs';
const criterion={criterionId:'Q/AC-01',requirement:'real service works',status:'VERIFIED'};
const base={backlog:{tasks:[{id:'Q',acceptance:['real service works']}]},register:{tasks:[{id:'Q',acceptance:[criterion]}]},parentId:'Q',receipts:[],trustRegistry:[],sourceCommit:'a'.repeat(40)};
test('without signed receipt cannot approve parent',()=>assert.equal(assessParentAcceptance(base).eligible,false));
test('unverified original criterion cannot be bypassed',()=>{const row={...criterion,status:'UNVERIFIED'};const r=assessParentAcceptance({...base,register:{tasks:[{id:'Q',acceptance:[row]}]},receipts:[{criterionId:'Q/AC-01'}]});assert.equal(r.reason,'original-criterion-not-verified');});
test('unqualified signer refuses task completion',()=>{const r=assessParentAcceptance({...base,receipts:[{criterionId:'Q/AC-01',signerId:'unregistered'}]});assert.equal(r.reason,'unqualified-runner');});

test('one proven criterion plus separate signed owner grant becomes eligible only',async()=>{
 const {generateKeyPairSync,sign}=await import('node:crypto');
 const worker=generateKeyPairSync('ed25519'),owner=generateKeyPairSync('ed25519');
 const signObject=(value,key)=>sign(null,Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))))),key).toString('base64');
 const body={schema:'mgr.acceptance.receipt.v1',criterionId:'Q/AC-01',requirement:'real service works',sourceCommit:base.sourceCommit,commandSha256:'b'.repeat(64),outputSha256:'c'.repeat(64),exitCode:0,truncated:false,timedOut:false,signerId:'runner',environment:'isolated',sourceCoverage:'complete'};
 const grant={parentId:'Q',sourceCommit:base.sourceCommit,decision:'approve',ownerId:'human'};
 const result=assessParentAcceptance({...base,receipts:[{...body,signature:signObject(body,worker.privateKey)}],trustRegistry:[{signerId:'runner',status:'active',qualification:'independent-isolated-runner',publicKey:worker.publicKey,allowedSourceCommits:[base.sourceCommit]}],ownerApproval:{payload:grant,signature:signObject(grant,owner.privateKey)},ownerPublicKey:owner.publicKey});
 assert.equal(result.eligible,true);assert.equal(result.status,'ELIGIBLE_FOR_FINAL_OWNER_CONTROLLED_PROMOTION');
});
