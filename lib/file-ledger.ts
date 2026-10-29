import {fingerprint} from './control-plane';
import {analyze} from './analyzer';

/** A static inspection receipt is not runtime verification. */
export async function fileLedger(files:any[],previous:any[]=[],changed:string[]=[],jobId:string|null=null){
  const previousByPath=new Map<string,Map<string,any>>();
  for(const entry of previous){
    if(typeof entry.path!=='string'||typeof entry.contentDigest!=='string')continue;
    let hashes=previousByPath.get(entry.path);
    if(!hashes){hashes=new Map();previousByPath.set(entry.path,hashes);}
    hashes.set(entry.contentDigest,entry);
  }
  const findingCount=new Map<string,number>();
  for(const finding of analyze(files).findings){
    const paths=new Set([finding.file,finding.path].filter((p):p is string=>typeof p==='string'));
    for(const path of paths)findingCount.set(path,(findingCount.get(path)||0)+1);
  }
  const changedPaths=new Set(changed);
  return Promise.all(files.map(async f=>{
    const contentDigest=await fingerprint(f.content);
    const old=previousByPath.get(f.path)?.get(contentDigest);
    return old||{path:f.path,contentDigest,
      status:changedPaths.has(f.path)?'changed-awaiting-runtime-verification':'inspected-static-only',
      findingCount:findingCount.get(f.path)||0,
      jobId,lastInspectedAt:new Date().toISOString(),runtimeVerified:false};
  }));
}
