import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,delimiter} from 'node:path';
import {fixture,closeStore,jobs,resultOf,hash,canon} from './trilogy-fixture.mjs';
import {execute} from '../worker/runner.mjs';

after(closeStore);
// Actual worker subprocess handling and actual SQLite report admission.
// The Docker CLI is explicitly simulated; no physical isolation is claimed.
async function simulation(t,output,{holdOpen=false,exitCode=0}={}){
 const f=await fixture(),parent=await mkdtemp(join(tmpdir(),'omni-failure-output-')),bin=join(parent,'bin');
 const names=['PATH','OMNI_WORKER_IMAGE','DOCKER_HOST','DOCKER_CONTEXT','OMNI_TRILOGY_REPOSITORY_ID','OMNI_TRILOGY_REPOSITORY_ROOT','OMNI_TRILOGY_VERIFIER_ID','OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE','OMNI_TRILOGY_VERIFIER_PUBLIC_KEY','OMNI_TRILOGY_VERIFIER_REVOKED'];
 const saved=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 t.after(async()=>{for(const [name,value] of Object.entries(saved)){if(value===undefined)delete process.env[name];else process.env[name]=value;}await rm(parent,{recursive:true,force:true});});
 await mkdir(bin);const trace=join(parent,'trace.jsonl');
 const script=`#!${process.execPath}
const fs=require('node:fs'),path=require('node:path');
const operation=process.argv[2],removed=path.join(__dirname,'removed');
fs.appendFileSync(${JSON.stringify(trace)},JSON.stringify({operation})+'\\n');
if(operation==='run'){
 process.stdout.write(Buffer.from(${JSON.stringify(Buffer.from(output).toString('base64'))},'base64'));
 process.exitCode=${exitCode};
 if(${holdOpen})setInterval(()=>{},1000);
}else if(operation==='rm'){fs.writeFileSync(removed,'removed');}
else if(operation==='inspect'){
 if(fs.existsSync(removed)){process.stderr.write('No such object: simulated container');process.exitCode=1;}
 else process.stdout.write('{}');
}else process.exitCode=2;
`;
 await writeFile(join(bin,'docker'),script,{mode:0o755});
 process.env.PATH=bin+delimiter+process.env.PATH;
 process.env.OMNI_WORKER_IMAGE='node@sha256:'+'a'.repeat(64);
 delete process.env.DOCKER_HOST;delete process.env.DOCKER_CONTEXT;
 const assigned=await jobs.workerJob(f.job.id);
 return {...f,parent,assigned,async calls(){return (await readFile(trace,'utf8')).trim().split('\n').map(line=>JSON.parse(line).operation);}};
}
async function withRealSigningGuard(f){
 const root=join(f.parent,'repository'),keyPath=join(f.parent,'verifier.pem');await mkdir(root);
 const git=(...args)=>execFileSync('git',['-C',root,'-c','user.name=Output Test','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0'}}).trim();
 const files=async entries=>{for(const file of entries){const path=join(root,file.path);await mkdir(dirname(path),{recursive:true});await writeFile(path,file.content);}};
 git('init','-q');await files(f.job.payload.baseline);git('add','.');git('commit','-qm','Output fixture base');const baseCommit=git('rev-parse','HEAD');
 await files(f.assigned.files);git('add','.');git('commit','-qm','Output fixture candidate');const candidateCommit=git('rev-parse','HEAD'),candidateRef='refs/heads/mgr/candidates/'+randomUUID();git('update-ref',candidateRef,candidateCommit);git('checkout','-q','--detach',baseCommit);
 await writeFile(keyPath,f.keys.privateKey.export({type:'pkcs8',format:'pem'}),{mode:0o600});
 Object.assign(process.env,{OMNI_TRILOGY_REPOSITORY_ID:f.repositoryId,OMNI_TRILOGY_REPOSITORY_ROOT:root,OMNI_TRILOGY_VERIFIER_ID:'fixture-output-verifier',OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE:keyPath,OMNI_TRILOGY_VERIFIER_PUBLIC_KEY:f.keys.publicKey.export({type:'spki',format:'pem'})});delete process.env.OMNI_TRILOGY_VERIFIER_REVOKED;
 const spec={version:1,commandId:'omni-snapshot-v1',executable:'node',args:['--test','tests/omni-snapshot.test.mjs'],cwd:'.'},command={...spec,commandSha256:hash(JSON.stringify(spec))};
 const request={contract:'mgr.trilogy.job.v1',jobId:f.job.id,projectId:f.project.id,repositoryId:f.repositoryId,ownerId:f.ownerId,baseCommit,planSha256:'b'.repeat(64),candidateRef,commandId:spec.commandId,commandSha256:command.commandSha256};
 const trilogy={request,requestSha256:hash(canon(request)),grantId:randomUUID(),grantExpiresAt:f.assigned.assignment.expiresAt,stagedAt:new Date(Date.now()-1000).toISOString(),candidateCommit,sourceDigest:f.assigned.assignment.sourceDigest,files:f.job.result.candidate.patches.map(p=>({path:p.path,operation:p.before===null?'create':'update',beforeHash:p.before===null?null:hash(p.before),afterHash:hash(p.after)})),command,identity:{campaignId:'trilogy:'+hash(canon({jobId:request.jobId,ownerId:request.ownerId,projectId:request.projectId,repositoryId:request.repositoryId})),taskId:request.jobId,agentId:'trilogy-code-monster'}};
 return {...f.assigned,trilogy,assignment:{...f.assigned.assignment,trilogyBindingDigest:hash(JSON.stringify(trilogy))}};
}
async function assertFailureStored(f,report,reason){
 assert.equal(report.passed,false);assert.equal(report.trilogyReceipt,undefined);
 assert.equal(report.cleanup.verifiedAbsent,true);
 assert.ok(Buffer.byteLength(report.output)<=20000);
 assert.ok(report.output.endsWith('\n'+reason));
 assert.equal(Buffer.from(report.output).toString('utf8'),report.output);
 await jobs.report(f.job.id,report);
 const saved=resultOf(f.job.id).externalTests;
 assert.equal(saved.passed,false);assert.equal(saved.output,report.output);
 assert.deepEqual(await f.calls(),['run','rm','inspect']);
}
const posix={skip:process.platform==='win32'?'POSIX simulated Docker CLI; Windows qualification remains separate':false};

test('over-budget execution retains a bounded failure report that the actual job store accepts',posix,async t=>{
 const f=await simulation(t,'x'.repeat(20001));
 const report=await execute(f.assigned);
 await assertFailureStored(f,report,'Output budget exceeded');
 assert.equal(Buffer.byteLength(report.output),20000);
});

test('timeout after 20 KB retains its reason inside the report allowance',posix,async t=>{
 const f=await simulation(t,'x'.repeat(20000),{holdOpen:true});
 const report=await execute(f.assigned);
 await assertFailureStored(f,report,'Execution timeout');
 assert.equal(Buffer.byteLength(report.output),20000);
});

test('failure truncation preserves complete UTF-8 characters and the failure reason',posix,async t=>{
 const f=await simulation(t,'🙂'.repeat(5001));
 const report=await execute(f.assigned);
 await assertFailureStored(f,report,'Output budget exceeded');
 assert.ok(report.output.startsWith('🙂'));assert.equal(report.output.includes('\ufffd'),false);
 assert.ok(/^🙂+$/u.test(report.output.slice(0,-'\nOutput budget exceeded'.length)));
});

test('overflow inside a three-byte character preserves the output-limit cause without replacement text',posix,async t=>{
 const f=await simulation(t,'€'.repeat(6667));
 const report=await execute(f.assigned);
 await assertFailureStored(f,report,'Output budget exceeded');
 assert.equal(report.output.includes('\ufffd'),false);
 assert.equal(report.output.includes('not valid UTF-8'),false);
 assert.ok(/^€+$/u.test(report.output.slice(0,-'\nOutput budget exceeded'.length)));
});

test('the real trilogy signing guard retains a three-byte overflow failure without issuing a signature',posix,async t=>{
 const f=await simulation(t,'€'.repeat(6667)),assigned=await withRealSigningGuard(f);
 const report=await execute(assigned);
 assert.equal(report.passed,false);assert.equal(report.trilogyReceipt,undefined);
 assert.equal(report.trilogySignerId,undefined);assert.equal(report.cleanup.verifiedAbsent,true);
 assert.ok(report.output.endsWith('\nOutput budget exceeded'));
 assert.ok(/^€+$/u.test(report.output.slice(0,-'\nOutput budget exceeded'.length)));
 assert.ok(Buffer.byteLength(report.output)<=20000);
});

test('actual malformed UTF-8 remains a failure and cannot receive a trilogy signature',posix,async t=>{
 const f=await simulation(t,Buffer.from([0xff])),assigned=await withRealSigningGuard(f);
 const report=await execute(assigned);
 assert.equal(report.passed,false);assert.equal(report.trilogyReceipt,undefined);
 assert.match(report.output,/not valid UTF-8/);assert.equal(report.cleanup.verifiedAbsent,true);
});

test('successful output at the byte limit remains exactly unchanged',posix,async t=>{
 const output='test "ok"\n'.repeat(2000),f=await simulation(t,output);
 const report=await execute(f.assigned);
 assert.equal(report.passed,true);assert.equal(Buffer.byteLength(report.output),20000);
 assert.deepEqual(Buffer.from(report.output),Buffer.from(output));
 await jobs.report(f.job.id,report);
 assert.equal(resultOf(f.job.id).externalTests.output,output);
 assert.equal(resultOf(f.job.id).externalTests.passed,true);
});

test('an ordinary failed command preserves its exact output when no truncation reason is needed',posix,async t=>{
 const output='é'.repeat(10000),f=await simulation(t,output,{exitCode:1});
 const report=await execute(f.assigned);
 assert.equal(report.passed,false);assert.equal(report.exitCode,1);
 assert.deepEqual(Buffer.from(report.output),Buffer.from(output));
 await jobs.report(f.job.id,report);
 assert.equal(resultOf(f.job.id).externalTests.output,output);
 assert.equal(resultOf(f.job.id).externalTests.passed,false);
});
