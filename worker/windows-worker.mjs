/** One explicit queue cycle. Durable receipts reconcile without execution.
 * An admitted-but-unresolved execution journal stops for review; no service is installed. */
import {readFile,writeFile,mkdir,lstat,readdir,rename,unlink,open} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {executeNative,loadNativePolicy} from './windows-appcontainer.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
async function noLinks(path){for(let p=resolve(path);;p=dirname(p)){if((await lstat(p)).isSymbolicLink())throw Error('Receipt path contains a link');if(dirname(p)===p)break;}}
export async function runOnce(configPath){
 const config=JSON.parse(await readFile(configPath,'utf8')),url=new URL(config.siteUrl);
 if(url.origin!==config.siteUrl||url.username||url.password||!(url.protocol==='https:'||url.protocol==='http:'&&url.hostname==='127.0.0.1')||typeof config.nativeWorkerToken!=='string'||config.nativeWorkerToken.length<32||!config.nativePolicyPath||!config.nativeReceiptRoot)throw Error('Explicit origin, native policy, private token and receipt root required');
 process.env.OMNI_NATIVE_WORKER_POLICY=resolve(config.nativePolicyPath);if(config.nativeWorkerRoot)process.env.OMNI_NATIVE_WORKER_ROOT=resolve(config.nativeWorkerRoot);
 const policy=await loadNativePolicy(),root=resolve(config.nativeReceiptRoot);await mkdir(root,{recursive:true,mode:0o700});await noLinks(root);
 const identity={siteOrigin:url.origin,hostId:policy.hostId,tenantId:config.tenantId,actorId:config.actorId};if(!identity.tenantId||!identity.actorId)throw Error('Fixed owner identity required');
 const lockPath=join(root,'poller.lock');let lock;
 try{lock=await open(lockPath,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,...identity}));}catch{throw Error('Worker receipt store is locked; inspect the prior process before reuse');}
 async function boundedJson(response){const limit=3*1024*1024,reader=response.body?.getReader();if(!reader)throw Error('Worker response body missing');const chunks=[];let total=0;try{while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit)throw Error('Worker response exceeds byte limit');chunks.push(value);}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks,total)));}catch(error){try{await reader.cancel();}catch{}throw error;}finally{reader.releaseLock();}}
 async function receiptFile(path){const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||info.size>65536)throw Error('Receipt file size or type denied');const raw=await readFile(path);if(raw.byteLength>65536)throw Error('Receipt file grew beyond limit');return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}
 async function api(path,body){const response=await fetch(url.origin+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+config.nativeWorkerToken,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(20000)});const value=await boundedJson(response);return {status:response.status,value};}
 async function persist(path,body){const temp=path+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify({body,sha256:hash(body)},null,2)+'\n',{flag:'wx',mode:0o600});await rename(temp,path);}
 const confirmed=(job,body)=>{const stored=job.result?.externalTests,a=body.report.assignment,b=stored?.assignment;return !!b&&['id','sourceDigest','candidateDigest','testManifestDigest','qualificationDigest','hostId','launcherSha256','runtimeSha256','profile','profileName','workerKind','expiresAt'].every(k=>a[k]===b[k])&&stored.passed===body.report.passed&&stored.output===body.report.output&&stored.nativeReceipt?.cleanup?.verifiedAbsent===true&&stored.nativeReceipt?.native?.profileName===body.report.native?.profileName&&stored.nativeReceipt?.native?.packageSid===body.report.native?.packageSid&&['activeProcessesAfter','profileDeletionHResult','workspaceAbsent'].every(k=>stored.nativeReceipt.cleanup[k]===body.report.cleanup[k]);};
 async function deliver(path,body){
  if(JSON.stringify(body.identity)!==JSON.stringify(identity)||!idPattern.test(body.report?.assignment?.id||'')||!path.endsWith('pending-'+body.report.assignment.id+'.json')||body.jobId!==body.report?.id)throw Error('Pending receipt identity differs; explicit reconciliation required');
  let view=await api('/api/worker?kind=windows-appcontainer&status=1&id='+encodeURIComponent(body.jobId));if(view.status!==200)throw Error('Receipt status unresolved; retained without redispatch');
  if(!confirmed(view.value,body)){
   if(view.value.result?.externalTests||view.value.result?.workerAssignment?.id!==body.report.assignment.id)throw Error('Pending execution conflicts with current job; retained without redispatch');
   try{await api('/api/worker',body.report);}catch{}
   view=await api('/api/worker?kind=windows-appcontainer&status=1&id='+encodeURIComponent(body.jobId));if(view.status!==200||!confirmed(view.value,body))throw Error('Report acknowledgment unresolved; retained without redispatch');
  }
  await rename(path,path.replace('pending-','delivered-'));return body.jobId;
 }
 try{
  const delivered=[];
  for(const name of (await readdir(root)).sort()){
   if(!/^pending-[a-f0-9-]{36}\.json$/.test(name))continue;const path=join(root,name);if((await lstat(path)).isSymbolicLink())throw Error('Pending receipt link denied');const item=await receiptFile(path);if(item.sha256!==hash(item.body))throw Error('Pending receipt hash changed; stopped');delivered.push(await deliver(path,item.body));
  }
  for(const name of await readdir(root)){if(!/^active-[a-f0-9-]{36}\.json$/.test(name))continue;const completed=join(root,name.replace('active-','delivered-'));try{const active=await receiptFile(join(root,name)),receipt=await receiptFile(completed);if(active.sha256!==hash(active.body)||receipt.sha256!==hash(receipt.body)||JSON.stringify(receipt.body.identity)!==JSON.stringify(identity)||JSON.stringify(active.body.identity)!==JSON.stringify(identity)||active.body.jobId!==receipt.body.jobId||JSON.stringify(active.body.assignment)!==JSON.stringify(receipt.body.report.assignment)||name!=='active-'+active.body.assignment.id+'.json')throw Error('invalid');await unlink(join(root,name));}catch{throw Error('Prior execution outcome requires reconciliation; no redispatch');}}
  const queue=await api('/api/worker?kind=windows-appcontainer');if(queue.status!==200)throw Error('Native queue is unavailable');const item=queue.value.jobs?.[0];if(!item)return {claimed:0,delivered,scope:'One explicit native snapshot queue cycle'};
  const claim=await api('/api/worker?kind=windows-appcontainer&id='+encodeURIComponent(item.id));if(claim.status!==200)throw Error('Native assignment was not admitted');
  const activePath=join(root,'active-'+claim.value.assignment.id+'.json');await persist(activePath,{version:1,identity,jobId:item.id,assignment:claim.value.assignment,state:'execution-admitted-outcome-unknown'});
  const report=await executeNative(claim.value);const body={version:1,identity,jobId:item.id,report:{id:item.id,...report}},path=join(root,'pending-'+report.assignment.id+'.json');await persist(path,body);delivered.push(await deliver(path,body));await unlink(activePath);
  return {claimed:1,jobId:item.id,passed:report.passed,delivered,scope:'Actual qualified Windows AppContainer; one approved snapshot, no daemon'};
 }finally{await lock.close();await unlink(lockPath);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){if(process.argv[2]!=='--config'||!process.argv[3]||process.argv[4]!=='--once'||process.argv.length!==5)throw Error('Usage: node worker/windows-worker.mjs --config <private-config> --once');runOnce(process.argv[3]).then(value=>console.log(JSON.stringify(value,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});}
