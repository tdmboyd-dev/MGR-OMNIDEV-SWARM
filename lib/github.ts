import {selectSnapshotFiles} from './github-selection';
import {githubToken} from './github-account';
import type {SourceFile} from './analyzer';
export async function githubSnapshot(location:string,authenticated=false){
 const m=location.trim().match(/^(?:https:\/\/github\.com\/)?([\w.-]+)\/([\w.-]+)\/?$/);
 if(!m)throw new Error('Use a public repository URL, such as https://github.com/owner/repository');
 const owner=m[1], repo=m[2].replace(/\.git$/,'');
 const headers:any={'Accept':'application/vnd.github+json','User-Agent':'OmniDev-Swarm'};if(authenticated)headers.Authorization='Bearer '+await githubToken();
 async function get(url:string){const r=await fetch(url,{headers,signal:AbortSignal.timeout(15000),redirect:'manual'});if(!r.ok)throw new Error(r.status===404?'Public repository not found. Private repositories require an authorized adapter.':r.status===403||r.status===429?'GitHub rate limit reached. Try again later or import files.':'GitHub could not return the snapshot.');return r;}
 const base=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
 const info:any=await (await get(base)).json();const ref=info.default_branch;
 const tree:any=await (await get(base+'/git/trees/'+encodeURIComponent(ref)+'?recursive=1')).json();
 const candidates=selectSnapshotFiles(tree.tree,100);
 if(!candidates.length)throw new Error('No supported text source files found. Import a local snapshot instead.');
 const files:SourceFile[]=[];const coverage={inventory:tree.tree.filter((x:any)=>x.type==='blob').slice(0,2000).map((x:any)=>({path:x.path,sourceDigest:x.sha,status:candidates.some((c:any)=>c.path===x.path)?'imported':'not-inspected'})),inventoryPartial:tree.tree.filter((x:any)=>x.type==='blob').length>2000,totalFiles:tree.tree.filter((x:any)=>x.type==='blob').length,importedFiles:candidates.length,treeComplete:!tree.truncated,limit:100,excluded:'Secrets, generated/dependency folders, lockfiles, binary/unsupported and files over 100 KB; file/byte budgets'};
 for(let i=0;i<candidates.length;i+=5){const group=await Promise.all(candidates.slice(i,i+5).map(async(x:any)=>{const url=`https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(ref)}/${x.path.split('/').map(encodeURIComponent).join('/')}`;const r=await get(authenticated?base+'/git/blobs/'+encodeURIComponent(x.sha):url);const content=authenticated?new TextDecoder().decode(Uint8Array.from(atob(((await r.json()) as any).content.replace(/\s/g,'')),c=>c.charCodeAt(0))):await r.text();if(content.length>100000)throw new Error('A source file exceeds the import limit.');return {path:x.path,content};}));files.push(...group);}
 if(files.reduce((a,f)=>a+f.content.length,0)>2000000)throw new Error('Repository snapshot exceeds 2 MB. Import a smaller selection of files.');
 return {files,coverage,authenticated,title:repo,url:`https://github.com/${owner}/${repo}`,ref,partial:!!tree.truncated||candidates.length<tree.tree.filter((x:any)=>x.type==='blob').length};
}
