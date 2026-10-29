import {readFile,writeFile} from 'node:fs/promises';
export function selectAcceptanceWave(backlog,register,{p0Count=30,additionalCount=50}={}){
 const tasks=backlog?.tasks,entries=register?.tasks;
 if(!Array.isArray(tasks)||tasks.length!==174||!Array.isArray(entries)||entries.length!==174)throw new TypeError('canonical 174 tasks and evidence register required');
 const p0=tasks.filter(t=>t.priority==='P0'),remaining=tasks.filter(t=>t.priority!=='P0');
 if(p0.length!==p0Count||remaining.length<additionalCount)throw new Error('priority universe changed');
 const selected=[...p0,...remaining.slice(0,additionalCount)],indexed=new Map(entries.map(x=>[x.id,x]));
 if(indexed.size!==174)throw new Error('evidence ID collision');
 return {contract:'mgr.omnidev.acceptance-wave.v1',parents:selected.length,p0:p0.length,additional:additionalCount,criteria:selected.reduce((n,t)=>n+t.acceptance.length,0),selection:'all P0 then 50 non-P0 in canonical order',complete:0,items:selected.map(t=>{
  const source=indexed.get(t.id);
  if(!source||source.acceptance?.length!==t.acceptance.length)throw new Error('evidence drift: '+t.id);
  for(let i=0;i<t.acceptance.length;i++)if(source.acceptance[i]?.requirement!==t.acceptance[i])throw new Error('acceptance text drift: '+t.id);
  return {id:t.id,priority:t.priority,status:t.status,criteria:source.acceptance.map(c=>({id:c.criterionId,status:c.status,requirement:c.requirement,sourceCommit:c.sourceCommit,evidence:c.evidence})),fullAcceptance:'NOT_CERTIFIED'};
 })};
}
if(process.argv[1]?.endsWith('select-acceptance-wave.mjs')&&process.argv.length>=5){
 const a=JSON.parse(await readFile(process.argv[2],'utf8')),b=JSON.parse(await readFile(process.argv[3],'utf8'));
 const out=selectAcceptanceWave(a,b);
 await writeFile(process.argv[4],JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({parents:out.parents,p0:out.p0,additional:out.additional,criteria:out.criteria,complete:out.complete}));
}
