export function explainJobError(message:string){if(/invalid candidate contract/i.test(message))return 'The brain returned proposed changes in a format OmniDev could not accept. Inspect the saved response; it has not been applied.';if(/potential credential/i.test(message))return 'A proposed change may contain a password or key. OmniDev blocked it; inspect and remove the sensitive value before recovery.';if(/local.*(operation|session)|companion operation/i.test(message))return 'The engine was busy or disconnected. Completed reviews remain saved. Reconnect and resume the original scan.';return message;}
export function jobPresentation(job:any,observed:any=null){
 const local=observed?.jobs?.find((x:any)=>x.id===job.id),active=observed?.jobs?.filter((x:any)=>x.status==='running')||[];
 if(local?.status==='running')return {label:'Working',detail:'Your engine is generating proposed changes.',active:true};
 if(job.status==='queued'&&local?.status==='completed')return {label:'Result ready',detail:'The engine finished. Open this job to recover its saved result.',active:false};
 if(active.length&&['queued','awaiting review','running'].includes(job.status))return {label:'Working',detail:active.length+' specialist requests running. Open progress to see assignments.',active:true};
 const c=job.result?.reviewPlan?.control;
 if(c?.status==='paused')return {label:'Paused',detail:'Completed work is saved. Press Continue when you are ready.',active:false};
 if(c?.status==='stopped')return {label:'Stopped',detail:'No new specialist requests will start.',active:false};
 if(job.result?.reviewError)return {label:'Needs attention',detail:explainJobError(job.result.reviewError),active:false};
 const map:any={'queued':['Ready to start','This job is saved. Engine status is checked separately.'],'running':['Working','The hosted worker is processing this job.'],'awaiting review':['Ready for review','Inspect the findings and proposed file changes.'],'applied':['Saved to project','Changes were saved to your project copy. They were not deployed.'],'failed':['Needs attention',job.result?.error?explainJobError(job.result.error):'Open this job to see the failure and recovery options.'],'canceled':['Canceled','This job will not start more work.'],'rejected':['Rejected','The proposed changes were not applied.']};
 const [label,detail]=map[job.status]||[job.status,'Open this job for details'];return {label,detail,active:job.status==='running'};
}
export function groupCapabilityGaps(gaps:any[]){
 const groups=new Map<string,any>();
 for(const gap of gaps){
  const kind=gap.data?.kind||'other',text=(gap.title+' '+(gap.data?.needed||'')).toLowerCase();
  const evidenceGap=kind==='specialist-reported-gap'&&/(not (provided|supplied|available|included)|missing.*(source|implementation|manifest|lockfile)|only.*(documentation|markdown)|cannot.*(verify|inspect).*source|source.*(absent|unavailable)|no.*(source code|implementation files))/.test(text);
  const key=evidenceGap?'source-evidence':kind+'|'+gap.title+'|'+(gap.data?.needed||'');
  const existing=groups.get(key);
  if(existing){existing.items.push(gap);existing.projects.add(gap.projectId);}
  else groups.set(key,{key,title:evidenceGap?'Application source needed to verify specialist findings':gap.title,needed:evidenceGap?'These reports describe unavailable evidence in supplied source batches. Inspect the repository coverage and provide the referenced implementation files; this does not automatically mean a new specialist is needed.':gap.data?.needed,kind:evidenceGap?'source-evidence':kind,items:[gap],projects:new Set([gap.projectId])});
 }
 return [...groups.values()].map(g=>({...g,projects:[...g.projects]}));
}
