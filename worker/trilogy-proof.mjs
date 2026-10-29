import {createHash,createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {constants} from 'node:fs';
import {lstat,open,realpath} from 'node:fs/promises';
import {isAbsolute,relative,sep} from 'node:path';

const hex=/^[a-f0-9]{64}$/,sha=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/,id=/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;
const ref=/^refs\/heads\/mgr\/candidates\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash=value=>createHash('sha256').update(value).digest('hex');
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
function canonical(value){
 if(value===null||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='string'){if(value!==value.normalize('NFC')||/(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/.test(value))throw Error('Invalid trilogy text');return JSON.stringify(value);}
 if(typeof value==='number'){if(!Number.isFinite(value)||Object.is(value,-0))throw Error('Invalid trilogy number');return JSON.stringify(value);}
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null))return '{'+Object.keys(value).sort().map(key=>canonical(key)+':'+canonical(value[key])).join(',')+'}';
 throw Error('Invalid trilogy value');
}
const plain=value=>JSON.parse(canonical(value));
const safePath=path=>typeof path==='string'&&path.length>0&&path.length<251&&!/[\\:*?\[\]<>|\x00-\x1f]/.test(path)&&!path.startsWith('/')&&!path.split('/').some(p=>!p||p==='.'||p==='..'||p.toLowerCase()==='.git');
function git(root,...args){
 const env={PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',GIT_TERMINAL_PROMPT:'0',GIT_NO_REPLACE_OBJECTS:'1'};
 if(process.env.SystemRoot)env.SystemRoot=process.env.SystemRoot;
 try{return execFileSync('git',['--no-pager','-C',root,...args],{env,stdio:['ignore','pipe','pipe'],maxBuffer:3_000_000,timeout:5000});}catch{throw Error('Trilogy committed-source verification failed');}
}
const text=(root,...args)=>git(root,...args).toString('utf8').trim();
function checkGit(root,binding,files){
 const {request,candidateCommit}=binding;
 if(text(root,'rev-parse','--verify','HEAD^{commit}')!==request.baseCommit||text(root,'rev-parse','--verify',request.candidateRef)!==candidateCommit)throw Error('Trilogy source or candidate ref changed');
 if(text(root,'show','-s','--format=%P',candidateCommit)!==request.baseCommit)throw Error('Trilogy candidate must have exactly the approved base parent');
 const changed=git(root,'diff-tree','--no-commit-id','--name-only','-r','-z','--no-renames',request.baseCommit,candidateCommit).toString('utf8').split('\0').filter(Boolean).sort();
 if(canonical(changed)!==canonical(binding.files.map(f=>f.path).sort()))throw Error('Trilogy candidate contains unapproved changes');
 for(const file of binding.files){
  const after=git(root,'show',candidateCommit+':'+file.path);
  if(hash(after)!==file.afterHash)throw Error('Trilogy candidate bytes changed');
  const before=text(root,'ls-tree',request.baseCommit,'--',':(literal)'+file.path);
  if(file.operation==='create'?before!=='':!before||hash(git(root,'show',request.baseCommit+':'+file.path))!==file.beforeHash)throw Error('Trilogy base bytes changed');
  const mode=text(root,'ls-tree',candidateCommit,'--',':(literal)'+file.path).slice(0,6);
  if(file.operation==='create'?mode!=='100644':!['100644','100755'].includes(before.slice(0,6))||mode!==before.slice(0,6))throw Error('Trilogy candidate changed an unapproved Git file mode');
 }
 for(const file of files){
  if(!/^100(?:644|755) blob /.test(text(root,'ls-tree',candidateCommit,'--',':(literal)'+file.path)))throw Error('Trilogy snapshot must contain regular committed files');
  if(hash(git(root,'show',candidateCommit+':'+file.path))!==hash(Buffer.from(file.content,'utf8')))throw Error('Assigned snapshot differs from the candidate commit');
 }
}
async function privateKey(path){
 if(typeof path!=='string'||!isAbsolute(path))throw Error('Configure a protected absolute trilogy verifier key file');
 const before=await lstat(path);if(!before.isFile()||before.isSymbolicLink()||before.size>8192||process.platform!=='win32'&&(before.mode&0o077)!==0)throw Error('Trilogy verifier key file must be private and regular');
 const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW||0));
 try{const stat=await file.stat();if(!stat.isFile()||stat.dev!==before.dev||stat.ino!==before.ino||stat.size>8192)throw Error('Trilogy verifier key changed');const bytes=Buffer.alloc(8193);const {bytesRead}=await file.read(bytes,0,bytes.length,0);if(bytesRead>8192)throw Error('Trilogy verifier key exceeds limit');const key=createPrivateKey(bytes.subarray(0,bytesRead));if(key.asymmetricKeyType!=='ed25519')throw Error('Trilogy verifier must use Ed25519');return key;}finally{await file.close();}
}

/** Trusted runner composition boundary. Call before Docker execution and finish
 * only with the runner's observed exit/output/cleanup. No key enters the container.
 * It certifies the assigned snapshot's command, not whole-repository correctness. */
export async function trilogyExecutionGuard(job){
 if(!job.trilogy)return null;
 const binding=plain(job.trilogy),request=binding.request,assignment=plain(job.assignment),files=plain(job.files);
 if(!exact(binding,['request','requestSha256','grantId','grantExpiresAt','stagedAt','candidateCommit','sourceDigest','files','command','identity']))throw Error('Invalid trilogy worker binding');
 if(!exact(request,['contract','jobId','projectId','repositoryId','ownerId','baseCommit','planSha256','candidateRef','commandId','commandSha256'])||request.contract!=='mgr.trilogy.job.v1'||!['jobId','projectId','repositoryId','ownerId','commandId'].every(k=>typeof request[k]==='string'&&id.test(request[k]))||!sha.test(request.baseCommit)||!sha.test(binding.candidateCommit)||!hex.test(request.planSha256)||!ref.test(request.candidateRef)||job.id!==request.jobId)throw Error('Invalid trilogy worker request');
 const spec={version:1,commandId:'omni-snapshot-v1',executable:'node',args:['--test','tests/omni-snapshot.test.mjs'],cwd:'.'},command={...spec,commandSha256:hash(JSON.stringify(spec))};
 const campaignId='trilogy:'+hash(canonical({jobId:request.jobId,ownerId:request.ownerId,projectId:request.projectId,repositoryId:request.repositoryId}));
 if(job.profile!=='snapshot'||canonical(job.command)!==canonical(['node',...spec.args])||canonical(binding.command)!==canonical(command)||request.commandId!==command.commandId||request.commandSha256!==command.commandSha256||binding.requestSha256!==hash(canonical(request))||canonical(binding.identity)!==canonical({campaignId,taskId:request.jobId,agentId:'trilogy-code-monster'}))throw Error('Trilogy command or request binding changed');
 if(binding.request.repositoryId!==process.env.OMNI_TRILOGY_REPOSITORY_ID||!process.env.OMNI_TRILOGY_REPOSITORY_ROOT)throw Error('Configure the approved trilogy repository on this worker');
 if(assignment.trilogyBindingDigest!==hash(JSON.stringify(job.trilogy))||assignment.candidateDigest!==hash(JSON.stringify(job.files))||binding.sourceDigest!==assignment.sourceDigest||assignment.testManifestDigest!==hash(JSON.stringify(job.command)))throw Error('Trilogy worker assignment mismatch');
 if(!Number.isSafeInteger(binding.grantExpiresAt)||!Number.isSafeInteger(assignment.expiresAt)||Math.min(binding.grantExpiresAt,assignment.expiresAt)<=Date.now()||!Number.isFinite(Date.parse(binding.stagedAt))||Date.parse(binding.stagedAt)>Date.now())throw Error('Trilogy worker grant is not current');
 if(!Array.isArray(binding.files)||binding.files.length<1||binding.files.length>12||new Set(binding.files.map(f=>f?.path)).size!==binding.files.length||binding.files.some(f=>!exact(f,['path','operation','beforeHash','afterHash'])||!safePath(f.path)||!hex.test(f.afterHash)||!['create','update'].includes(f.operation)||(f.operation==='create'?f.beforeHash!==null:!hex.test(f.beforeHash)))||!Array.isArray(files)||files.length>320||new Set(files.map(f=>f?.path)).size!==files.length||files.some(f=>!exact(f,['path','content'])||!safePath(f.path)||typeof f.content!=='string')||binding.files.some(change=>!files.some(file=>file.path===change.path)))throw Error('Invalid trilogy candidate file binding');
 const signerId=process.env.OMNI_TRILOGY_VERIFIER_ID,keyPath=process.env.OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE;
 if(typeof signerId!=='string'||!id.test(signerId)||signerId===request.ownerId||process.env.OMNI_TRILOGY_VERIFIER_REVOKED==='true')throw Error('Configure a separate current trilogy verifier');
 const root=await realpath(process.env.OMNI_TRILOGY_REPOSITORY_ROOT);
 if(typeof keyPath!=='string'||!isAbsolute(keyPath))throw Error('Configure a protected absolute trilogy verifier key file');
 const within=relative(root,await realpath(keyPath));if(within===''||!isAbsolute(within)&&within!=='..'&&!within.startsWith('..'+sep))throw Error('Keep the trilogy verifier key outside the candidate repository');
 const key=await privateKey(keyPath),publicPem=createPublicKey(key).export({type:'spki',format:'pem'});
 if(!process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY||createPublicKey(process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY).export({type:'spki',format:'pem'})!==publicPem)throw Error('Trilogy signing key does not match the registered public key');
 checkGit(root,binding,files);
 return async execution=>{
  if(typeof execution?.passed!=='boolean')throw Error('Trilogy execution needs an observed Boolean result');
  if(!execution.passed)return {};
  if(typeof execution.output!=='string'||Buffer.from(execution.output,'utf8').toString('utf8')!==execution.output)throw Error('Trilogy execution needs exact UTF-8 text output');
  const output=Buffer.from(execution.output,'utf8'),start=Date.parse(execution.startedAt),end=Date.parse(execution.endedAt);
  if(execution.exitCode!==0||execution.cleanup?.verifiedAbsent!==true||output.length<1||output.length>20000||!Number.isFinite(start)||!Number.isFinite(end)||new Date(start).toISOString()!==execution.startedAt||new Date(end).toISOString()!==execution.endedAt||start<Date.parse(binding.stagedAt)||end<start||end>Date.now()||Date.now()>=Math.min(binding.grantExpiresAt,assignment.expiresAt))throw Error('Trilogy requires observed successful current execution and cleanup');
  if(signerId!==process.env.OMNI_TRILOGY_VERIFIER_ID||process.env.OMNI_TRILOGY_VERIFIER_REVOKED==='true'||keyPath!==process.env.OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE||process.env.OMNI_TRILOGY_REPOSITORY_ID!==request.repositoryId||await realpath(process.env.OMNI_TRILOGY_REPOSITORY_ROOT)!==root||createPublicKey(process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY).export({type:'spki',format:'pem'})!==publicPem)throw Error('Trilogy verifier or repository policy changed');
  const currentKey=await privateKey(keyPath);if(createPublicKey(currentKey).export({type:'spki',format:'pem'})!==publicPem)throw Error('Trilogy private signing key changed during execution');
  if(process.env.OMNI_TRILOGY_VERIFIER_REVOKED==='true'||createPublicKey(process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY).export({type:'spki',format:'pem'})!==publicPem)throw Error('Trilogy verifier changed during key validation');
  checkGit(root,binding,files);
  const body={version:2,campaignId,taskId:request.jobId,baseCommit:request.baseCommit,targetCommit:binding.candidateCommit,commandId:command.commandId,commandSha256:command.commandSha256,exitCode:0,outputSha256:hash(output),outputBytes:output.length,startedAt:execution.startedAt,endedAt:execution.endedAt};
  return {trilogySignerId:signerId,trilogyReceipt:{...body,signature:sign(null,Buffer.from(canonical(body)),key).toString('base64')}};
 };
}
