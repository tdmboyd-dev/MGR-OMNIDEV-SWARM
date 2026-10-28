import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {consumeStream,boundedResponseText,responseFailure} from '../companion/chatgpt.mjs';
import {createDashboard,requestIdentity} from '../companion/dashboard.mjs';
import {dockerEnvironment,validateFiles} from '../worker/runner.mjs';
import {jobMemory} from '../companion/job-memory.mjs';

test('worker refuses Windows source aliases and named/remote daemon contexts',()=>{
 for(const path of ['C:/escape','a:secret','NUL','src/CON.txt','x.','x ','a\0b','a?b','a|b','a<b','.ENV','.GIT/config'])assert.throws(()=>validateFiles([{path,content:'x'}]),/Unsafe/);
 assert.throws(()=>validateFiles([{path:'A.js',content:'a'},{path:'a.js',content:'b'}]),/Unsafe/);
 validateFiles([{path:'src/main.js',content:'safe'}]);assert.throws(()=>validateFiles([{path:'unicode.txt',content:'😀'.repeat(25001)}]),/Unsafe/);assert.throws(()=>validateFiles(Array.from({length:26},(_,i)=>({path:'file'+i+'.txt',content:'😀'.repeat(25000)}))),/Source exceeds budget/);
 const context=process.env.DOCKER_CONTEXT,host=process.env.DOCKER_HOST;
 try{process.env.DOCKER_CONTEXT='remote-production';assert.throws(()=>dockerEnvironment(),/Named/);delete process.env.DOCKER_CONTEXT;process.env.DOCKER_HOST='tcp://remote:2375';assert.throws(()=>dockerEnvironment(),/local/);process.env.DOCKER_HOST='npipe:////./pipe/docker_engine';assert.equal(dockerEnvironment().DOCKER_CONTEXT,'default');}
 finally{if(context===undefined)delete process.env.DOCKER_CONTEXT;else process.env.DOCKER_CONTEXT=context;if(host===undefined)delete process.env.DOCKER_HOST;else process.env.DOCKER_HOST=host;}
});

test('job memory preserves complete values during concurrent reads and writes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'omni-memory-integrity-'));
 try{const memory=await jobMemory(dir);await memory.save({id:'job',value:0});await Promise.all(Array.from({length:50},(_,n)=>Promise.all([memory.save({id:'job',value:n+1}),memory.get('job')])));assert.deepEqual(await memory.get('job'),{id:'job',value:50});assert.equal((await memory.list()).length,1);const mutable={id:'original',value:123};const saving=memory.save(mutable);mutable.id='changed';mutable.value=999;await saving;assert.deepEqual(await memory.get('original'),{id:'original',value:123});assert.equal(await memory.get('changed'),null);const reopened=await jobMemory(dir);assert.equal((await reopened.get('job')).value,50);}
 finally{await rm(dir,{recursive:true,force:true});}
});

test('durable companion replay binds objective, all request data and model settings across restart',async()=>{
 const state=await mkdtemp(join(tmpdir(),'omni-replay-integrity-'));let app,calls=0;
 const settings={model:'fixture-model',effort:'default',profile:'codex'};
 const request={format:'omnidev-account-request',jobId:'job',sourceDigest:'a'.repeat(64),objective:'Original objective',files:[]};
 const execute=async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture-model',name:'Fixture',reasoning:['default']}]);calls++;const input=JSON.parse(await readFile(args[1],'utf8'));await writeFile(args[3],JSON.stringify({jobId:input.jobId,sourceDigest:input.sourceDigest,candidate:{summary:'fixture',patches:[]}}));return '';};
 const start=async()=>{app=await createDashboard({port:0,execute,stateDir:state});await fetch(app.origin+'/state',{headers:{'X-Omni-Session':app.session}});};
 const post=(path,body)=>fetch(app.origin+path,{method:'POST',headers:{Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const close=async()=>{app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));app=null;};
 try{
  await writeFile(join(state,'account.json'),JSON.stringify({subject:'fixture-owner'}));await start();
  assert.equal((await post('/start-reviews',{settings,requests:[{...request,jobId:'review-a',kind:'specialist-review',parentJobId:'parent-a'},{...request,jobId:'review-b',kind:'specialist-review',parentJobId:'parent-b'}]})).status,400);assert.equal(calls,0);
  assert.equal((await post('/start',{settings,request})).status,202);
  let saved;for(let n=0;n<100;n++){saved=await(await fetch(app.origin+'/jobs/job',{headers:{'X-Omni-Session':app.session}})).json();if(saved.status==='completed')break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(saved.status,'completed');assert.equal(calls,1);
  for(const changed of [{...request,objective:'Changed objective'},{...request,files:[{path:'x',content:'changed'}]},{...request,kind:'specialist-review'}])assert.equal((await post('/start',{settings,request:changed})).status,409);
  assert.equal((await post('/start',{settings:{...settings,profile:'chat'},request})).status,409);assert.equal(calls,1);
  await close();await start();assert.equal((await post('/start',{settings,request})).status,200);assert.equal(calls,1);
  const legacy={id:'legacy',subject:'fixture-owner',sourceDigest:request.sourceDigest,status:'completed',candidate:{preserved:true}};await(await jobMemory(join(state,'jobs'))).save(legacy);assert.equal((await post('/start',{settings,request:{...request,jobId:'legacy'}})).status,409);assert.deepEqual(await(await jobMemory(join(state,'jobs'))).get('legacy'),legacy);
  assert.equal(requestIdentity(request,settings),requestIdentity({files:[],objective:request.objective,sourceDigest:request.sourceDigest,jobId:'job',format:request.format},settings));
  assert.notEqual(requestIdentity(request,settings),requestIdentity({...request,objective:'changed'},settings));
 }finally{if(app)await close();await rm(state,{recursive:true,force:true});}
});

test('provider intake cancels oversize bodies and rejects final-frame output overflow',async()=>{
 let canceled=false;const stream=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(101));},cancel(){canceled=true;}});
 await assert.rejects(()=>boundedResponseText(new Response(stream),100),/intake limit/);assert.equal(canceled,true);
 const events=async function*(){yield Buffer.from('data: '+JSON.stringify({type:'response.output_text.delta',delta:'a'.repeat(200001)})+'\n\ndata: '+JSON.stringify({type:'response.completed'})+'\n\n');};
 await assert.rejects(()=>consumeStream(events()),/output limit/);
 assert.equal(await boundedResponseText(new Response('valid'),5),'valid');
 const error=await responseFailure(new Response('x'.repeat(100001),{status:400}));assert.equal(error.status,400);assert.equal(error.parameter,undefined);
});

test('concurrent specialist admission cannot overwrite the winning objective binding',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'omni-admission-integrity-'));let release,app,calls=0;
 const gate=new Promise(resolve=>release=resolve),settings={model:'fixture',effort:'default',profile:'codex'};
 const base={format:'omnidev-account-request',kind:'specialist-review',parentJobId:'parent',jobId:'review',sourceDigest:'a'.repeat(64),files:[]};
 try{
  await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));
  app=await createDashboard({port:0,stateDir:dir,execute:async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);calls++;const r=JSON.parse(await readFile(args[1],'utf8'));await gate;await writeFile(args[3],JSON.stringify({jobId:r.jobId,sourceDigest:r.sourceDigest,candidate:{approved:true,findings:[r.objective]}}));}});
  const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'};
  await fetch(app.origin+'/state',{headers});
  const requests=[{...base,objective:'First objective'},{...base,objective:'Other objective'}];
  const responses=await Promise.all(requests.map(request=>fetch(app.origin+'/start-reviews',{method:'POST',headers,body:JSON.stringify({settings,requests:[request]})})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[202,409]);const winner=responses.findIndex(r=>r.status===202);
  for(let n=0;n<100&&calls===0;n++)await new Promise(resolve=>setTimeout(resolve,10));assert.equal(calls,1);release();
  let row;for(let n=0;n<200;n++){row=await(await fetch(app.origin+'/jobs/review',{headers})).json();if(row.status==='completed')break;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal(row.status,'completed');assert.deepEqual(row.candidate.candidate.findings,[requests[winner].objective]);assert.equal(row.requestDigest,requestIdentity(requests[winner],settings));assert.equal(calls,1);
 }finally{release();if(app){app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}await rm(dir,{recursive:true,force:true});}
});

test('fatal review waits for accepted repair admission before finalizing its queued receipt',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'omni-append-integrity-'));let app,releaseInference,releaseAppend,appendReached,inferenceReached;
 const inferenceGate=new Promise(resolve=>releaseInference=resolve),appendGate=new Promise(resolve=>releaseAppend=resolve);
 const appended=new Promise(resolve=>appendReached=resolve),inference=new Promise(resolve=>inferenceReached=resolve);
 const settings={model:'fixture',effort:'default',profile:'codex'},base={format:'omnidev-account-request',parentJobId:'parent',sourceDigest:'a'.repeat(64),objective:'Review',files:[]};let calls=0;
 try{
  await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));
  app=await createDashboard({port:0,stateDir:dir,memoryFactory:async path=>{const memory=await jobMemory(path);return {...memory,save:async job=>{if(job.id==='repair'&&job.status==='queued'){appendReached();await appendGate;}return memory.save(job);}};},execute:async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);calls++;inferenceReached();await inferenceGate;throw Error('OpenAI returned HTTP 429');}});
  const headers={Origin:app.origin,'X-Omni-Session':app.session,'Content-Type':'application/json'};
  const post=(path,body)=>fetch(app.origin+path,{method:'POST',headers,body:JSON.stringify(body)});
  await fetch(app.origin+'/state',{headers});assert.equal((await post('/start-reviews',{settings,requests:[{...base,jobId:'review',kind:'specialist-review'}]})).status,202);await inference;
  const admission=post('/append-work',{requests:[{...base,jobId:'repair',kind:'repair-generation'}]});await appended;
  releaseInference();let review;for(let n=0;n<100;n++){review=await(await fetch(app.origin+'/jobs/review',{headers})).json();if(review.status==='failed')break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(review.status,'failed');
  assert.equal((await(await fetch(app.origin+'/status',{headers})).json()).running,true,'batch retains ownership while append persistence is pending');
  releaseAppend();assert.equal((await admission).status,202);
  let status;for(let n=0;n<100;n++){status=await(await fetch(app.origin+'/status',{headers})).json();if(!status.running)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(status.running,false);assert.equal(status.activeJobs,0);
  const repair=await(await fetch(app.origin+'/jobs/repair',{headers})).json();assert.equal(repair.status,'failed');assert.equal(calls,1,'queued repair never sent inference after fatal review');
 }finally{releaseInference();releaseAppend();if(app){app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));}await rm(dir,{recursive:true,force:true});}
});
