import assert from 'node:assert/strict';
import {test} from 'node:test';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash,generateKeyPairSync,verify,randomUUID} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm,chmod,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,delimiter} from 'node:path';
import {trilogyExecutionGuard} from '../worker/trilogy-proof.mjs';
import {dockerEnvironment,dockerArgs,execute} from '../worker/runner.mjs';

// Real local Git objects, Ed25519 keys and Node subprocesses; these are fixtures,
// not independent production verifier or physical Docker-host qualification.
const hash=value=>createHash('sha256').update(value).digest('hex');
const jsonHash=value=>hash(JSON.stringify(value));
const canonical=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0)):v);
const before='export const answer = 1;\n',after='export const answer = 2;\n';
const testSource="import {test} from 'node:test';\nimport assert from 'node:assert/strict';\nimport {answer} from '../src/value.mjs';\ntest('the requested behavior returns two',()=>assert.equal(answer,2));\n";
const policyNames=['OMNI_TRILOGY_REPOSITORY_ID','OMNI_TRILOGY_REPOSITORY_ROOT','OMNI_TRILOGY_VERIFIER_ID','OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE','OMNI_TRILOGY_VERIFIER_PUBLIC_KEY','OMNI_TRILOGY_VERIFIER_REVOKED','OMNI_TRILOGY_OWNER_TOKEN','OMNI_TRILOGY_BRIDGE_TOKEN','OMNI_TRILOGY_READ_TOKEN','OMNI_WORKER_TOKEN','OMNI_SITE_SERVICE_TOKEN','OMNI_WORKER_IMAGE','OMNI_TRILOGY_VERIFIER_PRIVATE_KEY','DOCKER_HOST','DOCKER_CONTEXT','PATH'];
const gitEnv=()=>({PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',GIT_TERMINAL_PROMPT:'0',...(process.env.SystemRoot?{SystemRoot:process.env.SystemRoot}:{})});
const git=(root,...args)=>execFileSync('git',['-C',root,'-c','user.name=Local Trilogy Test','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false',...args],{encoding:'utf8',env:gitEnv(),stdio:['ignore','pipe','pipe']}).trim();
const signingPair=()=>generateKeyPairSync('ed25519',{privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});

function rebind(job){
  const request=job.trilogy.request;
  job.trilogy.requestSha256=hash(canonical(request));
  job.trilogy.identity={campaignId:'trilogy:'+hash(canonical({jobId:request.jobId,ownerId:request.ownerId,projectId:request.projectId,repositoryId:request.repositoryId})),taskId:request.jobId,agentId:'trilogy-code-monster'};
  job.assignment.trilogyBindingDigest=jsonHash(job.trilogy);job.assignment.candidateDigest=jsonHash(job.files);job.assignment.testManifestDigest=jsonHash(job.command);return job;
}
async function fixture(t){
  const parent=await mkdtemp(join(tmpdir(),'omni-trilogy-worker-')),root=join(parent,'repository'),keyPath=join(parent,'verifier.pem');
  const saved=Object.fromEntries(policyNames.map(name=>[name,process.env[name]]));
  t.after(async()=>{for(const [name,value] of Object.entries(saved)){if(value===undefined)delete process.env[name];else process.env[name]=value;}await rm(parent,{recursive:true,force:true});});
  await mkdir(join(root,'src'),{recursive:true});await mkdir(join(root,'tests'),{recursive:true});git(root,'init','-q');
  await writeFile(join(root,'src/value.mjs'),before);await writeFile(join(root,'tests/omni-snapshot.test.mjs'),testSource);git(root,'add','.');git(root,'commit','-qm','Baseline with the demonstrated behavior bug');
  const base=git(root,'rev-parse','HEAD');await writeFile(join(root,'src/value.mjs'),after);git(root,'add','.');git(root,'commit','-qm','Candidate fixes the requested behavior');
  const candidate=git(root,'rev-parse','HEAD'),candidateRef='refs/heads/mgr/candidates/'+randomUUID();git(root,'update-ref',candidateRef,candidate);git(root,'checkout','-q','--detach',base);
  const keys=signingPair();await writeFile(keyPath,keys.privateKey,{mode:0o600});
  Object.assign(process.env,{OMNI_TRILOGY_REPOSITORY_ID:'fixture/project',OMNI_TRILOGY_REPOSITORY_ROOT:root,OMNI_TRILOGY_VERIFIER_ID:'fixture-independent-runner',OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE:keyPath,OMNI_TRILOGY_VERIFIER_PUBLIC_KEY:keys.publicKey,OMNI_WORKER_IMAGE:'node@sha256:'+'a'.repeat(64)});delete process.env.OMNI_TRILOGY_VERIFIER_REVOKED;delete process.env.DOCKER_HOST;delete process.env.DOCKER_CONTEXT;
  const spec={version:1,commandId:'omni-snapshot-v1',executable:'node',args:['--test','tests/omni-snapshot.test.mjs'],cwd:'.'},command={...spec,commandSha256:jsonHash(spec)};
  const request={contract:'mgr.trilogy.job.v1',jobId:'job-fixture',projectId:'project-fixture',repositoryId:'fixture/project',ownerId:'fixture-owner',baseCommit:base,planSha256:'b'.repeat(64),candidateRef,commandId:command.commandId,commandSha256:command.commandSha256};
  const sourceFiles=[{path:'src/value.mjs',content:before},{path:'tests/omni-snapshot.test.mjs',content:testSource}],files=[{path:'src/value.mjs',content:after},{path:'tests/omni-snapshot.test.mjs',content:testSource}],expires=Date.now()+120000;
  const job={id:request.jobId,profile:'snapshot',command:['node',...spec.args],files,trilogy:{request,requestSha256:'',grantId:randomUUID(),grantExpiresAt:expires,stagedAt:new Date(Date.now()-5000).toISOString(),candidateCommit:candidate,sourceDigest:jsonHash(sourceFiles),files:[{path:'src/value.mjs',operation:'update',beforeHash:hash(before),afterHash:hash(after)}],command,identity:{}},assignment:{id:randomUUID(),sourceDigest:jsonHash(sourceFiles),candidateDigest:'',testManifestDigest:'',trilogyBindingDigest:'',expiresAt:expires}};
  rebind(job);
  return {parent,root,keyPath,keys,base,candidate,candidateRef,job,async snapshot(){const dir=join(parent,'executed-snapshot');await mkdir(dir);for(const f of job.files){const path=join(dir,f.path);await mkdir(dirname(path),{recursive:true});await writeFile(path,f.content);}return dir;}};
}
const observed=(extra={})=>({passed:true,exitCode:0,output:'Observed local test output\n',startedAt:new Date(Date.now()-1000).toISOString(),endedAt:new Date().toISOString(),cleanup:{verifiedAbsent:true},...extra});
const refusal=async job=>assert.rejects(()=>trilogyExecutionGuard(job));
async function simulatedDocker(f,mode='pass'){
  const bin=join(f.parent,'fake-docker-cli');await mkdir(bin);const trace=join(bin,'trace.jsonl');
  const script=`#!${process.execPath}
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const mode=${JSON.stringify(mode)},trace=${JSON.stringify(trace)},removed=path.join(__dirname,'removed');
const operation=process.argv[2];fs.appendFileSync(trace,JSON.stringify({operation,args:process.argv.slice(3),environmentNames:Object.keys(process.env).sort()})+'\\n');
if(operation==='run'){
 if(mode==='invalid-utf8'){process.stdout.write(Buffer.from([255]));process.exit(0);}
 if(mode==='empty'){process.exit(0);}
 const args=process.argv.slice(3),mount=args[args.indexOf('--mount')+1],match=mount?.match(/^type=bind,src=(.*),dst=\\/app,readonly$/);
 if(!match){process.stderr.write('No assigned snapshot mount');process.exit(1);}
 const run=cp.spawnSync(process.execPath,['--test','tests/omni-snapshot.test.mjs'],{cwd:match[1],env:process.env});
 if(run.stdout)process.stdout.write(run.stdout);if(run.stderr)process.stderr.write(run.stderr);process.exit(run.status??1);
}
if(operation==='rm'){fs.writeFileSync(removed,'removed');process.exit(mode==='cleanup-failed'?1:0);}
if(operation==='inspect'){
 if(mode==='cleanup-failed'){process.stderr.write('Cannot connect to daemon');process.exit(1);}
 if(fs.existsSync(removed)){process.stderr.write('No such object: simulated container');process.exit(1);}
 process.stdout.write('{}');process.exit(0);
}
process.exit(2);
`;
  await writeFile(join(bin,'docker'),script,{mode:0o755});process.env.PATH=bin+delimiter+process.env.PATH;
  return {trace,async calls(){try{return (await readFile(trace,'utf8')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));}catch(error){if(error.code==='ENOENT')return [];throw error;}}};
}

test('non-trilogy jobs receive no trilogy signature capability',async()=>assert.equal(await trilogyExecutionGuard({}),null));

test('a real failing baseline and passing candidate produce a valid exact-command Ed25519 receipt',async t=>{
  const f=await fixture(t),baseline=spawnSync(process.execPath,f.job.command.slice(1),{cwd:f.root,encoding:'utf8',env:gitEnv()});
  assert.equal(baseline.status,1);assert.match(baseline.stdout+baseline.stderr,/assert|not equal|1 !== 2/i);
  const finish=await trilogyExecutionGuard(f.job),cwd=await f.snapshot(),startedAt=new Date().toISOString();
  const run=spawnSync(process.execPath,f.job.command.slice(1),{cwd,encoding:'utf8',env:gitEnv()});assert.equal(run.status,0);assert.match(run.stdout,/pass 1/);
  const output=run.stdout+run.stderr,proof=await finish(observed({output,startedAt,endedAt:new Date().toISOString()}));
  const {signature,...body}=proof.trilogyReceipt;
  assert.equal(verify(null,Buffer.from(canonical(body)),f.keys.publicKey,Buffer.from(signature,'base64')),true);
  assert.equal(body.targetCommit,f.candidate);assert.equal(body.baseCommit,f.base);assert.equal(body.commandSha256,f.job.trilogy.command.commandSha256);assert.equal(body.outputSha256,hash(output));assert.equal(body.outputBytes,Buffer.byteLength(output));assert.equal(body.exitCode,0);assert.equal(proof.trilogySignerId,'fixture-independent-runner');
});

test('arbitrary candidate commit labels and noncandidate branch refs are refused',async t=>{
  const f=await fixture(t),label=structuredClone(f.job);label.trilogy.candidateCommit='a'.repeat(40);rebind(label);await refusal(label);
  const wrongRef=structuredClone(f.job);wrongRef.trilogy.request.candidateRef='refs/heads/main';rebind(wrongRef);await refusal(wrongRef);
});
test('candidate with additional unapproved committed changes is refused',async t=>{
  const f=await fixture(t);await writeFile(join(f.root,'src/value.mjs'),after);await writeFile(join(f.root,'extra.txt'),'unapproved');git(f.root,'add','.');git(f.root,'commit','-qm','Unapproved extra change');const candidate=git(f.root,'rev-parse','HEAD');git(f.root,'update-ref',f.candidateRef,candidate);git(f.root,'checkout','-q','--detach',f.base);f.job.trilogy.candidateCommit=candidate;rebind(f.job);await refusal(f.job);
});
test('an updated file cannot gain executable permission outside the approved byte-only plan',async t=>{
  const f=await fixture(t);await writeFile(join(f.root,'src/value.mjs'),after);await chmod(join(f.root,'src/value.mjs'),0o755);git(f.root,'add','src/value.mjs');git(f.root,'update-index','--chmod=+x','src/value.mjs');git(f.root,'commit','-qm','Unapproved executable bit');const candidate=git(f.root,'rev-parse','HEAD');git(f.root,'update-ref',f.candidateRef,candidate);git(f.root,'checkout','-q','--detach',f.base);f.job.trilogy.candidateCommit=candidate;rebind(f.job);
  assert.match(git(f.root,'ls-tree',candidate,'src/value.mjs'),/^100755/);await refusal(f.job);
});
test('created files must use the candidate writer regular-file mode',async t=>{
  const f=await fixture(t),path='src/new.mjs',content='export const added = true;\n';await writeFile(join(f.root,path),content);git(f.root,'add',path);git(f.root,'commit','-qm','Approved new regular file');const regular=git(f.root,'rev-parse','HEAD');git(f.root,'update-ref',f.candidateRef,regular);git(f.root,'checkout','-q','--detach',f.base);
  f.job.files=[{path:'src/value.mjs',content:before},{path:'tests/omni-snapshot.test.mjs',content:testSource},{path,content}];f.job.trilogy.files=[{path,operation:'create',beforeHash:null,afterHash:hash(content)}];f.job.trilogy.candidateCommit=regular;rebind(f.job);assert.equal(typeof await trilogyExecutionGuard(f.job),'function');
  await writeFile(join(f.root,path),content);await chmod(join(f.root,path),0o755);git(f.root,'add',path);git(f.root,'update-index','--chmod=+x',path);git(f.root,'commit','-qm','Unapproved executable new file');const executable=git(f.root,'rev-parse','HEAD');git(f.root,'update-ref',f.candidateRef,executable);git(f.root,'checkout','-q','--detach',f.base);f.job.trilogy.candidateCommit=executable;rebind(f.job);await refusal(f.job);
});
test('merge-parent candidates are refused even when their tree matches the proposal',async t=>{
  const f=await fixture(t),tree=git(f.root,'rev-parse',f.candidate+'^{tree}'),candidate=git(f.root,'commit-tree',tree,'-p',f.base,'-p',f.candidate,'-m','Merge candidate');git(f.root,'update-ref',f.candidateRef,candidate);f.job.trilogy.candidateCommit=candidate;rebind(f.job);await refusal(f.job);
});
test('tampered candidate contents and before/after hashes are refused',async t=>{
  const f=await fixture(t);for(const change of ['snapshot','beforeHash','afterHash']){const job=structuredClone(f.job);if(change==='snapshot')job.files[0].content='export const answer = 99;';else job.trilogy.files[0][change]='f'.repeat(64);rebind(job);await refusal(job);}
});
test('every changed plan file must be included in the executed snapshot',async t=>{
  const f=await fixture(t);f.job.files=f.job.files.filter(file=>file.path!=='src/value.mjs');rebind(f.job);await refusal(f.job);
});
test('source HEAD and candidate ref drift are rejected again before signing',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);git(f.root,'update-ref',f.candidateRef,f.base);await assert.rejects(()=>finish(observed()));git(f.root,'update-ref',f.candidateRef,f.candidate);git(f.root,'checkout','-q','--detach',f.candidate);await assert.rejects(()=>finish(observed()));
});
test('command changes are refused even after assignment hashes are recomputed',async t=>{
  const f=await fixture(t);for(const alter of [j=>{j.command=['node','--eval','process.exit(0)'];},j=>{j.trilogy.request.commandSha256='d'.repeat(64);},j=>{j.trilogy.command.args=['--test','other.mjs'];},j=>{j.profile='node-application';}]){const job=structuredClone(f.job);alter(job);rebind(job);await refusal(job);}
});
test('unmatched assignment and expired grant or assignment are refused',async t=>{
  const f=await fixture(t);for(const alter of [j=>{j.assignment.candidateDigest='a'.repeat(64);},j=>{j.assignment.trilogyBindingDigest='a'.repeat(64);},j=>{j.assignment.expiresAt=Date.now()-1;},j=>{j.trilogy.grantExpiresAt=Date.now()-1;rebind(j);}]){const job=structuredClone(f.job);alter(job);await refusal(job);}
});
test('owner identity cannot be the verifier and revoked verifier cannot start',async t=>{
  const f=await fixture(t);process.env.OMNI_TRILOGY_VERIFIER_ID=f.job.trilogy.request.ownerId;await refusal(f.job);process.env.OMNI_TRILOGY_VERIFIER_ID='fixture-independent-runner';process.env.OMNI_TRILOGY_VERIFIER_REVOKED='true';await refusal(f.job);
});
test('wrong repository configuration or public signing key is refused',async t=>{
  const f=await fixture(t);process.env.OMNI_TRILOGY_REPOSITORY_ID='other/project';await refusal(f.job);process.env.OMNI_TRILOGY_REPOSITORY_ID='fixture/project';process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY=signingPair().publicKey;await refusal(f.job);
});
test('verifier revocation and public-key rotation during execution stop signing',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);process.env.OMNI_TRILOGY_VERIFIER_REVOKED='true';await assert.rejects(()=>finish(observed()));delete process.env.OMNI_TRILOGY_VERIFIER_REVOKED;process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY=signingPair().publicKey;await assert.rejects(()=>finish(observed()));
});
test('same-path private-key replacement during execution stops signing',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);await writeFile(f.keyPath,signingPair().privateKey,{mode:0o600});await assert.rejects(()=>finish(observed()));
});
test('protected key permissions cannot become public during execution',async t=>{
  if(process.platform==='win32'){t.skip('POSIX private-mode fixture; Windows key ACL qualification remains separate');return;}
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);await chmod(f.keyPath,0o644);await assert.rejects(()=>finish(observed()));
});
test('key files in the candidate repository and symlink keys are refused',async t=>{
  const f=await fixture(t),inside=join(f.root,'verifier.pem');await writeFile(inside,f.keys.privateKey,{mode:0o600});process.env.OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE=inside;await refusal(f.job);
  if(process.platform==='win32'){t.diagnostic('Symlink creation not asserted on Windows without owner-approved symlink privileges');return;}
  const linked=join(f.parent,'linked.pem');await symlink(f.keyPath,linked);process.env.OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE=linked;await refusal(f.job);
});
test('relative, oversized and non-Ed25519 key files are refused',async t=>{
  const f=await fixture(t);process.env.OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE='relative.pem';await refusal(f.job);process.env.OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE=f.keyPath;
  await writeFile(f.keyPath,'x'.repeat(8193),{mode:0o600});await refusal(f.job);
  const rsa=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});await writeFile(f.keyPath,rsa.privateKey,{mode:0o600});process.env.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY=rsa.publicKey;await refusal(f.job);
});
test('a failed process receives no successful receipt',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);assert.deepEqual(await finish(observed({passed:false,exitCode:1})),{});
});
test('truthy values cannot replace the observed passed boolean',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);for(const passed of ['yes',1,{}])await assert.rejects(()=>finish(observed({passed})));
});
test('empty, oversized, non-string and malformed Unicode output cannot be signed',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);for(const output of ['', 'x'.repeat(20001),[111,107],new Uint8Array([111,107]),'\ud800'])await assert.rejects(()=>finish(observed({output})));
});
test('failed cleanup, wrong exit status and invalid observation times cannot be signed',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);for(const extra of [{cleanup:{verifiedAbsent:false}},{exitCode:1},{exitCode:null},{startedAt:'bad-date'},{startedAt:new Date(Date.now()-60000).toISOString()},{endedAt:new Date(Date.now()+60000).toISOString()},{endedAt:new Date(Date.now()-60000).toISOString()}])await assert.rejects(()=>finish(observed(extra)));
});
test('timestamps must be canonical ISO instants before a receipt is generated',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job);await assert.rejects(()=>finish(observed({startedAt:new Date(Date.now()-1000).toUTCString()})));
});
test('grant expiry during execution prevents signing even after successful process output',async t=>{
  const f=await fixture(t),finish=await trilogyExecutionGuard(f.job),now=Date.now;try{Date.now=()=>f.job.assignment.expiresAt+1;await assert.rejects(()=>finish(observed()));}finally{Date.now=now;}
});
test('Docker command environment contains no verifier keys or control credentials',async t=>{
  const f=await fixture(t);for(const name of ['OMNI_TRILOGY_OWNER_TOKEN','OMNI_TRILOGY_BRIDGE_TOKEN','OMNI_TRILOGY_READ_TOKEN','OMNI_WORKER_TOKEN','OMNI_SITE_SERVICE_TOKEN','OMNI_TRILOGY_VERIFIER_PRIVATE_KEY'])process.env[name]='sensitive-fixture-value-'+name;
  const env=dockerEnvironment();for(const name of policyNames.filter(name=>name.startsWith('OMNI_')))assert.equal(env[name],undefined,name);
  assert.ok(!JSON.stringify(env).includes('sensitive-fixture-value'));assert.ok(!JSON.stringify(env).includes(f.keyPath));assert.ok(!JSON.stringify(env).includes(f.keys.privateKey));
  const args=dockerArgs('/tmp/assigned-snapshot','fixture-container',process.env.OMNI_WORKER_IMAGE);assert.ok(!args.some(arg=>arg.includes(f.keyPath)||arg.includes(f.keys.privateKey)));assert.equal(args.includes('--network=none'),true);assert.equal(args.includes('--read-only'),true);
});

test('simulated Docker CLI: runner executes real Node tests and signs only after cleanup readback',async t=>{
  if(process.platform==='win32'){t.skip('POSIX CLI fixture; real Windows Docker remains separate');return;}
  const f=await fixture(t),cli=await simulatedDocker(f),report=await execute(f.job);
  assert.equal(report.passed,true);assert.equal(report.cleanup.verifiedAbsent,true);assert.equal(report.trilogyReceipt.targetCommit,f.candidate);
  assert.equal(report.trilogyReceipt.outputSha256,hash(report.output));assert.match(report.output,/pass 1/);
  const {signature,...body}=report.trilogyReceipt;assert.equal(verify(null,Buffer.from(canonical(body)),f.keys.publicKey,Buffer.from(signature,'base64')),true);
  const calls=await cli.calls();assert.deepEqual(calls.map(c=>c.operation),['run','rm','inspect']);assert.ok(calls.every(c=>!c.environmentNames.some(n=>n.startsWith('OMNI_'))));
  const mount=calls[0].args[calls[0].args.indexOf('--mount')+1];assert.ok(!mount.includes(f.keyPath));
  t.diagnostic('Docker CLI is simulated; Node tests and process sequencing are real. Physical isolation is not certified.');
});
test('simulated Docker CLI: invalid candidate binding prevents any Docker dispatch',async t=>{
  if(process.platform==='win32'){t.skip('POSIX CLI fixture');return;}
  const f=await fixture(t),cli=await simulatedDocker(f);f.job.trilogy.candidateCommit='c'.repeat(40);rebind(f.job);
  await assert.rejects(()=>execute(f.job));assert.deepEqual(await cli.calls(),[]);
});
test('simulated Docker CLI: unverified cleanup blocks a successful receipt',async t=>{
  if(process.platform==='win32'){t.skip('POSIX CLI fixture');return;}
  const f=await fixture(t),cli=await simulatedDocker(f,'cleanup-failed');await assert.rejects(()=>execute(f.job),/cleanup is unverified/);
  assert.deepEqual((await cli.calls()).map(c=>c.operation),['run','rm','inspect']);
});
test('simulated Docker CLI: non-UTF8 bytes fail execution and receive no receipt',async t=>{
  if(process.platform==='win32'){t.skip('POSIX CLI fixture');return;}
  const f=await fixture(t);await simulatedDocker(f,'invalid-utf8');const report=await execute(f.job);
  assert.equal(report.passed,false);assert.equal(report.trilogyReceipt,undefined);assert.match(report.output,/not valid UTF-8/);assert.equal(report.cleanup.verifiedAbsent,true);
});
test('simulated Docker CLI: empty output is not converted into a successful signed test',async t=>{
  if(process.platform==='win32'){t.skip('POSIX CLI fixture');return;}
  const f=await fixture(t);await simulatedDocker(f,'empty');await assert.rejects(()=>execute(f.job),/execution|output|successful/i);
});
