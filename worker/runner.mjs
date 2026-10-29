import {trilogyExecutionGuard} from './trilogy-proof.mjs';
import {workerCapacity,boundedPool} from './fleet.mjs';
import {applicationRecipe,applicationDockerArgs,applicationCommand} from './application-profile.mjs';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
function boundedFailureOutput(output,reason){
 const suffix='\n'+reason,remaining=20000-Buffer.byteLength(suffix,'utf8');
 // A budget/timeout diagnostic belongs inside the same report allowance.
 // Streaming decode retains only complete UTF-8 characters at the cutoff.
 const prefix=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from(output,'utf8').subarray(0,remaining),{stream:true});
 return prefix+suffix;
}
export function dockerEnvironment(){const e={PATH:process.env.PATH};if(process.env.HOME)e.HOME=process.env.HOME;if(process.env.USERPROFILE)e.USERPROFILE=process.env.USERPROFILE;if(process.env.DOCKER_CONTEXT&&/^[\w.-]+$/.test(process.env.DOCKER_CONTEXT))e.DOCKER_CONTEXT=process.env.DOCKER_CONTEXT;if(process.env.DOCKER_HOST){if(!/^(unix:\/\/\/|npipe:\/\/)/.test(process.env.DOCKER_HOST))throw Error('Use a local Docker socket, not a remote daemon');e.DOCKER_HOST=process.env.DOCKER_HOST;}return e;}
export function validateFiles(files){if(!Array.isArray(files)||files.length>320)throw new Error('Invalid file set');let total=0;const names=new Set();for(const f of files){if(typeof f.path!=='string'||!f.path||f.path.length>250||f.path.startsWith('/')||f.path.includes('\\')||f.path.split('/').some(x=>!x||x==='.'||x==='..')||/(^|\/)(\.git|\.env[^/]*|id_rsa|id_ed25519)(\/|$)/.test(f.path)||names.has(f.path)||typeof f.content!=='string'||f.content.length>100000)throw new Error('Unsafe source file');names.add(f.path);total+=f.content.length;}if(total>2500000)throw new Error('Source exceeds budget');}
export function dockerArgs(dir,name,image='node:22-alpine'){return ['run','--rm','--name',name,'--pull=never','--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=64','--memory=256m','--memory-swap=256m','--cpus=1','--user=65534:65534','--tmpfs=/tmp:rw,noexec,nosuid,size=16m','--mount',`type=bind,src=${dir},dst=/app,readonly`,'--workdir=/app',image,'node','--test','tests/omni-snapshot.test.mjs'];}
export async function cleanupContainer(name,{runCommand=null}={}){
 async function command(args){if(runCommand)return await runCommand(args);return await new Promise(resolveResult=>{let output='',done=false;const child=spawn('docker',args,{stdio:['ignore','pipe','pipe'],env:dockerEnvironment()});const finish=result=>{if(!done){done=true;clearTimeout(timer);resolveResult(result)}};const timer=setTimeout(()=>{child.kill('SIGKILL');finish({code:null,output:'cleanup timeout'})},8000);child.stdout.on('data',d=>{output=(output+d).slice(-4000)});child.stderr.on('data',d=>{output=(output+d).slice(-4000)});child.on('error',()=>finish({code:null,output:'Docker unavailable'}));child.on('close',code=>finish({code,output}));});}
 const removal=await command(['rm','-f',name]);const readback=await command(['inspect',name]);const absent=readback.code!==0&&/No such (object|container)/i.test(readback.output);return {verifiedAbsent:absent,removalCode:removal.code,readbackCode:readback.code};
}
export async function execute(job){
 validateFiles(job.files);const application=job.profile==='node-application';if(application)applicationRecipe(job.files);
 if(!Array.isArray(job.command)||job.command.join(' ')!==(application?applicationCommand.join(' '):'node --test tests/omni-snapshot.test.mjs'))throw Error('Command is outside worker allowlist');
 const image=process.env.OMNI_WORKER_IMAGE;
 if(!image||!/@sha256:[a-f0-9]{64}$/.test(image))throw Error('Configure OMNI_WORKER_IMAGE with a pinned SHA-256 image digest');
 if(!job.assignment||typeof job.assignment.id!=='string'||!Number.isFinite(job.assignment.expiresAt)||job.assignment.expiresAt<=Date.now()||!['candidateDigest','sourceDigest','testManifestDigest'].every(k=>/^[a-f0-9]{64}$/.test(job.assignment[k]||'')))throw Error('Invalid or expired execution assignment');
 const hash=async value=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');};
 if(await hash(job.files)!==job.assignment.candidateDigest||await hash(job.command)!==job.assignment.testManifestDigest)throw Error('Candidate artifact or test command does not match execution assignment');
 const finishTrilogy=await trilogyExecutionGuard(job),dir=await mkdtemp(join(tmpdir(),'omni-worker-')),name='omni-'+crypto.randomUUID();let result;
 try{
  for(const f of job.files){const target=resolve(dir,f.path);if(!target.startsWith(dir+sep))throw Error('Path escaped workspace');await mkdir(resolve(target,'..'),{recursive:true,mode:0o755});await writeFile(target,f.content,{mode:0o644});}
  const {chmod}=await import('node:fs/promises');await chmod(dir,0o755);
  result=await new Promise((resolveResult,reject)=>{
   const startedAt=new Date().toISOString();let outputBytes=0,settled=false,stopReason=null;const chunks=[];
   const child=spawn('docker',(application?applicationDockerArgs(dir,name,image):dockerArgs(dir,name,image)),{stdio:['ignore','pipe','pipe'],env:dockerEnvironment()});
   const finish=r=>{if(!settled){settled=true;clearTimeout(timer);resolveResult(r)}};
   const timer=setTimeout(()=>{stopReason='Execution timeout';child.kill('SIGKILL')},application?180000:15000);
   const capture=d=>{const room=Math.max(0,20000-outputBytes);if(room)chunks.push(d.subarray(0,room));outputBytes+=d.length;if(outputBytes>20000){stopReason='Output budget exceeded';child.kill('SIGKILL')}};
   child.stdout.on('data',capture);child.stderr.on('data',capture);
   child.on('error',e=>{clearTimeout(timer);reject(Error('Docker execution unavailable: '+e.code))});
   child.on('close',code=>{
    // A stopped process can end mid-character. Retain complete prefix bytes
    // without turning a known output/timeout limit into a false UTF-8 failure.
    let output;try{output=new TextDecoder('utf-8',{fatal:!!finishTrilogy}).decode(Buffer.concat(chunks),{stream:!!stopReason});}catch{output='Worker output was not valid UTF-8';stopReason=stopReason||output;}
    finish({passed:code===0&&!stopReason,exitCode:code,startedAt,endedAt:new Date().toISOString(),output:stopReason?boundedFailureOutput(output,stopReason):output});
   });
  });
 }finally{
  const cleanup=await cleanupContainer(name);await rm(dir,{recursive:true,force:true});
  if(!cleanup.verifiedAbsent)throw Error('Container cleanup is unverified; stop and inspect the worker host before reuse');
  if(result)result.cleanup=cleanup;
 }
 const proof=finishTrilogy?await finishTrilogy(result):{};
 return {...result,...proof,worker:'docker-isolated',imageDigest:image,profile:application?'node-application':'snapshot',assignment:job.assignment};
}
async function main(){const capacity=workerCapacity({requested:Number(process.env.OMNI_WORKER_SLOTS||1)});if(!capacity.slots)throw Error('Host has insufficient resources for an application worker');const site=process.env.OMNI_SITE_URL,workerToken=process.env.OMNI_WORKER_TOKEN,service=process.env.OMNI_SITE_SERVICE_TOKEN;if(!site?.startsWith('https://')||!workerToken||!service)throw new Error('Set OMNI_SITE_URL, OMNI_WORKER_TOKEN, and OMNI_SITE_SERVICE_TOKEN');const origin=new URL(site).origin;const headers={Authorization:'Bearer '+workerToken,'OAI-Sites-Authorization':'Bearer '+service,'Content-Type':'application/json'};async function api(path,body){const r=await fetch(origin+path,{headers,method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Site rejected worker');return d;}do{await api('/api/worker',{action:'recover'});const queue=await api('/api/worker');for(const audit of (queue.audits||[])){try{await api('/api/worker',{action:'auditStep',id:audit.id});}catch{console.error('Repository audit paused; progress retained for retry');}}for(const review of (queue.reviews||[]).slice(0,1)){try{await api('/api/worker',{action:'review',id:review.id,index:review.index});}catch{console.error('Specialist review blocked; owner capability update recorded');}}await boundedPool(queue.runnable.slice(0,capacity.slots),capacity.slots,async run=>{try{await api('/api/worker',{action:'tick',id:run.id});}catch{console.error('Repair generation blocked; other worker tasks continue');}});const receipts=await boundedPool(queue.jobs.slice(0,capacity.slots),capacity.slots,async item=>{const job=await api('/api/worker?id='+encodeURIComponent(item.id));const report=await execute(job);await api('/api/worker',{id:item.id,...report});console.log('Completed job '+item.id+': '+(report.passed?'passed':'failed'));return item.id;});for(const receipt of receipts)if(receipt?.status==='rejected')console.error('Job paused: '+receipt.reason.message);if(process.argv.includes('--once'))break;await new Promise(r=>setTimeout(r,10000));}while(true);}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
