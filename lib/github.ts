import {selectSnapshotFiles} from './github-selection';
import {githubToken} from './github-account';
import type {SourceFile} from './analyzer';
async function boundedBytes(response:Response,limit:number){
 const reader=response.body?.getReader();if(!reader)throw Error('GitHub returned no bounded response body');const parts:Uint8Array[]=[];let size=0,emptyChunks=0;
 try{for(;;){const next=await reader.read();if(next.done)break;if(!(next.value instanceof Uint8Array))throw Error('GitHub returned invalid response bytes');if(next.value.byteLength===0){if(++emptyChunks>1024)throw Error('GitHub empty response chunk budget exceeded');continue;}size+=next.value.byteLength;if(size>limit)throw Error('GitHub response exceeds snapshot byte budget');parts.push(next.value);}const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return bytes;}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
async function boundedJson(response:Response,limit=1000000){return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await boundedBytes(response,limit)));}
async function blobIdentity(bytes:Uint8Array){const header=new TextEncoder().encode('blob '+bytes.byteLength+'\0'),object=new Uint8Array(header.length+bytes.length);object.set(header);object.set(bytes,header.length);return [...new Uint8Array(await crypto.subtle.digest('SHA-1',object))].map(b=>b.toString(16).padStart(2,'0')).join('');}

export async function githubSnapshot(location:string,authenticated=false){
 const m=location.trim().match(/^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/);
 if(!m)throw new Error('Use a public repository URL, such as https://github.com/owner/repository');
 const owner=m[1], repo=m[2].replace(/\.git$/,'');
 const headers:any={'Accept':'application/vnd.github+json','User-Agent':'OmniDev-Swarm'};if(authenticated)headers.Authorization='Bearer '+await githubToken();
 async function get(url:string){const r=await fetch(url,{headers,signal:AbortSignal.timeout(15000),redirect:'manual'});if(!r.ok)throw new Error(r.status===404?'Public repository not found. Private repositories require an authorized adapter.':r.status===403||r.status===429?'GitHub rate limit reached. Try again later or import files.':'GitHub could not return the snapshot.');return r;}
 const base=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
 const info:any=await boundedJson(await get(base));const ref=info.default_branch;if(typeof ref!=='string'||!ref||ref.length>250)throw Error('GitHub returned an invalid source branch');
 const revision:any=await boundedJson(await get(base+'/commits/'+encodeURIComponent(ref)));
 if(!/^[a-f0-9]{40}$/.test(revision.sha||'')||!/^[a-f0-9]{40}$/.test(revision.commit?.tree?.sha||''))throw Error('GitHub did not return a pinned commit and tree');
 const commit=revision.sha,treeSha=revision.commit.tree.sha;
 const tree:any=await boundedJson(await get(base+'/git/trees/'+treeSha+'?recursive=1'),8000000);
 if(!Array.isArray(tree.tree)||tree.tree.length>100000||typeof tree.truncated!=='boolean'||tree.tree.some((x:any)=>!x||typeof x.path!=='string'||!['blob','tree','commit'].includes(x.type)))throw Error('GitHub returned invalid bounded tree metadata');
 const candidates=selectSnapshotFiles(tree.tree,100);
 if(!candidates.length)throw new Error('No supported text source files found. Import a local snapshot instead.');
 const files:SourceFile[]=[];const coverage={inventory:tree.tree.filter((x:any)=>x.type==='blob').slice(0,2000).map((x:any)=>({path:x.path,sourceDigest:x.sha,status:candidates.some((c:any)=>c.path===x.path)?'imported':'not-inspected'})),inventoryPartial:tree.tree.filter((x:any)=>x.type==='blob').length>2000,totalFiles:tree.tree.filter((x:any)=>x.type==='blob').length,importedFiles:candidates.length,treeComplete:!tree.truncated,limit:100,byteIdentity:'git-blob-sha1',textDecoding:'fatal-utf8-bom-preserved',excluded:'Secrets, dependencies/generated folders, symbolic/submodule/unsupported files, non-npm lockfiles and files at least 100 KB; file/byte budgets'};
 for(let i=0;i<candidates.length;i+=5){const group=await Promise.all(candidates.slice(i,i+5).map(async(x:any)=>{
  const url=`https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${commit}/${x.path.split('/').map(encodeURIComponent).join('/')}`;
  const response=await get(authenticated?base+'/git/blobs/'+encodeURIComponent(x.sha):url);let bytes:Uint8Array;
  if(authenticated){const blob=await boundedJson(response,200000);if(blob.encoding!=='base64'||blob.sha!==x.sha||blob.size!==x.size||typeof blob.content!=='string')throw Error('GitHub blob metadata differs from pinned tree');const encoded=blob.content.replace(/\s/g,''),raw=atob(encoded);if(btoa(raw)!==encoded)throw Error('GitHub returned invalid base64 source');bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));}
  else bytes=await boundedBytes(response,100000);
  if(bytes.length!==x.size||bytes.length>=100000||await blobIdentity(bytes)!==x.sha)throw Error('GitHub source bytes differ from pinned blob');
  const content=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);return {path:x.path,content};
 }));files.push(...group);}
 if(files.reduce((n,f)=>n+new TextEncoder().encode(f.content).byteLength,0)>2000000)throw Error('Repository snapshot exceeds 2 MB. Import a smaller selection of files.');
 return {files,coverage,authenticated,title:repo,url:`https://github.com/${owner}/${repo}`,ref,commit,tree:treeSha,partial:!!tree.truncated||candidates.length<tree.tree.filter((x:any)=>x.type==='blob').length};
}
