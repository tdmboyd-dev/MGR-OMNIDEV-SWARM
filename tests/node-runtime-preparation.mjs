import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareNodeRuntime} from '../scripts/prepare-node-runtime.mjs';

test('versioned runtime reuses exact bytes and rejects modified cached executable without replacing it',()=>{
 const root=mkdtempSync(join(tmpdir(),'omni-runtime-cache-'));
 try{
  const options={outputDir:root,environmentGlobal:'__omniNodeLocalEnv',versioned:true};
  const first=prepareNodeRuntime(options),second=prepareNodeRuntime(options);
  assert.ok(first.inputs.some(row=>row.path==='worker/application-profile.mjs'));
  assert.match(readFileSync(join(first.outputDir,'jobs.mjs'),'utf8'),/from ['"]\.\/application-profile\.mjs['"]/);
  assert.match(readFileSync(join(first.outputDir,'application-profile.mjs'),'utf8'),/Object\.freeze/);
  assert.equal(second.outputDir,first.outputDir);assert.equal(second.manifestSha256,first.manifestSha256);
  const target=join(first.outputDir,'jobs.mjs'),original=readFileSync(target,'utf8');
  writeFileSync(target,original+'\n// cache tampering\n');
  assert.throws(()=>prepareNodeRuntime(options),/snapshot changed/);
  assert.equal(readFileSync(target,'utf8'),original+'\n// cache tampering\n');
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('versioned runtime separates trusted host environment and rejects unlisted snapshot data',()=>{
 const root=mkdtempSync(join(tmpdir(),'omni-runtime-environment-'));
 try{
  const first=prepareNodeRuntime({outputDir:root,versioned:true});
  const host=prepareNodeRuntime({outputDir:root,environmentGlobal:'__omniNodeLocalEnv',versioned:true});
  assert.notEqual(first.outputDir,host.outputDir);
  assert.match(readFileSync(join(host.outputDir,'store.mjs'),'utf8'),/globalThis.__omniNodeLocalEnv/);
  writeFileSync(join(host.outputDir,'unlisted.mjs'),'throw Error("unexpected");');
  assert.throws(()=>prepareNodeRuntime({outputDir:root,environmentGlobal:'__omniNodeLocalEnv',versioned:true}),/unlisted data/);
  assert.throws(()=>prepareNodeRuntime({outputDir:root,environmentGlobal:'globalThis.bad;'}),/environment binding/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
