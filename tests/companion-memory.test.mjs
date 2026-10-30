import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rename,rm,realpath,lstat} from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {jobMemory} from '../companion/job-memory.mjs';
import {createDashboard} from '../companion/dashboard.mjs';
const hash=id=>createHash('sha256').update(id).digest('hex');
async function directory(t){
 const dir=await mkdtemp(join(tmpdir(),'mgr-companion-memory-'));
 t.after(async()=>{assert.equal((await lstat(dir)).isSymbolicLink(),false);assert.equal(dirname(await realpath(dir)),await realpath(tmpdir()));assert(basename(dir).startsWith('mgr-companion-memory-'));await rm(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});});
 return dir;
}

test('transient Windows replacement failure preserves the old record until one atomic successful replacement',async t=>{
 const dir=await directory(t),native=await jobMemory(dir);await native.save({id:'job',status:'running'});let calls=0;
 const memory=await jobMemory(dir,{platform:'win32',replace:async(source,destination)=>{
  calls++;assert.equal(JSON.parse(await readFile(destination,'utf8')).status,'running');
  if(calls<3)throw Object.assign(Error('transient native lock'),{code:'EPERM'});
  await rename(source,destination);
 }});
 await memory.save({id:'job',status:'completed',candidate:{sourceDigest:'a'.repeat(64)}});
 assert.equal(calls,3);assert.equal((await memory.get('job')).status,'completed');
 assert.deepEqual(await readdir(dir),[hash('job')+'.json']);
});

test('exhausted Windows replacement remains failed, keeps exact pending bytes and blocks replay after restart',async t=>{
 const dir=await directory(t),native=await jobMemory(dir);await native.save({id:'job',status:'running'});let calls=0;
 const memory=await jobMemory(dir,{platform:'win32',replace:async()=>{calls++;throw Object.assign(Error('private path must not escape'),{code:'EACCES'});}});
 const completed={id:'job',status:'completed',candidate:{sourceDigest:'a'.repeat(64)}};
 await assert.rejects(memory.save(completed),e=>e.code==='JOB_MEMORY_RECOVERY_REQUIRED'&&e.status===503&&!e.message.includes('private path'));
 assert.equal(calls,8);assert.equal(JSON.parse(await readFile(join(dir,hash('job')+'.json'),'utf8')).status,'running');
 const pending=(await readdir(dir)).find(name=>name.startsWith(hash('job')+'.json.'));assert(pending);assert.deepEqual(JSON.parse(await readFile(join(dir,pending),'utf8')),completed);
 await assert.rejects(memory.get('job'),{code:'JOB_MEMORY_RECOVERY_REQUIRED'});assert.equal((await memory.list())[0].status,'recovery-required');
 const restarted=await jobMemory(dir);await assert.rejects(restarted.get('job'),{code:'JOB_MEMORY_RECOVERY_REQUIRED'});await assert.rejects(restarted.save(completed),{code:'JOB_MEMORY_RECOVERY_REQUIRED'});
});

test('unexpected I/O failure and non-Windows permission failure are not blindly retried',async t=>{
 const dir=await directory(t);
 for(const [platform,code] of [['win32','EIO'],['linux','EPERM']]){
  const target=join(dir,platform);let calls=0;
  const memory=await jobMemory(target,{platform,replace:async()=>{calls++;throw Object.assign(Error('native failure'),{code});}});
  await assert.rejects(memory.save({id:'job',status:'running'}),{code:'JOB_MEMORY_RECOVERY_REQUIRED'});assert.equal(calls,1);
 }
});

test('actual HTTP companion survives failed completion persistence and refuses a second generation across restart',async t=>{
 const dir=await directory(t);await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));let generated=0;
 const execute=async args=>{
  if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);
  generated++;const input=JSON.parse(await readFile(args[1],'utf8'));await writeFile(args[3],JSON.stringify({jobId:input.jobId,sourceDigest:input.sourceDigest,candidate:{approved:true}}));return '';
 };
 const memoryFactory=folder=>jobMemory(folder,{platform:'win32',replace:async(source,destination)=>{
  if(JSON.parse(await readFile(source,'utf8')).status==='completed')throw Object.assign(Error('transient now exhausted'),{code:'EPERM'});
  await rename(source,destination);
 }});
 const request={format:'omnidev-account-request',jobId:'pending-job',sourceDigest:'a'.repeat(64),objective:'Fixture only',files:[]};
 const settings={model:'fixture',effort:'default',profile:'codex'};
 for(const restart of [false,true]){
  const app=await createDashboard({port:0,stateDir:dir,execute,...(!restart?{memoryFactory}:{})});
  try{
   const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'};
   await fetch(app.origin+'/state',{headers});
   const start=()=>fetch(app.origin+'/start',{method:'POST',headers,body:JSON.stringify({settings,request})});
   if(!restart){
    assert.equal((await start()).status,202);let observed;
    const deadline=Date.now()+5000;
    do{observed=await fetch(app.origin+'/jobs/'+request.jobId,{headers});if(observed.status===503)break;await observed.arrayBuffer();await new Promise(resolve=>setTimeout(resolve,20));}while(Date.now()<deadline);
    assert.equal(observed.status,503);assert.match((await observed.json()).error,/requires recovery/);
   }
   assert.equal((await start()).status,503);assert.equal(generated,1);
   assert.equal((await fetch(app.origin+'/jobs/'+request.jobId,{headers})).status,503);
  }finally{app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}
 }
 assert.equal(generated,1);
});
