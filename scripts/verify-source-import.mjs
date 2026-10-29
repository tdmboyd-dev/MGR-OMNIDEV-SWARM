import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const SHA=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
export function verifyHistoricalSourceImport({repoRoot,sourceRevision,manifestPath='evidence/github-source-import.json'}){
 if(!SHA.test(sourceRevision))throw new TypeError('pinned source revision required');
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 if(manifest.target_repository!=='tdmboyd-dev/MGR-OMNIDEV-SWARM'||manifest.file_count!==manifest.files?.length)throw new Error('manifest identity/count mismatch');
 const files=[],seen=new Set();
 const show=(path)=>execFileSync('git',['-C',repoRoot,'show',sourceRevision+':'+path],{stdio:['ignore','pipe','pipe'],maxBuffer:20_000_000});
 for(const row of manifest.files){
  const path=row.path;if(typeof path!=='string'||!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(x=>!x||x==='.'||x==='..')||seen.has(path))throw new Error('unsafe duplicate manifest path');
  seen.add(path);
  if(/(?:^|\/)(?:\.env(?:\.[^/]+)?|id_rsa|id_ed25519|[^/]*private\.key|[^/]*credentials\.json)(?:$|\/)/i.test(path))throw new Error('credential-like path in tracked snapshot');
  let actual;try{actual=show(path)}catch{files.push({path,status:'missing'});continue;}
  const digest=createHash('sha256').update(actual).digest('hex');
  files.push({path,status:actual.length===row.bytes&&digest===row.sha256?'match':'mismatch'});
 }
 const counts={};for(const x of files)counts[x.status]=(counts[x.status]??0)+1;
 return {sourceRevision,target:manifest.target_repository,sitesCommit:manifest.source_commit,fileCount:manifest.files.length,counts,pass:counts.match===manifest.files.length,scope:'Pinned imported file bytes and dangerous filename detection only; cannot prove all possible embedded secrets absent'};
}
if(process.argv[1]?.endsWith('verify-source-import.mjs')&&process.argv.length>=4){
 const result=verifyHistoricalSourceImport({repoRoot:process.argv[2],sourceRevision:process.argv[3],manifestPath:process.argv[4]??'evidence/github-source-import.json'});
 console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
}
