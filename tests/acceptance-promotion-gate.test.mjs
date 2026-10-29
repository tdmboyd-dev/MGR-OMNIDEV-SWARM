import test from 'node:test';import assert from 'node:assert/strict';
import {assessParentAcceptance} from '../scripts/acceptance-promotion-gate.mjs';
const criterion={criterionId:'Q/AC-01',requirement:'real service works',status:'VERIFIED'};
const base={backlog:{tasks:[{id:'Q',acceptance:['real service works']}]},register:{tasks:[{id:'Q',acceptance:[criterion]}]},parentId:'Q',receipts:[],trustRegistry:[],sourceCommit:'a'.repeat(40)};
test('without signed receipt cannot approve parent',()=>assert.equal(assessParentAcceptance(base).eligible,false));
test('unverified original criterion cannot be bypassed',()=>{const row={...criterion,status:'UNVERIFIED'};const r=assessParentAcceptance({...base,register:{tasks:[{id:'Q',acceptance:[row]}]},receipts:[{criterionId:'Q/AC-01'}]});assert.equal(r.reason,'original-criterion-not-verified');});
test('unqualified signer refuses task completion',()=>{const r=assessParentAcceptance({...base,receipts:[{criterionId:'Q/AC-01',signerId:'unregistered'}]});assert.equal(r.reason,'unqualified-runner');});
