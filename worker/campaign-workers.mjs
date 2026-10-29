import {readFile,writeFile,rename,mkdir,open} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
const idOk=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(s);
const sha=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));
/** Single coordinator per state file; at most ten local subprocess slots. Not AI model agents or a distributed lock. */
export class CampaignWorkers{
 constructor({file,profiles,maxWorkers=10,maxAttempts=3,spawnImpl=spawn,clock=()=>Date.now()}){
  if(!file||!profiles||!Number.isInteger(maxWorkers)||maxWorkers<1||maxWorkers>10||!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10)throw new TypeError('bad worker configuration');
  this.file=resolve(file);this.profiles=profiles;this.maxWorkers=maxWorkers;this.maxAttempts=maxAttempts;this.spawnImpl=spawnImpl;this.clock=clock;this.state=null;this.active=new Map();this.owner=randomUUID();this.writeQueue=Promise.resolve();
 }
 async init(){
  await mkdir(dirname(this.file),{recursive:true});
  try{this.state=JSON.parse(await readFile(this.file,'utf8'));}
  catch(e){if(e.code!=='ENOENT')throw e;this.state={version:1,jobs:{},events:[]};await this.persist();}
  if(this.state.version!==1||typeof this.state.jobs!=='object'||!Array.isArray(this.state.events))throw new Error('unrecognized worker state');
  for(const job of Object.values(this.state.jobs))if(job.status==='running'){job.status='queued';job.lastReason='recovered-unfinished-worker';this.event('job.recovered',job.id);}
  await this.persist();return this;
 }
 event(kind,id,detail={}){this.state.events.push({seq:this.state.events.length,kind,id,detail,at:this.clock()});}
 async persist(){const bytes=JSON.stringify(this.state,null,2)+'\n';const write=async()=>{const tmp=`${this.file}.${this.owner}.tmp`;const h=await open(tmp,'w',0o600);try{await h.writeFile(bytes);await h.sync();}finally{await h.close();}await rename(tmp,this.file);};this.writeQueue=this.writeQueue.then(write);return this.writeQueue;}
 async add({id,profile,dependsOn=[],args=[]}){
  if(!idOk(id)||!idOk(profile)||!this.profiles[profile]||!Array.isArray(dependsOn)||!dependsOn.every(idOk)||!Array.isArray(args)||args.length>16||args.some(a=>typeof a!=='string'||a.length>1024||a.includes('\0')))throw new TypeError('invalid job');
  const intent={id,profile,dependsOn:[...new Set(dependsOn)],args},current=this.state.jobs[id];
  if(current){if(current.intentHash!==sha(intent))throw new Error('job-id-conflict');return clone(current);}
  if(dependsOn.includes(id))throw new Error('self dependency');
  this.state.jobs[id]={...intent,intentHash:sha(intent),status:'queued',attempts:0,lastReason:null};this.event('job.queued',id);await this.persist();return clone(this.state.jobs[id]);
 }
 async tick(){
  const jobs=this.state.jobs;
  for(const j of Object.values(jobs))if(j.status==='queued'&&j.dependsOn.some(d=>jobs[d]&&['blocked','quarantined'].includes(jobs[d].status))){j.status='blocked';j.lastReason='dependency-blocked';this.event('job.blocked',j.id);}
  const capacity=this.maxWorkers-this.active.size;
  const ready=Object.values(jobs).filter(j=>j.status==='queued'&&j.dependsOn.every(d=>jobs[d]?.status==='verified')).sort((a,b)=>a.id.localeCompare(b.id)).slice(0,Math.max(0,capacity));
  for(const j of ready){j.status='running';j.attempts++;j.workerLease=this.owner;this.event('job.started',j.id,{attempt:j.attempts});}
  await this.persist();
  for(const j of ready){const p=this.profiles[j.profile];const promise=this.runOne(j,p).finally(()=>this.active.delete(j.id));this.active.set(j.id,promise);}
  return {started:ready.map(x=>x.id),active:this.active.size};
 }
 async runOne(j,profile){
  let result;try{result=await this.execute(profile,j.args);}catch(e){result={ok:false,reason:e.code??'worker-exception'};}
  if(j.workerLease!==this.owner||j.status!=='running')return;
  if(result.ok){j.status='verified';j.lastReason=null;this.event('job.verified',j.id,{exitCode:0,outputHash:result.outputHash});}
  else{j.status=j.attempts>=this.maxAttempts?'quarantined':'queued';j.lastReason=result.reason;this.event(j.status==='quarantined'?'job.quarantined':'job.retry',j.id,{reason:result.reason,attempt:j.attempts});}
  delete j.workerLease;await this.persist();
 }
 async execute(profile,args){
  if(!profile||typeof profile.executable!=='string'||!Array.isArray(profile.fixedArgs)||!profile.cwd||profile.timeoutMs<100||profile.timeoutMs>600000||!Array.isArray(profile.allowedExtraArgs)||args.some(x=>!profile.allowedExtraArgs.includes(x)))return {ok:false,reason:'unapproved-command'};
  return new Promise(resolveResult=>{
   const child=this.spawnImpl(profile.executable,[...profile.fixedArgs,...args],{cwd:profile.cwd,env:{PATH:process.env.PATH??'',HOME:process.env.HOME??'',CI:'1'},shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
   let output=Buffer.alloc(0),over=false,finished=false,timer;
   const done=r=>{if(finished)return;finished=true;clearTimeout(timer);resolveResult(r);};
   const capture=buf=>{if(over)return;output=Buffer.concat([output,buf]);if(output.length>1_048_576){over=true;child.kill('SIGKILL');}};
   child.stdout?.on('data',capture);child.stderr?.on('data',capture);
   child.on('error',e=>done({ok:false,reason:e.code??'spawn-error'}));
   child.on('exit',(code,signal)=>done({ok:code===0&&!over&&!signal,reason:over?'output-limit':signal?'terminated':`exit-${code}`,outputHash:createHash('sha256').update(output).digest('hex')}));
   timer=setTimeout(()=>{child.kill('SIGKILL');done({ok:false,reason:'timeout'});},profile.timeoutMs);
  });
 }
 async runUntilSettled({maxTicks=1000}={}){
  for(let i=0;i<maxTicks;i++){
   const {started}=await this.tick();if(this.active.size)await Promise.allSettled([...this.active.values()]);
   if(started.length===0&&this.active.size===0){
    const queued=Object.values(this.state.jobs).filter(j=>j.status==='queued');
    if(queued.length){for(const j of queued){j.status='blocked';j.lastReason='unresolved-dependency-or-cycle';this.event('job.blocked',j.id);}await this.persist();}
    break;
   }
  }
  return this.summary();
 }
 summary(){const jobs=Object.values(this.state.jobs),counts={};for(const j of jobs)counts[j.status]=(counts[j.status]??0)+1;return {total:jobs.length,counts,complete:jobs.every(j=>j.status==='verified'),unresolved:jobs.filter(j=>j.status!=='verified').map(j=>({id:j.id,status:j.status,reason:j.lastReason}))};}
}