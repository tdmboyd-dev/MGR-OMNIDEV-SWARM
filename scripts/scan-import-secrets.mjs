import {readFileSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
const patterns=[
 ['private-key-pem',/-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g],
 ['github-token',/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/g],
 ['aws-access-key-id',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
 ['openai-api-key',/\bsk-(?:proj-)?[A-Za-z0-9_-]{25,}\b/g],
 ['stripe-live-secret',/\bsk_live_[A-Za-z0-9]{20,}\b/g],
 ['slack-token',/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g]
];
const sha=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
export function scanPinnedImportSecrets({repoRoot,revision,manifestPath='evidence/github-source-import.json'}){
 if(!sha.test(revision||''))throw new TypeError('pinned revision required');
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 if(manifest.target_repository!=='tdmboyd-dev/MGR-OMNIDEV-SWARM'||manifest.file_count!==manifest.files?.length)throw new Error('incorrect source manifest');
 const hits=[];let scanned=0,bytes=0;
 for(const row of manifest.files){
  if(typeof row.path!=='string'||!row.path||row.path.startsWith('/')||row.path.includes('\\')||row.path.split('/').some(s=>!s||s==='..'||s==='.')||row.bytes>20_000_000)throw new Error('unsafe source path');
  const buffer=execFileSync('git',['-C',repoRoot,'show',revision+':'+row.path],{stdio:['ignore','pipe','pipe'],maxBuffer:20_000_000});scanned++;bytes+=buffer.length;
  if(buffer.includes(0))continue;const content=buffer.toString('utf8');
  for(const [rule,regex]of patterns){regex.lastIndex=0;if(regex.test(content))hits.push({path:row.path,rule});}
 }
 return {schema:'mgr.source-import-secret-check.v1',revision,scanned,bytes,highConfidenceMatches:hits,pass:hits.length===0,scope:'Recognizes only listed high-confidence credential formats, not all embedded secrets or authorization provenance',patterns:patterns.map(x=>x[0])};
}
if(process.argv[1]?.endsWith('scan-import-secrets.mjs')&&process.argv.length>=4){
 const r=scanPinnedImportSecrets({repoRoot:process.argv[2],revision:process.argv[3]});
 const out=process.argv[4];if(out)writeFileSync(out,JSON.stringify(r,null,2)+'\n');
 console.log(JSON.stringify({scanned:r.scanned,bytes:r.bytes,pass:r.pass,hits:r.highConfidenceMatches}));if(!r.pass)process.exitCode=1;
}
