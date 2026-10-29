import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runFixtureEvidence} from '../scripts/run-fixture-evidence.mjs';
async function fixture(body,run){
 const root=await mkdtemp(join(tmpdir(),'mgr-fixture-evidence-'));
 try{
  await mkdir(join(root,'tests'));await writeFile(join(root,'tests/worker-cleanup.mjs'),body);
  for(const args of [['init','-q'],['add','.'],['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','record test source']])execFileSync('git',args,{cwd:root,stdio:'ignore'});
  return await run(root);
 }finally{await rm(root,{recursive:true,force:true});}
}
test('unrecognized commands and inherited property names fail closed',async()=>{
 for(const profile of ['arbitrary-shell','__proto__','constructor'])await assert.rejects(runFixtureEvidence({profile}),/unknown approved/);
});
test('approved fixture records source, exact output and closed-process evidence',async()=>{
 await fixture('console.log("actual behavior passed");',async cwd=>{
  const result=await runFixtureEvidence({profile:'cleanup',cwd});
  assert.equal(result.passed,true);assert.equal(result.processClosed,true);assert.equal(result.sourceUnchanged,true);assert.equal(result.sourceCommit,result.sourceCommitAfter);assert.equal(result.signed,false);
  const bytes=Buffer.from(result.outputBase64,'base64');
  assert.equal(result.outputSha256,createHash('sha256').update(bytes).digest('hex'));assert.match(bytes.toString(),/actual behavior passed/);
  assert.equal(result.qualification,'local-fixture-only-not-parent-acceptance');
 });
});
test('unbounded timeouts refused',async()=>await assert.rejects(runFixtureEvidence({profile:'runtime',timeoutMs:999999}),/invalid timeout/));
test('dirty or untracked source cannot be attributed to a clean commit',async()=>{
 await fixture('',async cwd=>{await writeFile(join(cwd,'tests/uncommitted.mjs'),'process.exit(0)');await assert.rejects(runFixtureEvidence({profile:'cleanup',cwd}),/not committed/);});
});
test('a zero exit that modifies source fails source-binding verification',async()=>{
 await fixture("import {writeFileSync} from 'node:fs';writeFileSync('tests/worker-cleanup.mjs','changed');",async cwd=>{
  const result=await runFixtureEvidence({profile:'cleanup',cwd});assert.equal(result.exitCode,0);assert.equal(result.sourceUnchanged,false);assert.equal(result.passed,false);
 });
});
test('timeouts wait for termination even when the child ignores SIGTERM',async()=>{
 await fixture("process.on('SIGTERM',()=>{});setInterval(()=>{},20);",async cwd=>{
  const result=await runFixtureEvidence({profile:'cleanup',cwd,timeoutMs:200});assert.equal(result.passed,false);assert.equal(result.reason,'timeout');assert.equal(result.processClosed,true);assert.ok(result.durationMs<6000);
 });
});
test('output limits cannot be converted to success by a zero exit',async()=>{
 await fixture("process.stdout.write('x'.repeat(2_100_000));",async cwd=>{
  const result=await runFixtureEvidence({profile:'cleanup',cwd});assert.equal(result.passed,false);assert.equal(result.truncated,true);assert.equal(result.capturedBytes,2_000_000);assert.equal(result.reason,'output-limit');
 });
});
test('parent secrets and Node preload options are not forwarded to fixtures',async()=>{
 const previous=process.env.MGR_PRIVATE_TEST_SENTINEL;process.env.MGR_PRIVATE_TEST_SENTINEL='private-value';
 try{await fixture("if(process.env.MGR_PRIVATE_TEST_SENTINEL||process.env.NODE_OPTIONS)process.exit(1);console.log('environment clean');",async cwd=>{assert.equal((await runFixtureEvidence({profile:'cleanup',cwd})).passed,true);});}
 finally{if(previous===undefined)delete process.env.MGR_PRIVATE_TEST_SENTINEL;else process.env.MGR_PRIVATE_TEST_SENTINEL=previous;}
});
test('zero-exit test without observed output is not recorded as passing',async()=>{
 await fixture('',async cwd=>{const result=await runFixtureEvidence({profile:'cleanup',cwd});assert.equal(result.exitCode,0);assert.equal(result.outputObserved,false);assert.equal(result.passed,false);});
});
