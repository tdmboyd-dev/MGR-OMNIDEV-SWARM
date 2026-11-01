import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFiles,dockerEnvironment} from '../worker/runner.mjs';

test('worker independently refuses nonportable and ambiguous paths before creating files',()=>{
 for(const path of ['C:/outside.ts','src/file:stream','src\\file.ts','../escape','/root','a//b','a/./b','src/NUL.txt','src/Lpt1','src/end.','src/end ','.GIT/config','.ENV.json','src/ID_RSA','a\u0000b'])assert.throws(()=>validateFiles([{path,content:'fixture'}]),/Unsafe source/);
 assert.throws(()=>validateFiles([null]),/Unsafe source/);
 assert.throws(()=>validateFiles([{path:'src/Foo.ts',content:'a'},{path:'src/foo.ts',content:'b'}]),/Unsafe source/);
 validateFiles([{path:'src/safe.ts',content:'export const value=1;'}]);
});
test('worker source budgets measure UTF8 bytes at exact per-file and aggregate boundaries',()=>{
 const content='😀'.repeat(25000);assert.equal(Buffer.byteLength(content),100000);
 validateFiles([{path:'src/boundary.ts',content}]);
 assert.throws(()=>validateFiles([{path:'src/over.ts',content:content+'😀'}]),/Unsafe source/);
 const files=Array.from({length:25},(_,i)=>({path:`src/part${i}.ts`,content}));validateFiles(files);
 assert.throws(()=>validateFiles([...files,{path:'src/extra.ts',content:'x'}]),/Source exceeds budget/);
});
test('Docker environment refuses unqualified remote routing and excludes service credentials',()=>{
 const keys=['DOCKER_CONTEXT','DOCKER_HOST','OMNI_TEST_PROVIDER_SECRET'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{
  delete process.env.DOCKER_CONTEXT;delete process.env.DOCKER_HOST;process.env.OMNI_TEST_PROVIDER_SECRET='owned-fixture-marker';
  let env=dockerEnvironment();assert.equal(env.DOCKER_CONTEXT,'default');assert.equal(env.OMNI_TEST_PROVIDER_SECRET,undefined);assert.equal(env.PATH,process.env.PATH);
  process.env.DOCKER_CONTEXT='unqualified-remote';assert.throws(()=>dockerEnvironment(),/Named Docker contexts/);delete process.env.DOCKER_CONTEXT;
  for(const host of ['tcp://example.invalid:2375','ssh://example.invalid','npipe://remote/pipe/docker_engine']){process.env.DOCKER_HOST=host;assert.throws(()=>dockerEnvironment(),/local Docker socket/);}
  for(const host of ['unix:///var/run/docker.sock','npipe:////./pipe/docker_engine']){process.env.DOCKER_HOST=host;assert.equal(dockerEnvironment().DOCKER_HOST,host);}
 }finally{for(const key of keys)if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
});
