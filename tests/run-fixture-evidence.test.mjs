import test from 'node:test';import assert from 'node:assert/strict';
import {runFixtureEvidence} from '../scripts/run-fixture-evidence.mjs';
test('unrecognized commands fail closed',async()=>await assert.rejects(runFixtureEvidence({profile:'arbitrary-shell'}),/unknown approved/));
test('approved fixture returns exit/output evidence but not certification',async()=>{
 const r=await runFixtureEvidence({profile:'cleanup',timeoutMs:60_000});
 assert.equal(r.passed,true);assert.equal(r.signed,false);
 assert.match(r.outputSha256,/^[a-f0-9]{64}$/);
 assert.equal(r.qualification,'local-fixture-only-not-parent-acceptance');
});
test('unbounded timeouts refused',async()=>await assert.rejects(runFixtureEvidence({profile:'runtime',timeoutMs:999999}),/invalid timeout/));
