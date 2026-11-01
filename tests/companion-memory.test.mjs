import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rename,rm,realpath,lstat} from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {jobMemory} from '../companion/job-memory.mjs';
import {createDashboard} from '../companion/dashboard.mjs';
import {waitFor} from './support/wait-for.mjs';
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

test('a held HTTP status read cannot overwrite a later completed generation',async t=>{
 const dir=await directory(t);await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));
 let backing,holdRead=false,readEntered,releaseRead,executionStarted,releaseExecution;
 const entered=new Promise(resolve=>readEntered=resolve),readGate=new Promise(resolve=>releaseRead=resolve),started=new Promise(resolve=>executionStarted=resolve),executionGate=new Promise(resolve=>releaseExecution=resolve);
 const app=await createDashboard({port:0,stateDir:dir,memoryFactory:async folder=>{backing=await jobMemory(folder);return {...backing,async get(id){const value=await backing.get(id);if(holdRead&&value?.status==='running'){holdRead=false;readEntered();await readGate;}return value;}};},execute:async args=>{
  if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);
  const input=JSON.parse(await readFile(args[1],'utf8'));executionStarted();await executionGate;await writeFile(args[3],JSON.stringify({jobId:input.jobId,sourceDigest:input.sourceDigest,candidate:{approved:true}}));return '';
 }});
 const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'},request={format:'omnidev-account-request',kind:'specialist-review',parentJobId:'parent',jobId:'held-read',sourceDigest:'a'.repeat(64),objective:'Fixture',files:[]};
 try{
  await fetch(app.origin+'/state',{headers});assert.equal((await fetch(app.origin+'/start-reviews',{method:'POST',headers,body:JSON.stringify({requests:[request],settings:{model:'fixture',effort:'default',profile:'codex'}})})).status,202);
  await started;holdRead=true;const reading=fetch(app.origin+'/jobs/'+request.jobId,{headers});await entered;releaseExecution();
  await waitFor(async()=>(await(await fetch(app.origin+'/status',{headers})).json()),value=>!value.running&&value.activeJobs===0,{name:'owned generation drain'});
  const completed=await backing.get(request.jobId);assert.equal(completed.status,'completed');releaseRead();
  assert.equal((await(await reading).json()).status,'completed');assert.deepEqual(await backing.get(request.jobId),completed);
 }finally{releaseExecution();releaseRead();app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}
});

test('interrupted status is a read-only process view and does not rewrite the last durable state',async t=>{
 const dir=await directory(t);await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));const memory=await jobMemory(join(dir,'jobs'));
 const saved={id:'old-job',subject:'fixture-owner',status:'running',sourceDigest:'a'.repeat(64)};await memory.save(saved);let generated=0;
 const app=await createDashboard({port:0,stateDir:dir,execute:async()=>{generated++;throw Error('Status reads cannot infer');}});
 try{const headers={'X-Omni-Session':app.session,Origin:app.origin};assert.equal((await(await fetch(app.origin+'/jobs/old-job',{headers})).json()).status,'interrupted');assert.deepEqual(await memory.get('old-job'),saved);assert.equal(generated,0);}
 finally{app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}
});

test('background ownership lasts through the final durable completion write',async t=>{
 const dir=await directory(t);await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));let entered,release,generated=0;
 const writing=new Promise(resolve=>entered=resolve),gate=new Promise(resolve=>release=resolve);
 const app=await createDashboard({port:0,stateDir:dir,memoryFactory:async folder=>{const memory=await jobMemory(folder);return {...memory,async save(job){if(job.id==='first'&&job.status==='completed'){entered();await gate;}return memory.save(job);}};},execute:async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);generated++;const input=JSON.parse(await readFile(args[1],'utf8'));await writeFile(args[3],JSON.stringify({jobId:input.jobId,sourceDigest:input.sourceDigest,candidate:{approved:true}}));return '';}});
 const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'},settings={model:'fixture',effort:'default',profile:'codex'},request=id=>({format:'omnidev-account-request',jobId:id,sourceDigest:'a'.repeat(64),objective:'Fixture',files:[]}),post=id=>fetch(app.origin+'/start',{method:'POST',headers,body:JSON.stringify({settings,request:request(id)})});
 try{await fetch(app.origin+'/state',{headers});assert.equal((await post('first')).status,202);await writing;const status=await(await fetch(app.origin+'/status',{headers})).json();assert.equal(status.running,true);assert.equal(status.activeJobs,1);assert.equal((await post('second')).status,409);assert.equal(generated,1);release();await waitFor(async()=>(await(await fetch(app.origin+'/status',{headers})).json()),value=>!value.running&&value.activeJobs===0,{name:'final durable write'});assert.equal((await(await fetch(app.origin+'/jobs/first',{headers})).json()).status,'completed');}
 finally{release();app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}
});

test('pausing a batch retains its owner until queued-state persistence finishes',async t=>{
 const dir=await directory(t);await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));let executionEntered,releaseExecution,parkEntered,releasePark,generated=0;
 const started=new Promise(resolve=>executionEntered=resolve),executionGate=new Promise(resolve=>releaseExecution=resolve),parking=new Promise(resolve=>parkEntered=resolve),parkGate=new Promise(resolve=>releasePark=resolve);
 const app=await createDashboard({port:0,stateDir:dir,memoryFactory:async folder=>{const memory=await jobMemory(folder);return {...memory,async save(job){if(job.id==='queued'&&job.status==='paused'){parkEntered();await parkGate;}return memory.save(job);}};},execute:async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);generated++;const input=JSON.parse(await readFile(args[1],'utf8'));executionEntered();await executionGate;await writeFile(args[3],JSON.stringify({jobId:input.jobId,sourceDigest:input.sourceDigest,candidate:{approved:true}}));return '';}});
 const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'},settings={model:'fixture',effort:'default',profile:'codex'},request=id=>({format:'omnidev-account-request',kind:'specialist-review',parentJobId:'parent',jobId:id,sourceDigest:'a'.repeat(64),objective:'Fixture',files:[]}),post=(route,body)=>fetch(app.origin+route,{method:'POST',headers,body:JSON.stringify(body)});
 try{await fetch(app.origin+'/state',{headers});assert.equal((await post('/start-reviews',{settings,requests:[request('in-flight'),request('queued')]})).status,202);await started;await post('/review-control',{parentJobId:'parent',command:'pause'});releaseExecution();await parking;assert.equal((await(await fetch(app.origin+'/status',{headers})).json()).running,true);assert.equal((await post('/start',{settings,request:request('later')})).status,409);assert.equal(generated,1);releasePark();await waitFor(async()=>(await(await fetch(app.origin+'/status',{headers})).json()),value=>!value.running&&value.activeJobs===0,{name:'paused queue drain'});assert.equal((await(await fetch(app.origin+'/jobs/queued',{headers})).json()).status,'paused');}
 finally{releaseExecution();releasePark();app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}
});

test('a failed consumer cannot release the batch while another inference is still owned',async t=>{
 const dir=await directory(t);await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));let persistenceFailed,secondEntered,releaseSecond,generated=0;
 const failed=new Promise(resolve=>persistenceFailed=resolve),second=new Promise(resolve=>secondEntered=resolve),gate=new Promise(resolve=>releaseSecond=resolve);
 const app=await createDashboard({port:0,stateDir:dir,memoryFactory:folder=>jobMemory(folder,{replace:async(source,destination)=>{const value=JSON.parse(await readFile(source,'utf8'));if(value.id==='first'&&value.status==='completed'){persistenceFailed();throw Object.assign(Error('owned injected write failure'),{code:'EIO'});}await rename(source,destination);}}),execute:async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);generated++;const input=JSON.parse(await readFile(args[1],'utf8'));if(input.jobId==='second'){secondEntered();await gate;}await writeFile(args[3],JSON.stringify({jobId:input.jobId,sourceDigest:input.sourceDigest,candidate:{approved:true}}));return '';}});
 const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'},settings={model:'fixture',effort:'default',profile:'codex'},request=id=>({format:'omnidev-account-request',kind:'specialist-review',parentJobId:'parent',jobId:id,sourceDigest:'a'.repeat(64),objective:'Fixture',files:[]}),post=(route,body)=>fetch(app.origin+route,{method:'POST',headers,body:JSON.stringify(body)});
 try{await fetch(app.origin+'/state',{headers});assert.equal((await post('/start-reviews',{settings,requests:[request('first'),request('second')],concurrency:2})).status,202);await Promise.all([failed,second]);assert.equal((await(await fetch(app.origin+'/status',{headers})).json()).running,true);assert.equal((await post('/start',{settings,request:request('third')})).status,409);assert.equal(generated,2);releaseSecond();await waitFor(async()=>(await(await fetch(app.origin+'/status',{headers})).json()),value=>!value.running&&value.activeJobs===0,{name:'other consumer drain'});assert.equal((await fetch(app.origin+'/jobs/first',{headers})).status,503);assert.equal((await(await fetch(app.origin+'/jobs/second',{headers})).json()).status,'completed');assert.equal(generated,2);}
 finally{releaseSecond();app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}
});
