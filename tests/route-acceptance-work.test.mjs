import test from 'node:test';import assert from 'node:assert/strict';import {routeAcceptanceWave} from '../scripts/route-acceptance-work.mjs';
const entry=(id,requirement)=>({id,requirement,status:'UNVERIFIED'});
const wave={contract:'mgr.omnidev.acceptance-wave.v1',parents:80,p0:30,additional:50,criteria:2,items:[{id:'RUN-01',priority:'P0',criteria:[entry('RUN-01/AC-01','An isolated Docker worker runs tests')]},{id:'AUTH-01',priority:'P0',criteria:[entry('AUTH-01/AC-01','A real authorized OAuth provider is connected')]}]};
test('routes criteria without auto-certifying',()=>{const r=routeAcceptanceWave(wave);assert.equal(r.criteria,2);assert.equal(r.bucketCounts['isolated-host'],1);assert.equal(r.bucketCounts['provider-access'],1);assert.ok(r.items.every(x=>x.criteria.every(c=>c.status==='AWAITING_CRITERION_VERIFICATION')));});
test('rejects forged verified status',()=>{const w=structuredClone(wave);w.items[0].criteria[0].status='VERIFIED';assert.throws(()=>routeAcceptanceWave(w));});
test('rejects changed number of original acceptance clauses',()=>{const w={...wave,criteria:999};assert.throws(()=>routeAcceptanceWave(w),/conservation/);});
