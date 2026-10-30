import path from 'node:path';
import {createHash} from 'node:crypto';

export const PUBLIC_REPOSITORY='tdmboyd-dev/MGR-OMNIDEV-SWARM';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const nonnegative=value=>Number.isSafeInteger(value)&&value>=0;
const sha=/^[a-f0-9]{40}$/;
const digest=/^[a-f0-9]{64}$/;

export function repositoryPath(value){
  if(typeof value!=='string'||!value||value.length>2048||path.posix.isAbsolute(value)||path.win32.isAbsolute(value)
    ||/[\\\u0000-\u001f\u007f]/.test(value)||value.split('/').some(part=>!part||part==='.'||part==='..'))throw Error('Evidence path must be a normal repository-relative path');
  return value;
}

/** Public views retain evidence references, never arbitrary report bodies. */
export function projectPublicEvidence(value,repository=PUBLIC_REPOSITORY){
  const item=typeof value==='string'?{path:value}:value;
  if(!plain(item))throw Error('Evidence reference must be a string or object');
  if(item.visibility==='private'||item.private===true||item.repo&&item.repo!==repository||item.repository&&item.repository!==repository){
    return {kind:'restricted-reference',withheld:true,reason:'Evidence from another or private repository is not included in this public view.'};
  }
  const projected={};
  if(typeof item.kind==='string')projected.kind=item.kind.slice(0,160);
  if(item.path){
    try{
      const file=repositoryPath(item.path);
      if(file.split('/').some(part=>/^(?:\.env(?:\.|$)|id_(?:rsa|ed25519)(?:\.|$))/.test(part))||/\.(?:pem|p12|pfx|key)$/i.test(file))throw Error('Sensitive reference');
      projected.path=file;
    }catch{return {kind:'restricted-reference',withheld:true,reason:'Unsafe or sensitive evidence path is not included in this public view.'};}
  }
  if(item.repo===repository)projected.repo=repository;
  if(sha.test(item.sourceRevision||''))projected.sourceRevision=item.sourceRevision;
  if(digest.test(item.sha256||''))projected.sha256=item.sha256;
  if(typeof item.profile==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(item.profile))projected.profile=item.profile;
  for(const field of ['bytes','fileCount','matched','hits'])if(nonnegative(item[field]))projected[field]=item[field];
  if(Number.isSafeInteger(item.exitCode))projected.exitCode=item.exitCode;
  // A URL is not a trusted provenance claim. Links are built later from an
  // observed public Git tree and the exact local blob, never copied from input.
  if(item.url&&!projected.path)projected.reason='External links are not exported; use a verified repository-relative evidence reference.';
  return Object.keys(projected).length?projected:{kind:'unavailable-reference',reason:'No supported public evidence reference was supplied.'};
}

export function validatePublicWave(wave,repository=PUBLIC_REPOSITORY){
  if(!plain(wave))throw Error('Wave report must be an object');
  if(wave.visibility==='private'||wave.private===true||![repository,repository.split('/')[1]].includes(wave.repository))throw Error('A public progress overlay must explicitly belong to this public repository');
  return wave;
}

/** Recount actual receipts and check their immutable output, not wave totals. */
export function verifiedRunSummary(report,{reportPath,readBytes,claimedCounts,expectedSourceCommit}={}){
  repositoryPath(reportPath);
  if(!plain(report)||report.schema!=='mgr.full-verification.v1'||report.completed!==true||!sha.test(report.sourceCommit||'')
    ||!Array.isArray(report.requestedProfiles)||!report.requestedProfiles.length||!Array.isArray(report.runs)
    ||report.runs.length!==report.requestedProfiles.length||new Set(report.requestedProfiles).size!==report.requestedProfiles.length)throw Error('Completed source-bound verification report required');
  if(expectedSourceCommit!==undefined&&report.sourceCommit!==expectedSourceCommit)throw Error('Verification source commit differs from its wave');
  const counts={passedProfiles:0,failedProfiles:0,blockedProfiles:0,totalProfiles:report.runs.length};
  for(let index=0;index<report.runs.length;index++){
    const run=report.runs[index];
    if(!plain(run)||typeof run.profile!=='string'||run.profile!==report.requestedProfiles[index]||typeof run.passed!=='boolean'||run.passed&&run.blocked===true)throw Error('Verification profile identity or result is invalid');
    if(run.passed){
      if(run.sourceCommit!==report.sourceCommit||run.sourceCommitAfter!==report.sourceCommit||run.sourceUnchanged!==true||run.exitCode!==0
        ||run.signal!==null||run.truncated!==false||run.processClosed!==true||run.outputObserved!==true
        ||!nonnegative(run.capturedBytes)||run.capturedBytes<1||run.totalOutputBytes!==run.capturedBytes||!digest.test(run.outputSha256||''))throw Error('Passing verification profile lacks complete unchanged-source output');
    }
    if(run.outputFile!==undefined){
      const relative=repositoryPath(run.outputFile);
      const outputPath=repositoryPath(path.posix.join(path.posix.dirname(reportPath),relative));
      const output=readBytes(outputPath);
      if(!digest.test(run.outputSha256||'')||hash(output)!==run.outputSha256||output.length!==run.capturedBytes)throw Error('Verification output hash or byte count differs: '+run.profile);
    }else if(run.passed)throw Error('Passing verification profile is missing its saved output');
    counts[run.passed?'passedProfiles':run.blocked===true?'blockedProfiles':'failedProfiles']++;
  }
  for(const supplied of [report.summary,claimedCounts].filter(x=>x!==undefined)){
    if(!plain(supplied))throw Error('Verification summary must be an object');
    for(const field of Object.keys(counts))if(supplied[field]!==undefined&&(!nonnegative(supplied[field])||supplied[field]!==counts[field]))throw Error('Verification summary differs from executed receipts: '+field);
  }
  if(report.localRegressionPassed!==(counts.passedProfiles===counts.totalProfiles))throw Error('Verification pass declaration differs from executed receipts');
  return {...counts,sourceCommit:report.sourceCommit,report:reportPath,scope:report.qualification||'Local regression only; not full product acceptance.'};
}
