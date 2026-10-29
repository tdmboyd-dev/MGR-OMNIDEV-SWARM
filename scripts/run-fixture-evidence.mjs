import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const PROFILES=Object.freeze({
 acceptance:['tests/acceptance.mjs'],
 runtime:['tests/runtime.mjs'],
 integration:['tests/integration-fleet.mjs'],
 supervisor:['tests/engine-supervisor.mjs'],
 cleanup:['tests/worker-cleanup.mjs'],
 specialists:['tests/specialist-areas.mjs'],
 parallel:['tests/parallel-specialists.mjs'],
 automatic:['tests/automatic-review.mjs'],
 jobs:['tests/job-move.mjs'],
 project:['tests/project-controls.mjs'],
 pipeline:['tests/pipeline.mjs'],
 review:['tests/review-controls.mjs'],
 generation:['tests/generation-timeout.mjs']
});
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function runFixtureEvidence({profile,cwd=process.cwd(),timeoutMs=90_000}){
 const args=PROFILES[profile];if(!args)throw new TypeError('unknown approved suite');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>180_000)throw new TypeError('invalid timeout');
 const root=resolve(cwd);
 const sourceCommit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 if(!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(sourceCommit))throw new Error('unpinned source commit');
 const dirty=execFileSync('git',['-C',root,'status','--porcelain','--untracked-files=no'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 if(dirty)throw new Error('tracked source changes not committed');
 const result=await new Promise(done=>{
  const child=spawn(process.execPath,args,{cwd:root,shell:false,windowsHide:true,env:{...process.env,CI:'1'},stdio:['ignore','pipe','pipe']});
  let chunks=[],bytes=0,truncated=false,closed=false;
  const end=(exitCode,reason)=>{if(closed)return;closed=true;clearTimeout(timer);const output=Buffer.concat(chunks);done({exitCode,reason,outputSha256:hash(output),capturedBytes:output.length,truncated});};
  const capture=chunk=>{bytes+=chunk.length;if(bytes>2_000_000){truncated=true;child.kill();return;}chunks.push(chunk);};
  child.stdout.on('data',capture);child.stderr.on('data',capture);
  child.on('error',e=>end(null,e.code||'spawn-error'));
  child.on('close',code=>end(code,code===0?'exited-zero':'exit-failed'));
  const timer=setTimeout(()=>{child.kill();end(null,'timeout');},timeoutMs);
 });
 return {contract:'mgr.fixture-execution-evidence.v1',profile,sourceCommit,argv:[process.execPath,...args],...result,passed:result.exitCode===0&&!result.truncated&&result.reason==='exited-zero',qualification:'local-fixture-only-not-parent-acceptance',signed:false};
}
if(process.argv[1]?.endsWith('run-fixture-evidence.mjs')&&process.argv.length>=4){
 const output={createdAt:new Date().toISOString(),runs:[]};
 for(const profile of process.argv.slice(3))output.runs.push(await runFixtureEvidence({profile}));
 await writeFile(process.argv[2],JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify(output.runs.map(x=>({profile:x.profile,passed:x.passed,reason:x.reason}))));
 if(output.runs.some(x=>!x.passed))process.exitCode=1;
}
