import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';import {createHash}from'node:crypto';import {cleanupContainer,execute} from '../worker/runner.mjs';
if(process.platform==='win32'){
 const calls=[];const yes=await cleanupContainer('test',{runCommand:async args=>{calls.push(args[0]);return args[0]==='rm'?{code:0,output:''}:{code:1,output:'No such object: test'};}});
 assert.equal(yes.verifiedAbsent,true);assert.deepEqual(calls,['rm','inspect']);
 const offline=await cleanupContainer('test',{runCommand:async()=>({code:1,output:'Cannot connect to daemon'})});assert.equal(offline.verifiedAbsent,false);
 const present=await cleanupContainer('test',{runCommand:async()=>({code:0,output:'{}'})});assert.equal(present.verifiedAbsent,false);
 console.log(JSON.stringify({passed:4,scope:'Windows portable cleanup behavior; real Docker isolation not tested'}));
 process.exit(0);
}
const dir=await mkdtemp(join(tmpdir(),'omni-cleanup-test-'));const savedPath=process.env.PATH;const savedImage=process.env.OMNI_WORKER_IMAGE;let checks=0;try{
 await writeFile(join(dir,'docker'),`#!/usr/bin/env node
const fs=require('fs'),p=require('path'),mode=fs.readFileSync(p.join(__dirname,'mode'),'utf8');fs.appendFileSync(p.join(__dirname,'trace'),process.argv[2]+'\\n');if(process.argv[2]==='run'){console.log('Simulated container output');process.exit(0)}else if(process.argv[2]==='rm'){setTimeout(()=>{fs.writeFileSync(p.join(__dirname,'removed'),'yes');process.exit(mode==='offline'?1:0)},120)}else if(mode==='offline'){console.error('Cannot connect to daemon');process.exit(1)}else if(mode==='present'){process.stdout.write('{}');process.exit(0)}else{if(!fs.existsSync(p.join(__dirname,'removed')))process.exit(0);console.error('No such object: test');process.exit(1)}
`,{mode:0o755});process.env.PATH=dir+':'+savedPath;
 await writeFile(join(dir,'mode'),'absent');const cleaned=await cleanupContainer('test');assert.equal(cleaned.verifiedAbsent,true);assert.equal(await readFile(join(dir,'trace'),'utf8'),'rm\ninspect\n');checks++;
 await writeFile(join(dir,'mode'),'present');assert.equal((await cleanupContainer('test')).verifiedAbsent,false);checks++;
 await writeFile(join(dir,'mode'),'offline');assert.equal((await cleanupContainer('test')).verifiedAbsent,false);checks++;
 delete process.env.OMNI_WORKER_IMAGE;await assert.rejects(execute({files:[],command:['node','--test','tests/omni-snapshot.test.mjs']}),/pinned SHA-256/);checks++;
 await writeFile(join(dir,'mode'),'absent');process.env.OMNI_WORKER_IMAGE='node@sha256:'+'a'.repeat(64);const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');const assignment={id:'assignment',candidateDigest:hash([]),sourceDigest:'b'.repeat(64),testManifestDigest:hash(['node','--test','tests/omni-snapshot.test.mjs']),expiresAt:Date.now()+60000};await assert.rejects(execute({files:[],command:['node','--test','tests/omni-snapshot.test.mjs'],assignment:{...assignment,candidateDigest:'a'.repeat(64)}}),/does not match/);checks++;const wired=await execute({files:[],command:['node','--test','tests/omni-snapshot.test.mjs'],assignment});assert.equal(wired.passed,true);assert.equal(wired.cleanup.verifiedAbsent,true);assert.deepEqual(wired.assignment,assignment);checks++;
 console.log(JSON.stringify({passed:checks,scope:'Real subprocess sequencing with a simulated Docker CLI; missing pinned-image rejection. No real Docker isolation is certified.'}));
}finally{process.env.PATH=savedPath;if(savedImage===undefined)delete process.env.OMNI_WORKER_IMAGE;else process.env.OMNI_WORKER_IMAGE=savedImage;await rm(dir,{recursive:true,force:true})}
