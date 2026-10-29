import {spawn, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile, realpath, writeFile, lstat, rm, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// Reviewed local checks, not a sandbox for untrusted code or a production attestation.
export const FIXTURE_PROFILES = Object.freeze(Object.fromEntries(Object.entries({
 prepare:['tests/prepare.mjs'],
 trilogyLink:['tests/trilogy-job-link.test.mjs'],
 typecheck:['node_modules/typescript/bin/tsc','--noEmit','--incremental','false','--diagnostics'],
 build:['scripts/run-framework.mjs','build'],
 acceptance:['tests/acceptance.mjs'], runtime:['tests/runtime.mjs'],
 integration:['tests/integration-fleet.mjs'], supervisor:['tests/engine-supervisor.mjs'],
 cleanup:['tests/worker-cleanup.mjs'], specialists:['tests/specialist-areas.mjs'],
 parallel:['tests/parallel-specialists.mjs'], automatic:['tests/automatic-review.mjs'],
 jobs:['tests/job-move.mjs'], project:['tests/project-controls.mjs'],
 pipeline:['tests/pipeline.mjs'], review:['tests/review-controls.mjs'],
 generation:['tests/generation-timeout.mjs'], platform:['tests/platform.mjs'],
 brains:['tests/brains.mjs'], accountAutostart:['tests/account-autostart.mjs'],
 companion:['tests/companion-dashboard.mjs'], engineHeader:['tests/engine-header.mjs'],
 engineUpdate:['tests/engine-update.mjs'], fileLedger:['tests/file-ledger-bench.mjs'],
 jobPresentation:['tests/job-presentation.mjs'], localReview:['tests/local-review-controls.mjs'],
 openProgress:['tests/open-progress.mjs'], pipelineEngine:['tests/pipeline-engine.mjs'],
 repoCompletion:['tests/repo-completion.mjs'], reviewPlanner:['tests/review-planner.mjs'],
 specialistBackground:['tests/specialist-background.mjs'], specialistsLedger:['tests/specialists-ledger.mjs'],
 swarmSpawning:['tests/swarm-spawning.mjs'], audit174:['tests/audit-174.test.mjs'],
 acceptanceGate:['tests/acceptance-promotion-gate.test.mjs'], connectorQualification:['tests/connector-qualification.test.mjs'],
 publicKey:['tests/engine-public-key-provenance.test.mjs'], portableCleanup:['tests/mgr-portable-cleanup.test.mjs'],
 fleet:['tests/mgr-ten-slot-fleet.test.mjs'], committedSource:['tests/reconcile-implementation.test.mjs'],
 sourceReferences:['tests/reconcile-source-refs.test.mjs'], acceptanceRouting:['tests/route-acceptance-work.test.mjs'],
 fixtureRecorder:['tests/run-fixture-evidence.test.mjs'], secretScan:['tests/scan-import-secrets.test.mjs'],
 waveSelection:['tests/select-acceptance-wave.test.mjs'], registerTests:['tests/validate-acceptance-register.test.mjs'],
 signedReceipt:['tests/verify-acceptance-receipt.test.mjs'], sourceImport:['tests/verify-source-import.test.mjs'],
 register:['scripts/validate-acceptance-register.mjs','UNFINISHED-WORK/backlog.json','UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json'],
 executive:['tests/executive-scorecard.test.mjs'], intelligenceIntegrity:['tests/intelligence-integrity.mjs'],
 jobRecovery:['tests/job-recovery-integrity.mjs'], providerRace:['tests/provider-verification-race.mjs'],
 unlinkedConnectors:['tests/unlinked-connectors.test.mjs'], workflow:['tests/full-verification-workflow.test.mjs'],
 workspacePlanning:['tests/workspace-planning.mjs'], decisionOutcomes:['tests/decision-outcomes.mjs'],
 planningUi:['tests/planning-ui.test.mjs'], gapEvaluation:['tests/gap-evaluation.test.mjs'],
 securityGapEvaluation:['tests/security-gap-evaluation.test.mjs'], securityGapReconciliation:['tests/security-gap-reconciliation.mjs'],
}).map(([name,argv])=>[name,Object.freeze(argv)])));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(root,args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:4_000_000}).trim();
const sourceState=root=>({commit:git(root,['rev-parse','HEAD']),tree:git(root,['rev-parse','HEAD^{tree}']),dirty:git(root,['status','--porcelain','--untracked-files=all'])});
function fixtureEnvironment(){
 const names=new Set(['PATH','Path','SystemRoot','SYSTEMROOT','WINDIR','ComSpec','COMSPEC','PATHEXT','TEMP','TMP','TMPDIR','LANG','LC_ALL']);
 return {...Object.fromEntries(Object.entries(process.env).filter(([name])=>names.has(name))),CI:'1',NO_COLOR:'1',TZ:'UTC'};
}
export async function runFixtureEvidence({profile,cwd=process.cwd(),timeoutMs=90_000}){
 const args=Object.hasOwn(FIXTURE_PROFILES,profile)?FIXTURE_PROFILES[profile]:null;
 if(!args)throw new TypeError('unknown approved suite');
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>180_000)throw new TypeError('invalid timeout');
 const root=await realpath(resolve(cwd));
 if(await realpath(git(root,['rev-parse','--show-toplevel']))!==root)throw new Error('repository root required');
 const before=sourceState(root);
 if(!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(before.commit))throw new Error('unpinned source commit');
 if(before.dirty)throw new Error('source changes not committed (tracked or untracked files)');
 git(root,['ls-files','--error-unmatch',profile==='typecheck'?'pnpm-lock.yaml':args[0]]);
 if(profile==='prepare'){
  const generated=resolve(root,'.test-runtime');
  try{const info=await lstat(generated);if(!info.isDirectory()||info.isSymbolicLink())throw Error('generated runtime directory must not be a symlink or file');await rm(generated,{recursive:true});}
  catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(generated);
 }
 let lockfileSha256=null;
 try{lockfileSha256=hash(await readFile(resolve(root,'pnpm-lock.yaml')));}catch(error){if(error.code!=='ENOENT')throw error;}
 const startedAt=new Date().toISOString(),started=performance.now();
 const result=await new Promise(done=>{
  const child=spawn(process.execPath,args,{cwd:root,shell:false,windowsHide:true,detached:process.platform!=='win32',env:fixtureEnvironment(),stdio:['ignore','pipe','pipe']});
  const chunks=[];
  let capturedBytes=0,totalOutputBytes=0,truncated=false,failure=null,killTimer;
  const terminate=signal=>{
   if(!child.pid)return;
   try{
    if(process.platform==='win32'){
     if(signal==='SIGKILL')execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',timeout:5000});
     else child.kill(signal);
    }else process.kill(-child.pid,signal);
   }catch(error){if(error.code!=='ESRCH')child.kill(signal);}
  };
  const stop=reason=>{if(failure)return;failure=reason;terminate('SIGTERM');killTimer=setTimeout(()=>terminate('SIGKILL'),300);};
  const capture=chunk=>{
   totalOutputBytes+=chunk.length;
   const allowed=Math.min(chunk.length,2_000_000-capturedBytes);
   if(allowed>0){chunks.push(chunk.subarray(0,allowed));capturedBytes+=allowed;}
   if(totalOutputBytes>2_000_000){truncated=true;stop('output-limit');}
  };
  child.stdout.on('data',capture);child.stderr.on('data',capture);
  child.on('error',error=>{failure||=error.code||'spawn-error';});
  const timer=setTimeout(()=>stop('timeout'),timeoutMs);
  // Sending a signal does not prove termination: wait for closed output streams.
  child.once('close',(exitCode,signal)=>{
   clearTimeout(timer);clearTimeout(killTimer);if(failure)terminate('SIGKILL');
   const output=Buffer.concat(chunks);
   done({exitCode,signal,reason:failure||(exitCode===0?'exited-zero':'exit-failed'),outputSha256:hash(output),outputBase64:output.toString('base64'),capturedBytes,totalOutputBytes,truncated,processClosed:true});
  });
 });
 const after=sourceState(root),sourceUnchanged=before.commit===after.commit&&before.tree===after.tree&&!after.dirty;
 const outputObserved=result.capturedBytes>0;
 return {contract:'mgr.fixture-execution-evidence.v2',profile,sourceCommit:before.commit,sourceTree:before.tree,sourceCommitAfter:after.commit,sourceUnchanged,lockfileSha256,
  argv:[process.execPath,...args],commandSha256:hash(JSON.stringify(['node',...args])),startedAt,finishedAt:new Date().toISOString(),durationMs:Math.round(performance.now()-started),
  runtime:{node:process.version,platform:process.platform,arch:process.arch},...result,
  outputObserved, passed:result.exitCode===0&&!result.truncated&&result.reason==='exited-zero'&&sourceUnchanged&&outputObserved,
  qualification:'local-fixture-only-not-parent-acceptance',signed:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href&&process.argv.length>=4){
 const output={createdAt:new Date().toISOString(),runs:[]};
 for(const profile of process.argv.slice(3))output.runs.push(await runFixtureEvidence({profile}));
 await writeFile(process.argv[2],JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify(output.runs.map(({profile,passed,reason,sourceUnchanged})=>({profile,passed,reason,sourceUnchanged}))));
 if(output.runs.some(run=>!run.passed))process.exitCode=1;
}
