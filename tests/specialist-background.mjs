import {createDashboard,siteOrigin} from '../companion/dashboard.mjs';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
const dir=await mkdtemp(join(tmpdir(),'omni-plan-'));await writeFile(join(dir,'account.json'),JSON.stringify({subject:'fixture-owner'}));let calls=0;
const app=await createDashboard({port:0,stateDir:dir,execute:async args=>{if(args[0]==='models')return JSON.stringify([{id:'fixture',reasoning:['default']}]);const r=JSON.parse(await readFile(args[1],'utf8'));calls++;await new Promise(resolve=>setTimeout(resolve,80));await writeFile(args[3],JSON.stringify({jobId:r.jobId,sourceDigest:r.sourceDigest,candidate:{approved:true,findings:[]}}));return '';}});
const headers={Origin:siteOrigin,'Content-Type':'application/json','X-Omni-Session':app.session};const requests=[0,1,2,3].map(i=>({format:'omnidev-account-request',kind:'specialist-review',jobId:'parent-review-'+i,sourceDigest:'a'.repeat(64),objective:'Review candidate',files:[]}));const settings={model:'fixture',effort:'default',profile:'codex'};
async function waitForIdle(){
 const deadline=Date.now()+5000;
 while(Date.now()<deadline){
  const response=await fetch(app.origin+'/status',{headers,signal:AbortSignal.timeout(1000)});
  assert.equal(response.status,200);const status=await response.json();
  if(!status.running&&status.activeJobs===0)return;
  await new Promise(resolve=>setTimeout(resolve,20));
 }
 assert.fail('Specialist fixture did not finish and release its work within five seconds');
}
try{await fetch(app.origin+'/state',{headers});let r=await fetch(app.origin+'/start-reviews',{method:'POST',headers,body:JSON.stringify({requests,settings})});assert.equal(r.status,202);await waitForIdle();for(const request of requests){const job=await(await fetch(app.origin+'/jobs/'+request.jobId,{headers})).json();assert.equal(job.status,'completed');assert.equal(job.candidate.candidate.approved,true);}assert.equal(calls,4);r=await fetch(app.origin+'/start-reviews',{method:'POST',headers,body:JSON.stringify({requests,settings})});assert.equal(r.status,202);await waitForIdle();assert.equal(calls,4);r=await fetch(app.origin+'/start-reviews',{method:'POST',headers,body:JSON.stringify({requests:[...requests,requests[0]],settings})});assert.equal(r.status,400);console.log(JSON.stringify({passed:5,scope:'Real local HTTP and asynchronous specialist chain; fixture inference; completed output reuse and plan budget enforcement'}));}finally{await new Promise(resolve=>app.server.close(resolve));await rm(dir,{recursive:true,force:true});}
