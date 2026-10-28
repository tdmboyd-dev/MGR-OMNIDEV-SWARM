/** Bounded repository imports must prefer executable context over alphabetical docs. */
export function selectSnapshotFiles(blobs:any[],limit=40){
 const eligible=blobs.filter(x=>x.type==='blob'&&x.size<=100000&&!/(^|\/)(node_modules|vendor|dist|build|\.git|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)(\/|$)/.test(x.path)&&!/(^|\/)(\.env|id_rsa|id_ed25519)/.test(x.path)&&/\.(tsx?|jsx?|py|go|rs|java|cs|cpp|c|h|json|ya?ml|md|sql|toml|tf|sh|vue|svelte|rb|php)$|Dockerfile$/.test(x.path));
 const rank=(path:string)=> /(^|\/)(package\.json|tsconfig[^/]*\.json|next\.config\.[^/]+|Dockerfile)$/.test(path)?0:/\.(tsx?|jsx?|py|go|rs|java|cs|cpp|c|h|vue|svelte|rb|php)$/.test(path)?1:/\.md$/.test(path)?3:2;
 let bytes=0;return eligible.sort((a,b)=>rank(a.path)-rank(b.path)||a.path.localeCompare(b.path)).filter(x=>{if(bytes+(x.size||0)>1800000)return false;bytes+=x.size||0;return true;}).slice(0,limit);
}
