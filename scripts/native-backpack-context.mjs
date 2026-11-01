import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {runOnce} from '../worker/windows-worker.mjs';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash=value=>createHash('sha256').update(value).digest('hex');
const keys=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>allowed.includes(k));
/** Existing Backpack SDK + existing native queue, selected by a reviewed local
 * host configuration. No model, second job store, root enrollment or new grant.
 * Project text is advisory data and is never passed to the sandbox as policy. */
export async function runNativeWithBackpack(input,{execute=runOnce}={}){
 if(!keys(input,['workerConfigPath','expectedJobId','backpack'])||!path.isAbsolute(input.workerConfigPath??'')||!uuid.test(input.expectedJobId??'')||typeof execute!=='function')throw Error('Exact owner worker configuration and job required');
 const b=input.backpack;
 if(!keys(b,['toolkitRoot','configPath','project','sourcePath','record'])||!path.isAbsolute(b.toolkitRoot??'')||!path.isAbsolute(b.configPath??'')||typeof b.project!=='string'||typeof b.sourcePath!=='string'||typeof b.record!=='boolean')throw Error('Explicit owner Backpack binding required');
 const toolkit=fs.realpathSync(b.toolkitRoot),manifest=JSON.parse(fs.readFileSync(path.join(toolkit,'package.json'),'utf8'));
 if(manifest.name!=='@mgr/backpack')throw Error('Reviewed Backpack toolkit identity required');
 const {configuredEngine}=await import(pathToFileURL(path.join(toolkit,'src/host-config.js')).href),engine=configuredEngine(b.configPath);
 try{
  const project=engine.project(b.project),source=engine.readSource({project:b.project,path:b.sourcePath,lineCount:1},{record:false}),context=engine.context(b.project);
  const encoded=JSON.stringify(context);if(Buffer.byteLength(encoded)>131072)throw Error('Backpack context exceeds host workflow bound; narrow stored context');
  // Recheck the actual configured root after context retrieval, before dispatch.
  if(engine.project(b.project).root!==project.root)throw Error('Backpack project binding changed');
  const metadata={project:b.project,contextSha256:hash(encoded),sourcePath:source.path,sourceSha256:source.sha256,recorded:false,canonicalJobOwner:'OmniDev',trust:'Advisory untrusted context; not execution permission or acceptance.'};
  let result;
  try{result=await execute(input.workerConfigPath,{expectedJobId:input.expectedJobId,context});}
  catch(error){
   // The original worker journal owns unknown outcomes. Never redispatch here.
   throw error;
  }
  if(!result||result.claimed!==0&&result.claimed!==1||result.claimed===1&&(result.jobId!==input.expectedJobId||typeof result.passed!=='boolean'))throw Error('Native result differs from the exact owner-bound job; reconcile worker journal');
  if(b.record){
   try{
    const current=engine.readSource({project:b.project,path:b.sourcePath,lineCount:1},{record:false});
    if(current.sha256!==source.sha256)metadata.recordError='SOURCE_CHANGED_AFTER_RUN';
    else{
     const key='omni-native-'+input.expectedJobId;
     const outcome=result.claimed===1?(result.passed===true?'passed':result.passed===false?'failed':'unknown'):'no-new-execution';
     engine.remember({project:b.project,key,source:b.sourcePath,text:`Existing OmniDev native snapshot job ${input.expectedJobId}: ${outcome}. Context SHA-256 ${metadata.contextSha256}. Source anchor SHA-256 ${source.sha256}. Canonical job and execution receipts remain in OmniDev/native worker journal. This is a source-linked host observation, not another job, owner acceptance, whole-app audit or production verification.`});
     metadata.recorded=true;metadata.memoryKey=key;
    }
   }catch{metadata.recordError='BACKPACK_NOTE_UNAVAILABLE';}
  }
  return {...result,backpack:metadata};
 }finally{engine.close();}
}
