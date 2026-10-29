import {readFile,writeFile} from 'node:fs/promises';
const patterns=[
 ['isolated-host',/docker|isolat|worker host|container|cold-region|host restart/i],
 ['provider-access',/oauth|authorized|provider|signed.in|api key|account|revoke|refresh|external|real inference/i],
 ['browser-qa',/browser|viewport|assistive|keyboard|screen|without a mouse|hosted user journeys/i],
 ['release-security',/secret|signature|attestation|release|deployment|supply.chain|wrong.target|migration/i],
 ['integration-verification',/multi.project|cross.source|cross.repo|adapter|contract|integration/i],
 ['local-runtime',/retry|concurren|idempoten|rollback|fail|recover|test|durable|duplicate|atomic/i]
];
export function routeAcceptanceWave(wave){
 if(wave?.contract!=='mgr.omnidev.acceptance-wave.v1'||wave.parents!==80||wave.p0!==30||!Array.isArray(wave.items))throw new TypeError('canonical wave expected');
 let count=0;const buckets={};
 const items=wave.items.map(task=>({id:task.id,priority:task.priority,criteria:task.criteria.map(c=>{
  count++;
  if(c.status==='VERIFIED')throw new Error('selector evidence cannot be auto-certified');
  const category=patterns.find(([_,re])=>re.test(c.requirement))?.[0]??'manual-evidence';
  buckets[category]=(buckets[category]??0)+1;
  return {id:c.id,category,status:'AWAITING_CRITERION_VERIFICATION',candidateEvidence:[],blockingGate:category==='local-runtime'?'exact test and review':'qualified '+category+' proof',sourceRequirement:c.requirement};
 })}));
 if(count!==wave.criteria)throw new Error('criteria conservation mismatch');
 return {contract:'mgr.omnidev.acceptance-routing.v1',parents:wave.parents,criteria:count,p0:wave.p0,additional:wave.additional,classification:'HEURISTIC_ONLY_NEVER_ACCEPTANCE_PROOF',bucketCounts:buckets,items};
}
if(process.argv[1]?.endsWith('route-acceptance-work.mjs')&&process.argv.length>=4){
 const wave=JSON.parse(await readFile(process.argv[2],'utf8'));
 const routed=routeAcceptanceWave(wave);await writeFile(process.argv[3],JSON.stringify(routed,null,2)+'\n');
 console.log(JSON.stringify({parents:routed.parents,criteria:routed.criteria,buckets:routed.bucketCounts}));
}
