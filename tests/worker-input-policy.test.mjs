import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFiles,dockerEnvironment,execute} from '../worker/runner.mjs';
import {runNativeAttempt} from '../worker/windows-appcontainer.mjs';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {isAbsolute} from 'node:path';

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
test('both worker entrypoints reject ambiguous directory paths before workspace allocation',async()=>{
 const base=join(tmpdir(),'omni-rejected-path-'+randomUUID());
 const file={path:'src/value.ts',content:'fixture'};
 for(const path of ['SRC/extra.ts','src/value.ts/extra.ts','src']){
  const files=[file,{path,content:'fixture'}];
  for(const ordered of [files,[...files].reverse()]){
   assert.throws(()=>validateFiles(ordered),/Unsafe source/);
   await assert.rejects(execute({files:ordered}),/Unsafe source/);
   if(process.platform==='win32')await assert.rejects(runNativeAttempt({files:ordered,arguments:[],base}),/Unsafe source/);
   assert.equal(existsSync(base),false);
  }
 }
 validateFiles([file,{path:'src/extra.ts',content:'fixture'}]);
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

test('an explicit local Docker endpoint is not overridden by a forced default context',()=>{
 const keys=['DOCKER_CONTEXT','DOCKER_HOST'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{
  for(const context of [undefined,'default'])for(const host of ['unix:///var/run/docker.sock','npipe:////./pipe/dockerDesktopLinuxEngine']){
   if(context===undefined)delete process.env.DOCKER_CONTEXT;else process.env.DOCKER_CONTEXT=context;
   process.env.DOCKER_HOST=host;
   const env=dockerEnvironment();assert.equal(env.DOCKER_HOST,host);assert.equal(env.DOCKER_CONTEXT,undefined,'Docker context selection overrides DOCKER_HOST');
  }
  delete process.env.DOCKER_HOST;assert.equal(dockerEnvironment().DOCKER_CONTEXT,'default');
 }finally{for(const key of keys)if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
});

test('installed Docker CLI reaches only the explicitly selected owned Windows metadata pipe',{timeout:45000},async t=>{
 const cli=process.env.OMNI_TEST_DOCKER_CLI;
 if(process.platform!=='win32'||!cli){t.skip('Requires Windows and explicit installed Docker CLI path; no real daemon/container is tested');return;}
 assert.ok(isAbsolute(cli));
 const name='omni-endpoint-'+randomUUID(),version='owned-endpoint-'+randomUUID(),calls=[];
 const server=createServer((request,response)=>{
  calls.push(request.url);response.setHeader('API-Version','1.53');
  if(request.url==='/_ping'){response.end('OK');return;}
  if(/^\/(?:v[0-9]+\.[0-9]+\/)?version$/.test(request.url)){
   response.setHeader('content-type','application/json');response.end(JSON.stringify({Version:version,ApiVersion:'1.53',MinAPIVersion:'1.24',Os:'linux',Arch:'amd64'}));return;
  }
  response.writeHead(404);response.end();
 });
 await new Promise((yes,no)=>{server.once('error',no);server.listen('\\\\.\\pipe\\'+name,yes);});
 t.after(()=>new Promise((yes,no)=>{server.close(error=>error?no(error):yes());server.closeAllConnections();}));
 const keys=['DOCKER_CONTEXT','DOCKER_HOST'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));let env;
 try{process.env.DOCKER_CONTEXT='default';process.env.DOCKER_HOST='npipe:////./pipe/'+name;env=dockerEnvironment();}
 finally{for(const key of keys)if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
 const result=await promisify(execFile)(cli,['version','--format','{{.Server.Version}}'],{env,timeout:30000,windowsHide:true,maxBuffer:20000});
 assert.equal(result.stdout.trim(),version);assert.ok(calls.some(path=>path.endsWith('/version')));
 assert.ok(calls.every(path=>path==='/_ping'||/^\/(?:v[0-9]+\.[0-9]+\/)?version$/.test(path)),JSON.stringify(calls));
});
