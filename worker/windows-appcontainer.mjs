import {readFile,writeFile,mkdir,copyFile,lstat,readdir,rm,stat} from 'node:fs/promises';
import {resolve,join,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {validateFiles} from './runner.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const digest=value=>hash(JSON.stringify(value));
const hex=/^[a-f0-9]{64}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const snapshotCommand=['node','--preserve-symlinks','--preserve-symlinks-main','--test','--test-isolation=none','tests/omni-snapshot.test.mjs'];
const launcherPaths=['windows-appcontainer.mjs','windows/AppContainerHost.cs','windows/run-appcontainer.ps1','runner.mjs'];
export async function nativeLauncherDigest(){
 const materials=await Promise.all(launcherPaths.map(async path=>({path,sha256:hash(await readFile(join(here,path)))})));
 return digest(materials);
}
export async function nativeRuntimeDigest(){return hash(await readFile(process.execPath));}
export async function loadNativePolicy(){
 if(process.platform!=='win32'||!process.env.OMNI_NATIVE_WORKER_POLICY)throw Error('Configure an owner-qualified Windows native worker policy');
 const policy=JSON.parse(await readFile(process.env.OMNI_NATIVE_WORKER_POLICY,'utf8'));
 if(policy.version!==1||policy.enabled!==true||typeof policy.hostId!=='string'||!uuid.test(policy.hostId)||!['launcherSha256','runtimeSha256','qualificationDigest'].every(key=>hex.test(policy[key]||'')))throw Error('Invalid Windows worker policy');
 if(policy.scope!=='approved-mgr-snapshot'||!['allowedSourceDigests','allowedCandidateDigests','allowedTestManifestDigests'].every(key=>Array.isArray(policy[key])&&policy[key].length>0&&policy[key].length<=32&&new Set(policy[key]).size===policy[key].length&&policy[key].every(value=>typeof value==='string'&&hex.test(value))))throw Error('Invalid approved native snapshot scope');
 if(policy.launcherSha256!==await nativeLauncherDigest()||policy.runtimeSha256!==await nativeRuntimeDigest())throw Error('Windows worker implementation changed; rerun native qualification');
 return policy;
}
async function noReparse(path){
 const resolved=resolve(path);let current=resolved;
 for(;;){const info=await lstat(current);if(info.isSymbolicLink())throw Error('Native path contains a reparse link');const parent=dirname(current);if(parent===current)break;current=parent;}
 async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const child=join(directory,entry.name),info=await lstat(child);if(info.isSymbolicLink())throw Error('Native output reparse link denied');if(info.isDirectory())await walk(child);}}
 await walk(resolved);
}
function pwshPath(){return process.env.OMNI_PWSH_PATH||join(process.env.LOCALAPPDATA||'','../..','.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe');}
async function host(manifestPath,{signal,recover=false}={}){
 const args=['-NoProfile','-NonInteractive','-File',join(here,'windows/run-appcontainer.ps1'),'-ManifestPath',manifestPath,...(recover?['-Recover']:[])];
 return new Promise((resolveResult,reject)=>{
  const child=spawn(pwshPath(),args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='',stopped=null,settled=false;
  const stop=reason=>{stopped=reason;child.kill();};const cancel=()=>stop('cancelled');
  const timer=setTimeout(()=>stop('native-host-timeout'),90000);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  child.stdout.on('data',bytes=>{if(Buffer.byteLength(output)+bytes.length>65536){stop('native-host-output-limit');return;}output+=bytes.toString();});child.stderr.on('data',()=>{});
  child.once('error',()=>{if(!settled){settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);reject(Error('Windows native host is unavailable'));}});
  child.once('close',code=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);let value;try{value=JSON.parse(output);}catch{}resolveResult({code,value,stopped});});
 });
}
// Low-level qualification API: its arguments are trusted harness inputs, never a job command.
// The public executeNative path below uses one fixed snapshot test recipe.
export async function runNativeAttempt({files,arguments:args,profileName='omni-'+randomUUID(),timeoutMs=15000,outputLimit=20000,base=process.env.OMNI_NATIVE_WORKER_ROOT||join(tmpdir(),'omnidev-native-worker'),signal,probeBeforeResumeMs=0}){
 if(process.platform!=='win32')throw Error('Windows AppContainer requires Windows');validateFiles(files);
 base=resolve(base);await mkdir(base,{recursive:true,mode:0o700});await noReparse(base);
 const root=join(base,'omni-native-'+randomUUID()),nonce=randomUUID();await mkdir(root,{mode:0o700});
 const manifestPath=root+'.manifest.json',journalPath=root+'.host-state.json';let launch,recovered=null,workspaceAbsent=false;
 try{
  for(const directory of ['runtime','source','scratch'])await mkdir(join(root,directory));
  await copyFile(process.execPath,join(root,'runtime/node.exe'));const runtimeSha256=hash(await readFile(join(root,'runtime/node.exe')));
  await writeFile(join(root,'.omni-owned.json'),JSON.stringify({nonce,profileName}),{flag:'wx',mode:0o600});
  for(const file of files){const destination=resolve(root,'source',file.path);if(!destination.startsWith(join(root,'source')+sep))throw Error('Native source path escaped');await mkdir(dirname(destination),{recursive:true});await writeFile(destination,file.content,{flag:'wx'});}
  await writeFile(manifestPath,JSON.stringify({format:'omnidev-native-attempt/v1',root,nonce,profileName,arguments:args,timeoutMs,outputLimit,probeBeforeResumeMs}),{flag:'wx',mode:0o600});
  launch=await host(manifestPath,{signal});
  if(!launch.value?.CleanupVerified){for(let attempt=0;attempt<20;attempt++){recovered=await host(manifestPath,{recover:true});if(recovered.value?.CleanupVerified)break;await new Promise(resolve=>setTimeout(resolve,50));}}
  const native=launch.value;
  if(!native?.CleanupVerified&&!recovered?.value?.CleanupVerified)throw Error('Native profile/process cleanup is unverified; worker host quarantined');
  await noReparse(root);await rm(root,{recursive:true,force:true});workspaceAbsent=await stat(root).then(()=>false,error=>error.code==='ENOENT');
  if(!workspaceAbsent)throw Error('Native workspace cleanup is unverified; worker host quarantined');
  await rm(manifestPath,{force:true});await rm(journalPath,{force:true});
  return {native,hostStopped:launch.stopped,runtimeSha256,cleanup:{verifiedAbsent:true,activeProcessesAfter:native?.ActiveProcessesAfter??0,profileDeletionHResult:native?.ProfileDeletionHResult??recovered.value.ProfileDeletionHResult,workspaceAbsent},profileName};
 }catch(error){
  await writeFile(join(base,'QUARANTINED.json'),JSON.stringify({at:new Date().toISOString(),attempt:root,reason:'Native attempt did not establish complete cleanup',profileName}),{mode:0o600});
  throw error;
 }
}
export async function executeNative(job,{signal}={}){
 const policy=await loadNativePolicy(),base=resolve(process.env.OMNI_NATIVE_WORKER_ROOT||join(tmpdir(),'omnidev-native-worker'));
 if(await stat(join(base,'QUARANTINED.json')).then(()=>true,error=>error.code!=='ENOENT'))throw Error('Native worker host is quarantined');
 const assignment=job.assignment;
 if(job.profile&&job.profile!=='snapshot'||!Array.isArray(job.command)||JSON.stringify(job.command)!==JSON.stringify(snapshotCommand))throw Error('Native worker supports only the fixed snapshot profile');
 if(!assignment||!uuid.test(assignment.id||'')||assignment.profileName!=='omni-'+assignment.id||assignment.workerKind!=='windows-appcontainer'||!Number.isFinite(assignment.expiresAt)||assignment.expiresAt<=Date.now())throw Error('Invalid native execution assignment');
 for(const key of ['hostId','launcherSha256','runtimeSha256','qualificationDigest'])if(assignment[key]!==policy[key])throw Error('Native host qualification mismatch');
 validateFiles(job.files);
 if(!policy.allowedSourceDigests.includes(assignment.sourceDigest)||!policy.allowedCandidateDigests.includes(assignment.candidateDigest)||!policy.allowedTestManifestDigests.includes(assignment.testManifestDigest))throw Error('Native assignment outside owner-approved snapshot scope');
 if(digest(job.files)!==assignment.candidateDigest||digest(job.command)!==assignment.testManifestDigest||!hex.test(assignment.sourceDigest||''))throw Error('Native assignment artifact mismatch');
 const attempt=await runNativeAttempt({files:job.files,arguments:job.command.slice(1),profileName:assignment.profileName,base,signal});
 if(attempt.runtimeSha256!==policy.runtimeSha256||await nativeLauncherDigest()!==policy.launcherSha256)throw Error('Native implementation changed during execution');
 const value=attempt.native;
 return {worker:'windows-appcontainer',passed:!!value&&value.ExitCode===0&&!value.StopReason&&!attempt.hostStopped,output:value?.Output||('Native execution '+(attempt.hostStopped||'failed')),assignment,runtimeSha256:policy.runtimeSha256,launcherSha256:policy.launcherSha256,qualificationDigest:policy.qualificationDigest,native:{profileName:assignment.profileName,packageSid:value?.PackageSid,tokenIsAppContainer:value?.TokenIsAppContainer===1,capabilityCount:value?.CapabilityCount,jobAssignedAtCreation:value?.JobAssignedAtCreation===true},cleanup:attempt.cleanup};
}
