import {readFile,writeFile} from 'node:fs/promises';
export function auditHistoricalBacklog(backlog,upgrades){
 const tasks=backlog?.tasks,extra=upgrades?.items;
 if(!Array.isArray(tasks)||tasks.length!==174||new Set(tasks.map(x=>x.id)).size!==174)throw new Error('historical 174-ID invariant failed');
 if(!Array.isArray(extra)||extra.length!==28||new Set(extra.map(x=>x.id)).size!==28)throw new Error('28 additive upgrade invariant failed');
 const rows=tasks.map(t=>{
  const refs=t.source_files||[],ev=t.evidence||[];
  const claimed=t.implementation_state||'not-specified';
  const category=claimed.startsWith('partial')?'partial-implementation-reported':claimed.includes('tested')?'implementation-reported':'not-established';
  return {id:t.id,recordedStatus:t.status,claimedImplementation:claimed,category,sourceRefCount:refs.length,existingEvidenceClaims:ev.length,acceptanceCriteria:Array.isArray(t.acceptance)&&t.acceptance.length>0,conclusion:'REQUIRES_ACCEPTANCE_REPRODUCTION',staleStatusCandidate:(claimed!=='not-specified'||refs.length>0||ev.length>0)};
 });
 const countBy=k=>Object.fromEntries([...new Set(rows.map(x=>x[k]))].sort().map(v=>[v,rows.filter(r=>r[k]===v).length]));
 return {schema:'mgr.omnidev.174-review.v1',historicalCount:174,upgradeCount:28,recordedStatuses:countBy('recordedStatus'),reportedImplementations:countBy('category'),withSourceReferences:rows.filter(x=>x.sourceRefCount>0).length,withEvidenceClaims:rows.filter(x=>x.existingEvidenceClaims>0).length,possibleStaleStatuses:rows.filter(x=>x.staleStatusCandidate).length,verifiedComplete:0,note:'Mechanical candidate triage; no acceptance test was executed here; no original status modified.',rows};
}
if(process.argv[1]?.endsWith('/audit-174.mjs')&&process.argv.length>=5){const out=auditHistoricalBacklog(JSON.parse(await readFile(process.argv[2],'utf8')),JSON.parse(await readFile(process.argv[3],'utf8')));await writeFile(process.argv[4],JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({historicalCount:out.historicalCount,upgradeCount:out.upgradeCount,reportedImplementations:out.reportedImplementations,possibleStaleStatuses:out.possibleStaleStatuses}));}
