import {safePath} from './runtime-contract';
/** Bounded source context, not a complete runnable-project checkout. */
export function selectSnapshotFiles(blobs:any[],limit=40){
 if(!Array.isArray(blobs)||!Number.isSafeInteger(limit)||limit<1||limit>300)throw Error('Invalid bounded snapshot selection');
 const eligible=blobs.filter(x=>x&&x.type==='blob'&&['100644','100755'].includes(x.mode)&&typeof x.path==='string'&&safePath(x.path)&&Number.isSafeInteger(x.size)&&x.size>=0&&x.size<100000&&/^[a-f0-9]{40}$/.test(x.sha)&&!/(^|\/)(node_modules|vendor|dist|build|\.git|pnpm-lock\.yaml|yarn\.lock)(\/|$)/i.test(x.path)&&!/(^|\/)(\.env|id_rsa|id_ed25519)/i.test(x.path)&&/\.(tsx?|jsx?|[mc][jt]s|py|go|rs|java|cs|cpp|c|h|json|ya?ml|md|sql|toml|tf|sh|vue|svelte|rb|php)$|Dockerfile$/i.test(x.path));
 if(new Set(eligible.map(x=>x.path.toLowerCase())).size!==eligible.length)throw Error('Ambiguous portable snapshot paths');
 const rank=(path:string)=> /(^|\/)(package(?:-lock)?\.json|tsconfig[^/]*\.json|next\.config\.[^/]+|Dockerfile)$/i.test(path)?0:/\.(tsx?|jsx?|[mc][jt]s|py|go|rs|java|cs|cpp|c|h|vue|svelte|rb|php)$/.test(path)?1:/\.md$/.test(path)?3:2;
 let bytes=0;return eligible.sort((a,b)=>rank(a.path)-rank(b.path)||a.path.localeCompare(b.path)).filter(x=>{if(bytes+(x.size||0)>1800000)return false;bytes+=x.size||0;return true;}).slice(0,limit);
}
