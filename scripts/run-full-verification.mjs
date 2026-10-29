import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,readdir,lstat,rename} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {FIXTURE_PROFILES,runFixtureEvidence} from './run-fixture-evidence.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const preparedProfiles=new Set(['runtime','acceptance','integration','specialists','parallel','automatic','jobs','project','pipeline','review','platform','brains','jobPresentation','repoCompletion','reviewPlanner','specialistsLedger','swarmSpawning','intelligenceIntegrity','jobRecovery','providerRace','unlinkedConnectors','workspacePlanning','decisionOutcomes','securityGapReconciliation']);
export async function preparedModuleManifest(root){
 const directory=join(root,'.test-runtime');let entries;
 try{entries=await readdir(directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return null;throw error;}
 const files=[];
 for(const entry of entries.filter(entry=>entry.name.endsWith('.mjs')).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=join(directory,entry.name),stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink())throw Error('prepared module must be a regular file');
  const bytes=await readFile(path);files.push({path:'.test-runtime/'+entry.name,bytes:bytes.length,sha256:hash(bytes)});
 }
 return {files,sha256:hash(JSON.stringify(files))};
}
async function saveReport(path,value){
 const temporary=path+'.partial';await writeFile(temporary,JSON.stringify(value,null,2)+'\n');await rename(temporary,path);
}
export async function runFullVerification({cwd=process.cwd(),profiles=Object.keys(FIXTURE_PROFILES),outputDir=resolve(cwd,'outputs/full-verification'),timeoutMs=120_000,onProgress=()=>{}}={}){
 if(!Array.isArray(profiles)||!profiles.length||new Set(profiles).size!==profiles.length||profiles.some(name=>!Object.hasOwn(FIXTURE_PROFILES,name)))throw TypeError('nonempty unique approved profiles required');
 if(profiles.some(name=>preparedProfiles.has(name))&&(profiles[0]!=='prepare'))throw Error('prepare must run first for compiled runtime tests');
 const root=resolve(cwd),output=resolve(outputDir),within=relative(root,output);
 if(!within.startsWith('..')&&!within.includes(':')){
  try{execFileSync('git',['-C',root,'check-ignore','-q','--',within],{stdio:'ignore'});}catch{throw Error('verification output inside the repository must use a git-ignored directory');}
 }
 await mkdir(output,{recursive:true});
 const report={schema:'mgr.full-verification.v1',startedAt:new Date().toISOString(),sourceCommit:null,requestedProfiles:profiles,completed:false,
  qualification:'executed-local-regression-not-live-provider-or-release-certification',runs:[],preparedModules:null,
  limitations:['External provider HTTP and Docker in fixture suites remain simulated.','Passing local suites never promotes canonical parents automatically.','Dependencies use the pinned lockfile; this process is not an independent isolated signer.'],summary:{passedProfiles:0,failedProfiles:0,blockedProfiles:0}};
 const reportPath=join(output,'report.json');await saveReport(reportPath,report);
 let prepared=null,preparationFailed=false,sourceInvalid=false;
 for(const profile of profiles){
  let receipt;
  if(sourceInvalid||preparationFailed&&preparedProfiles.has(profile)){
   receipt={profile,passed:false,blocked:true,reason:sourceInvalid?'source changed during verification':'preparation failed'};
  }else{
   try{
    if(prepared){const current=await preparedModuleManifest(root);if(current?.sha256!==prepared.sha256)throw Error('prepared modules changed since pinned preparation');}
    receipt=await runFixtureEvidence({profile,cwd:root,timeoutMs});
    if(report.sourceCommit===null)report.sourceCommit=receipt.sourceCommit;
    if(receipt.sourceCommit!==report.sourceCommit){receipt.passed=false;receipt.reason='source revision changed between suites';sourceInvalid=true;}
    if(!receipt.sourceUnchanged)sourceInvalid=true;
    if(profile==='prepare'){
     prepared=await preparedModuleManifest(root);
     if(!prepared?.files.length){receipt.passed=false;receipt.reason='preparation produced no executable modules';}
     preparationFailed=!receipt.passed;report.preparedModules=prepared;
    }else if(prepared){
     const after=await preparedModuleManifest(root);receipt.preparedModulesUnchanged=after?.sha256===prepared.sha256;
     if(!receipt.preparedModulesUnchanged){receipt.passed=false;receipt.reason='prepared modules changed during suite';sourceInvalid=true;}
    }
    if(receipt.outputBase64!==undefined){
     const outputBytes=Buffer.from(receipt.outputBase64,'base64');
     if(hash(outputBytes)!==receipt.outputSha256)throw Error('captured output digest mismatch');
     const logFile=profile+'.log';await writeFile(join(output,logFile),outputBytes);
     receipt.outputFile=logFile;delete receipt.outputBase64;
    }
   }catch(error){receipt={profile,passed:false,blocked:true,reason:String(error.message)};if(profile==='prepare')preparationFailed=true;}
  }
  report.runs.push(receipt);
  report.summary.passedProfiles+=Number(receipt.passed===true);
  report.summary.blockedProfiles+=Number(receipt.blocked===true);
  report.summary.failedProfiles+=Number(receipt.passed!==true&&receipt.blocked!==true);
  await saveReport(reportPath,report);await onProgress({profile,passed:receipt.passed,blocked:receipt.blocked??false,reason:receipt.reason});
 }
 report.finishedAt=new Date().toISOString();report.completed=true;
 report.localRegressionPassed=report.runs.length===profiles.length&&report.runs.every(run=>run.passed===true);
 report.summary.totalProfiles=profiles.length;report.summary.independentlyCertifiedParents=0;
 // Named checks in nested suites may repeat. Profile totals are not unique assertions.
 report.summary.countingNote='Profiles are command executions. Nested suites repeat checks; no inflated unique-test total is inferred.';
 await saveReport(reportPath,report);return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const outputDir=process.argv[2]||resolve('outputs/full-verification');
 const profiles=process.argv.length>3?process.argv.slice(3):undefined;
 try{const report=await runFullVerification({outputDir,profiles,onProgress:progress=>console.log(JSON.stringify(progress))});console.log(JSON.stringify(report.summary));if(!report.localRegressionPassed)process.exitCode=1;}
 catch(error){console.error(error.message);process.exitCode=1;}
}
