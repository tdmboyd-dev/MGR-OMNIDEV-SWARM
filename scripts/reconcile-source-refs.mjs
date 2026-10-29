import {readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
const safe=p=>typeof p==='string'&&p.length>0&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(s=>!s||s==='.'||s==='..')&&!p.includes('\0');
export async function inspectBacklogReferences(root,backlog){
 if(!Array.isArray(backlog?.tasks)||backlog.tasks.length!==174)throw new TypeError('canonical 174 parent tasks required');
 const base=resolve(root),ids=new Set(),tasks=[];
 for(const t of backlog.tasks){
  if(!t.id||ids.has(t.id))throw new Error('duplicate/missing ID');ids.add(t.id);
  const files=[];
  for(const p of t.source_files??[]){
   if(!safe(p)){files.push({path:p,status:'unsafe-reference'});continue;}
   const full=resolve(base,p);
   if(!relative(base,full)||relative(base,full).startsWith('..')){files.push({path:p,status:'unsafe-reference'});continue;}
   try{const info=await stat(full);files.push({path:p,status:info.isFile()?'present-file':info.isDirectory()?'present-directory':'unsupported-type'});}
   catch(e){files.push({path:p,status:e.code==='ENOENT'?'missing-file':'inaccessible',code:e.code??'unknown'});}
  }
  tasks.push({id:t.id,recordedStatus:t.status,refs:files,acceptanceCriteria:(t.acceptance??[]).length,fullAcceptanceCertified:false});
 }
 const refs=tasks.flatMap(t=>t.refs),counts={};
 for(const x of refs)counts[x.status]=(counts[x.status]??0)+1;
 return {contract:'mgr.omnidev.backlog-file-proof.v1',totalParents:tasks.length,parentsWithRefs:tasks.filter(t=>t.refs.length).length,sourceReferenceCount:refs.length,counts,scope:'filesystem existence only, not acceptance/semantic correctness',tasks};
}
if(process.argv[1]&&process.argv[1].endsWith('reconcile-source-refs.mjs')&&process.argv.length>=5){
 const data=JSON.parse(await readFile(process.argv[3],'utf8'));
 const result=await inspectBacklogReferences(process.argv[2],data);
 await writeFile(process.argv[4],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({totalParents:result.totalParents,parentsWithRefs:result.parentsWithRefs,counts:result.counts}));
}
