'use client';

import {useState} from 'react';
import type {RecordItem} from '@/lib/catalog';
import {FUTURE_PLAN_SCHEMA,planningSource,type FutureEvaluation,type PlanHorizon} from '@/lib/workspace-planning';

type EvaluationDraft={plan:RecordItem;horizon:string;sourceDigest:string};
type Props={
  project?:RecordItem;
  records:RecordItem[];
  plans:RecordItem[];
  busy:boolean;
  onAction:(payload:any,message?:string)=>Promise<any>;
  onRefresh:()=>Promise<void>;
  onSelectProject:(id:string)=>void;
};

/** The frozen proposal stays readable next to later observations. */
export function FuturePlanRecord({plan,selectedProjectId,onEvaluate,onSelectProject,busy=false}:{
  plan:RecordItem;selectedProjectId?:string;busy?:boolean;
  onEvaluate:(plan:RecordItem,horizon:string)=>void;onSelectProject:(id:string)=>void;
}) {
  const current=plan.data.schema===FUTURE_PLAN_SCHEMA;
  const horizons:PlanHorizon[]=Array.isArray(plan.data.horizons)?plan.data.horizons:[];
  const evaluations:FutureEvaluation[]=Array.isArray(plan.data.evaluations)?plan.data.evaluations:[];
  const inScope=selectedProjectId===plan.projectId;
  return <section className="roadmap" aria-label={plan.title}>
    <div className="section-toolbar"><h2>{plan.title}</h2><span className="tag violet">{current?'Planning hypothesis':'Earlier template'}</span></div>
    {current&&<p>Plan version {plan.data.version??1} · record revision {plan.data.revision} · {plan.data.source?.projectTitle} · {plan.data.source?.fileCount??0} stored files</p>}
    {!current&&<p className="scope-note">This older template is preserved for reference. Generate a new evidence-based plan to record outcomes against a frozen proposal.</p>}
    <div className="horizon-grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,300px),1fr))",alignItems:"start"}}>{horizons.map((h,i)=><article className="panel horizon" key={h.version} style={{minWidth:0,overflowWrap:'anywhere'}}>
      <div className="horizon-number">{h.version}<span>HORIZON {String(i+1).padStart(2,'0')}</span></div>
      <h3>{h.title}</h3><p>{h.scope}</p>
      {current&&<>
        <p><b>What we are testing:</b> {h.hypothesis}</p>
        <p><b>Success measure:</b> {h.milestone?.measure}</p><p>{h.milestone?.target}</p>
        <details><summary>Evidence, unknowns and experiment</summary>
          <h4>Evidence behind this proposal</h4><ul>{(h.evidence||[]).map((item,j)=><li key={item.recordId+':'+j}>{item.claim}<br/><small>{item.path} · record {item.recordId}{item.disposition?' · '+item.disposition:''}</small></li>)}</ul>
          <h4>Still unknown</h4><ul>{(h.unknowns||[]).map(item=><li key={item}>{item}</li>)}</ul>
          <p><b>Depends on:</b> {h.dependencies?.length?h.dependencies.join(', '):'No earlier horizon'}</p>
          <h4>Tradeoffs</h4><ul>{(h.tradeoffs||[]).map(item=><li key={item}>{item}</li>)}</ul>
          <p><b>Experiment:</b> {h.experiment?.action}</p><p><b>Undo plan:</b> {h.experiment?.rollback}</p><p><b>Stop when:</b> {h.experiment?.stopRule}</p>
          <p><b>Proof to collect:</b> {h.milestone?.evidenceRequired}</p>
          <p className="scope-note">Confidence is unassessed. These are proposed checks, not measured predictions.</p>
        </details>
        <button type="button" className="secondary-btn" disabled={!inScope||busy} onClick={()=>onEvaluate(plan,h.version)} aria-label={'Record outcome for '+h.version+' in '+plan.title}>Record observed outcome</button>
        {evaluations.filter(e=>e.horizon===h.version).map(e=><details key={e.id}>
          <summary>Recorded outcome: {e.conclusion} · {new Date(e.recordedAt).toLocaleString()}</summary>
          <p style={{whiteSpace:'pre-wrap'}}>{e.actualOutcome}</p><p><b>Evidence:</b> {e.evidence}</p>
          <p>{e.verification}</p><p><b>Original proposal preserved:</b> the outcome does not rewrite the hypothesis or its milestone.</p>
          {e.plannedSourceDigest!==e.observedSource?.sourceDigest&&<p className="scope-note">The project changed between the proposal and this observation. The outcome retains both source versions.</p>}
          <small>Observed project: {e.observedSource?.projectTitle} · source {e.observedSource?.sourceDigest}</small>
        </details>)}
      </>}
    </article>)}</div>
    {current&&!inScope&&<button type="button" className="secondary-btn" style={{whiteSpace:"normal"}} disabled={busy} onClick={()=>onSelectProject(plan.projectId)}>Select this project to record outcomes</button>}
    <p className="scope-note">{plan.data.method}</p>
    {current&&<details><summary>Proposal source and retained dispositions</summary><p>{plan.data.source?.coverage}</p><p style={{overflowWrap:'anywhere'}}>Source: {plan.data.source?.sourceDigest}<br/>Proposal: {plan.data.contractDigest}</p>
      {plan.data.excludedFindings?.length?<ul>{plan.data.excludedFindings.map((f:any)=><li key={f.recordId}>{f.title} · {f.status}. {f.reason}</li>)}</ul>:<p>No accepted or resolved findings were excluded when this plan was created.</p>}
    </details>}
  </section>;
}

export function FuturePlanningWorkspace({project,records,plans,busy,onAction,onRefresh,onSelectProject}:Props) {
  const [error,setError]=useState('');
  const [working,setWorking]=useState(false);
  const [evaluation,setEvaluation]=useState<EvaluationDraft|null>(null);
  const [outcome,setOutcome]=useState('');
  const [evidence,setEvidence]=useState('');
  const [conclusion,setConclusion]=useState<'supported'|'inconclusive'|'invalidated'>('inconclusive');
  const currentPlan=evaluation?records.find(r=>r.id===evaluation.plan.id):undefined;
  const stale=!!evaluation&&(!currentPlan||currentPlan.data.revision!==evaluation.plan.data.revision||currentPlan.data.contractDigest!==evaluation.plan.data.contractDigest||project?.id!==evaluation.plan.projectId);
  async function run(fn:()=>Promise<void>){setWorking(true);setError('');try{await fn()}catch(e:any){setError(e.message||'The request could not be saved. Your inputs are still here.')}finally{setWorking(false)}}
  async function openEvaluation(plan:RecordItem,horizon:string){
    await run(async()=>{if(!project||project.id!==plan.projectId)throw new Error('Select the project that owns this plan first.');
      const source=await planningSource(project,records);
      setEvaluation({plan:structuredClone(plan),horizon,sourceDigest:source.sourceDigest});setOutcome('');setEvidence('');setConclusion('inconclusive');
    });
  }
  return <>
    <section className="future-intro panel"><span className="panel-kicker">FUTURE STATE ENGINE</span><h2>Turn a project finding into a testable next move.</h2>
      <p>Each proposal keeps the source it used, what remains unknown, a success measure, and a way to undo the experiment. Record what actually happens alongside the original proposal.</p>
      <p>{project?'Selected project: '+project.title:'Choose a project above to create its plan. All projects is a browsing view.'}</p>
      <button type="button" className="primary-btn" disabled={!project||busy||working} onClick={()=>run(async()=>{
        if(!project)return;const source=await planningSource(project,records);
        await onAction({action:'future',projectId:project.id,expectedSourceDigest:source.sourceDigest},'Evidence-based proposal saved');
      })}>Generate evidence-based plan</button>
    </section>
    {error&&<div className="error-banner" role="alert"><p>{error}</p><button type="button" className="secondary-btn" disabled={working} onClick={()=>run(onRefresh)}>Refresh saved data</button></div>}
    {evaluation&&<section className="panel runtime-launch" style={{padding:24,marginBottom:24}} aria-labelledby="future-evaluation-title">
      <h2 id="future-evaluation-title">Record {evaluation.horizon} outcome for {evaluation.plan.title}</h2>
      <p>Original plan revision {evaluation.plan.data.revision}. Record evidence and your conclusion; this does not certify a forecast or authorize a release.</p>
      {stale&&<p className="error-banner" role="alert">This plan changed while the form was open. Close this form and reopen the latest plan before saving.</p>}
      <form onSubmit={e=>{e.preventDefault();run(async()=>{
        if(stale)throw new Error('Close and reopen the latest plan before saving.');
        await onAction({action:'evaluateFuture',id:evaluation.plan.id,horizon:evaluation.horizon,expectedRevision:evaluation.plan.data.revision,expectedPlanDigest:evaluation.plan.data.contractDigest,expectedSourceDigest:evaluation.sourceDigest,conclusion,actualOutcome:outcome,evidence},'Observed outcome saved; original proposal retained');
        setEvaluation(null);
      })}}>
        <label className="field">Conclusion<select className="picker" value={conclusion} onChange={e=>setConclusion(e.target.value as typeof conclusion)}><option value="inconclusive">Inconclusive — more evidence needed</option><option value="supported">Supported by this observation</option><option value="invalidated">Invalidated by this observation</option></select></label>
        <label className="field">What actually happened<textarea autoFocus value={outcome} onChange={e=>setOutcome(e.target.value)} maxLength={5000} required rows={4}/></label>
        <label className="field">Evidence and measurement details<textarea value={evidence} onChange={e=>setEvidence(e.target.value)} maxLength={5000} required rows={4} placeholder="Include the run, date, source version, measurements or research records. Note any limits."/></label>
        <div className="modal-actions"><button type="button" className="secondary-btn" disabled={working} onClick={()=>setEvaluation(null)}>Close form</button><button className="primary-btn" disabled={stale||working||busy||!outcome.trim()||!evidence.trim()}>Save observed outcome</button></div>
      </form>
    </section>}
    {plans.length?plans.map(plan=><FuturePlanRecord key={plan.id} plan={plan} selectedProjectId={project?.id} onEvaluate={openEvaluation} onSelectProject={onSelectProject} busy={busy||working}/>):<section className="panel runtime-launch" style={{padding:24,marginBottom:24}}><h3>No saved proposals in this view</h3><p>Select an imported project to create a V2, V3, V5 and V10 sequence with explicit evidence and unknowns.</p></section>}
  </>;
}
