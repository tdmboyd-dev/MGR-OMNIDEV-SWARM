import {readFile,stat,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * A mechanical evidence census, NOT automatic certification of completion.
 * The 174 historical statuses remain untouched; this is an additive, diffable
 * audit with exact missing paths and current code/evidence signal coverage.
 */
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const backlog=JSON.parse(await readFile(join(root,'UNFINISHED-WORK/backlog.json'),'utf8'));
if(backlog.tasks.length!==174||new Set(backlog.tasks.map(x=>x.id)).size!==174)throw Error('Canonical 174-parent ledger mismatch');
const safePath=async path=>{
  if(typeof path!=='string'||path.startsWith('/')||path.includes('\\')||path.split('/').includes('..'))return {exists:false,reason:'unsafe-reference'};
  try{const f=await stat(join(root,path));return {exists:f.isFile(),reason:f.isFile()?'present':'not-a-file'};}
  catch(e){return {exists:false,reason:e?.code||'unavailable'};}
};
const output=[];
for(const task of backlog.tasks){
  const src=await Promise.all((task.source_files||[]).map(async path=>({path,...await safePath(path)})));
  const evidence=await Promise.all((task.evidence||[]).filter(x=>typeof x==='string'&&!x.includes('://')).map(async path=>({path,...await safePath(path)})));
  output.push({
    id:task.id,title:task.title,priority:task.priority,recorded_status:task.status,
    source_evidence:src,recorded_evidence:evidence,
    evidence_state:src.some(x=>x.exists)?'SOURCE_REFERENCES_PRESENT':'NO_SOURCE_REFERENCE_CONFIRMED',
    acceptance_review:'NOT_YET_REPRODUCED',
    // Exception is corroborated by completed GitHub transfer, but draft-PR and release
    // acceptance remain independent. Never close without evaluating actual acceptance.
    stale_record_candidate:task.id==='REL-02',
    next_action:'Inspect implementation and tests, reproduce full acceptance gates, update verified status with receipts'
  });
}
const dir=join(root,'UNFINISHED-WORK');
const report={generated_at:new Date().toISOString(),baseline_source_commit:backlog.baseline_source_commit,
  note:'Source path census only. An existing source file or past fixture is NOT acceptance proof.',
  count:output.length,source_reference_count:output.filter(x=>x.source_evidence.some(f=>f.exists)).length,
  missing_source_reference_count:output.filter(x=>x.source_evidence.some(f=>!f.exists)).length,
  tasks:output};
await writeFile(join(dir,'mgr-174-source-reconciliation.json'),JSON.stringify(report,null,2)+'\n');
const summary=[
  '# OmniDev 174-task mechanical source reconciliation',
  '',
  `Generated: ${report.generated_at}`,
  '',
  `Historical parent IDs accounted for: **${report.count}/174**`,
  '',
  `Tasks with at least one existing source reference: **${report.source_reference_count}**`,
  '',
  `Tasks containing at least one missing source reference: **${report.missing_source_reference_count}**`,
  '',
  'No item has been certified complete by this check. Recorded statuses are untouched.',
  '',
  '| ID | Priority | Original state | Existing refs | Missing source refs | Next gate |',
  '| --- | --- | --- | ---: | ---: | --- |',
  ...output.map(t=>`| ${t.id} | ${t.priority} | ${t.recorded_status} | ${t.source_evidence.filter(x=>x.exists).length} | ${t.source_evidence.filter(x=>!x.exists).length} | Reproduce acceptance |`),
  '',
  'The `REL-02` historical GitHub publication flag needs source-backed reclassification, but unrelated owner approval and draft-PR gates remain open until proven.',
  ''
];
await writeFile(join(dir,'mgr-174-source-reconciliation.md'),summary.join('\n'));
console.log(JSON.stringify({parents:report.count,withSource:report.source_reference_count,withMissingReferences:report.missing_source_reference_count}));
