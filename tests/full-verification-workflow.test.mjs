import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runFullVerification} from '../scripts/run-full-verification.mjs';
async function fixture(scripts,callback){
 const cwd=await mkdtemp(join(tmpdir(),'mgr-full-verification-'));
 try{
  await mkdir(join(cwd,'tests'));await writeFile(join(cwd,'.gitignore'),'.test-runtime/\noutputs/\n');
  for(const [name,content]of Object.entries(scripts))await writeFile(join(cwd,'tests',name),content);
  for(const argv of [['init','-q'],['add','.'],['-c','user.name=Verification Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']])execFileSync('git',argv,{cwd,stdio:'ignore'});
  await callback(cwd,join(cwd,'outputs','evidence'));
 }finally{await rm(cwd,{recursive:true,force:true});}
}
const prepare="import{mkdirSync,writeFileSync}from'node:fs';mkdirSync('.test-runtime',{recursive:true});writeFileSync('.test-runtime/example.mjs','export const source=1;');console.log('prepared current source');";
test('full workflow saves exact log bytes and an inspectable source-bound report',async()=>{
 await fixture({'worker-cleanup.mjs':"console.log('PASS actual check');"},async(cwd,outputDir)=>{
  const report=await runFullVerification({cwd,outputDir,profiles:['cleanup']});assert.equal(report.localRegressionPassed,true);assert.equal(report.summary.passedProfiles,1);assert.equal(report.summary.independentlyCertifiedParents,0);
  const log=await readFile(join(outputDir,'cleanup.log'));assert.equal(createHash('sha256').update(log).digest('hex'),report.runs[0].outputSha256);
  assert.equal(JSON.parse(await readFile(join(outputDir,'report.json'),'utf8')).completed,true);
 });
});
test('compiled-runtime suites cannot reuse stale ignored output without preparing first',async()=>{
 await assert.rejects(runFullVerification({profiles:['runtime']}),/prepare must run first/);
});
test('zero criteria, duplicate profiles and arbitrary commands never produce a green report',async()=>{
 for(const profiles of [[],['cleanup','cleanup'],['shell']])await assert.rejects(runFullVerification({profiles}),/nonempty unique approved/);
});
test('failed checks preserve logs and later independent checks still run',async()=>{
 await fixture({'worker-cleanup.mjs':"console.error('failure observed');process.exit(1);",'generation-timeout.mjs':"console.log('PASS independent check');"},async(cwd,outputDir)=>{
  const report=await runFullVerification({cwd,outputDir,profiles:['cleanup','generation']});assert.equal(report.localRegressionPassed,false);assert.equal(report.summary.failedProfiles,1);assert.equal(report.summary.passedProfiles,1);assert.match(await readFile(join(outputDir,'cleanup.log'),'utf8'),/failure observed/);
 });
});
test('changing generated modules cannot pass even when committed source is unchanged',async()=>{
 await fixture({'prepare.mjs':prepare,'worker-cleanup.mjs':"import{writeFileSync}from'node:fs';writeFileSync('.test-runtime/example.mjs','tampered');console.log('PASS fake check');"},async(cwd,outputDir)=>{
  const report=await runFullVerification({cwd,outputDir,profiles:['prepare','cleanup']});assert.equal(report.runs[0].passed,true);assert.equal(report.runs[1].sourceUnchanged,true);assert.equal(report.runs[1].passed,false);assert.equal(report.localRegressionPassed,false);assert.match(report.runs[1].reason,/prepared modules changed/);
 });
});
test('failed preparation blocks dependent suites instead of executing stale compiled code',async()=>{
 await fixture({'prepare.mjs':"console.log('failed preparation');process.exit(1);",'runtime.mjs':"throw Error('must not run');"},async(cwd,outputDir)=>{
  const report=await runFullVerification({cwd,outputDir,profiles:['prepare','runtime']});assert.equal(report.localRegressionPassed,false);assert.equal(report.runs[1].blocked,true);assert.equal(report.runs[1].reason,'preparation failed');
 });
});
test('a silent no-op prepare cannot certify previously generated files as fresh',async()=>{
 await fixture({'prepare.mjs':'','runtime.mjs':"console.log('must not run');"},async(cwd,outputDir)=>{
  await mkdir(join(cwd,'.test-runtime'));await writeFile(join(cwd,'.test-runtime','stale.mjs'),'old code');
  const report=await runFullVerification({cwd,outputDir,profiles:['prepare','runtime']});assert.equal(report.localRegressionPassed,false);assert.equal(report.runs[0].passed,false);assert.equal(report.preparedModules.files.length,0);assert.equal(report.runs[1].blocked,true);
 });
});
