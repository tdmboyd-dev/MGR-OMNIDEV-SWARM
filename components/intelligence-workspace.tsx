'use client';

import {VoiceInput} from '@/components/voice-input';
import {useState,useEffect,useCallback} from 'react';
import {planningSource} from '@/lib/workspace-planning';
import type {RecordItem} from '@/lib/catalog';
import {DecisionRecord,type DecisionWithHistory} from '@/components/decision-record';

const emptyDecision={title:'',reason:'',alternatives:'',risks:'',expectedOutcome:''};
const labels:Record<string,string>={title:'Title',reason:'Why this decision',alternatives:'Alternatives considered',risks:'Risks',expectedOutcome:'Expected outcome'};

export function SearchEvidenceHit({hit}:{hit:any}) {
  const citation=hit.citation||{},lineage=citation.lineage,source=citation.source,observed=citation.observedSource;
  const decision=lineage?.kind==='decision'||lineage?.kind==='decision-outcome';
  const plan=lineage?.kind==='future-plan'||lineage?.kind==='future-evaluation';
  const version=(value:unknown)=>Number.isSafeInteger(value)?String(value):'not recorded';
  return <article className="panel" style={{overflowWrap:'anywhere'}}>
    <h3>{hit.title}</h3><p style={{whiteSpace:'pre-wrap'}}>{hit.excerpt}</p>
    <small>{hit.kind} · record {citation.recordId||hit.id} · {citation.updatedAt||'Date not recorded'}</small>
    {decision&&<p><b>Decision revision:</b> {version(lineage.revision)}{lineage.previousRevision!==undefined&&<> · previous revision {version(lineage.previousRevision)}</>}</p>}
    {plan&&<p><b>Plan version:</b> {version(lineage.planVersion)} · record revision {version(lineage.revision)}{lineage.horizon&&<> · horizon {lineage.horizon}</>}</p>}
    <details><summary>Source context and limits</summary>
      {source?<><p><b>{decision?'Original decision context:':plan?'Original proposal context:':'Recorded source context:'}</b> project {source.projectId} · snapshot revision {version(source.revision)}</p><p>Saved source ID: <code>{source.sourceDigest||'Not recorded'}</code></p></>:<p>No source version is attached to this search citation.</p>}
      {observed&&<><p><b>Workspace when the observation was recorded:</b> project {observed.projectId} · snapshot revision {version(observed.revision)}</p><p>Observed source ID: <code>{observed.sourceDigest||'Not recorded'}</code></p>
        {source?.sourceDigest&&observed.sourceDigest&&source.sourceDigest!==observed.sourceDigest&&<p>The source changed after the original decision or proposal. Both versions remain attached.</p>}
      </>}
      {lineage?.contractDigest&&<p>Original proposal ID: <code>{lineage.contractDigest}</code></p>}
      {lineage?.previousPlanId&&<p>Earlier plan record: <code>{lineage.previousPlanId}</code></p>}
      <p className="scope-note">{citation.provenance||'This is a stored record citation. Its source version and observation have not been independently verified here.'}</p>
      {hit.limitations&&<p className="scope-note">{hit.limitations}</p>}
    </details>
  </article>;
}

export function IntelligenceWorkspace({project,records=[],onUpdate}:{project?:RecordItem;records?:RecordItem[];onUpdate?:()=>Promise<void>}) {
  const [query,setQuery]=useState(''),[hits,setHits]=useState<any[]>([]),[searched,setSearched]=useState(false);
  const [agents,setAgents]=useState<any[]>([]),[graph,setGraph]=useState<any>(null);
  const [decisions,setDecisions]=useState<DecisionWithHistory[]>([]),[decision,setDecision]=useState(emptyDecision);
  const [editing,setEditing]=useState<DecisionWithHistory|null>(null),[actualOutcome,setActualOutcome]=useState(''),[lessons,setLessons]=useState('');
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
  const [backup,setBackup]=useState<any>(null),[validation,setValidation]=useState<any>(null);
  const projectId=project?.id||'';
  const currentDecision=editing?decisions.find(d=>d.id===editing.id):undefined;
  const staleOutcome=!!editing&&(!currentDecision||currentDecision.data.revision!==editing.data.revision);

  async function request(url:string,p?:any){
    const r=await fetch(url,p?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}:undefined);
    const d:any=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d;
  }
  async function perform(fn:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await fn()}catch(e:any){setError(e.message||'Request failed. Your inputs are still here.')}finally{setBusy(false)}}
  const refresh=useCallback(async()=>{
    const scope=encodeURIComponent(projectId);
    const [agentResult,graphResult,decisionResult]=await Promise.all([
      request('/api/agents'),request('/api/intelligence?projectId='+scope),request('/api/intelligence?action=decisions&projectId='+scope)
    ]);
    setAgents(agentResult.agents);setGraph(graphResult);setDecisions(decisionResult.decisions||[]);
  },[projectId]);
  useEffect(()=>{let current=true;setLoading(true);refresh().catch(e=>{if(current)setError(e.message)}).finally(()=>{if(current)setLoading(false)});return()=>{current=false}},[refresh]);
  const editOutcome=(value:DecisionWithHistory)=>{setEditing(structuredClone(value));setActualOutcome(value.data.actualOutcome||'');setLessons(value.data.lessons||'');setError('');setNotice('')};
  const projectName=(id:string)=>id?(records.find(r=>r.kind==='project'&&r.id===id)?.title||'Project '+id):'Workspace decision';

  return <div className="runtime-workspace">
    {error&&<div className="error-banner" role="alert"><p>{error}</p><button type="button" className="secondary-btn" disabled={busy} onClick={()=>perform(refresh)}>Reload saved records</button></div>}
    {notice&&<p role="status">{notice}</p>}
    <section className="panel runtime-launch" style={{padding:24}}><h2>Evidence search</h2><p>{project?'Searching records for '+project.title+'.':'Searching all workspace records.'} Results cite their source records; they do not prove causation.</p>
      <form onSubmit={e=>{e.preventDefault();perform(async()=>{const result=await request('/api/intelligence?action=search&query='+encodeURIComponent(query)+'&projectId='+encodeURIComponent(projectId));setHits(result.hits);setSearched(true)})}}>
        <label className="field">Search question or keywords<input value={query} onChange={e=>setQuery(e.target.value)} maxLength={500} required/></label><button className="primary-btn" disabled={busy||!query.trim()}>Search evidence</button>
      </form>
      {searched&&!hits.length&&<p role="status">No matching evidence in this selection. Try a different phrase or project.</p>}
      {hits.map(h=><SearchEvidenceHit key={h.id} hit={h}/>)}
    </section>
    <section className="panel runtime-launch" style={{padding:24}}><h2>Unified intelligence graph</h2>{loading?<p role="status">Loading stored relationships…</p>:<p>{graph?.nodes?.length||0} entities · {graph?.edges?.length||0} relationships</p>}<p>{project?'Scope: '+project.title+'.':'Scope: the workspace.'} Includes projects, source entities, findings, memory, decisions and execution records.</p><small>{graph?.scope}</small></section>
    <section className="panel runtime-launch" style={{padding:24}}><h2>Record an architectural decision</h2><p>{project?'This decision will be attached to '+project.title+' and its current stored snapshot.':'This will be a workspace decision with no project attached. Select a project above to link a decision to its source.'}</p>
      <form onSubmit={e=>{e.preventDefault();perform(async()=>{
        const source=project?await planningSource(project,records):undefined;
        await request('/api/intelligence',{action:'decision',...decision,projectId,...(source?{expectedSourceDigest:source.sourceDigest}:{})});
        setDecision(emptyDecision);await refresh();await onUpdate?.();setNotice('Decision saved with its reasoning and source context.');
      })}}>
        {Object.entries(decision).map(([k,v])=><label className="field" key={k}>{labels[k]}<textarea required maxLength={k==='title'?200:5000} value={v} onChange={e=>setDecision({...decision,[k]:e.target.value})}/><VoiceInput value={v} onChange={text=>setDecision(current=>({...current,[k]:text}))} maxLength={k==='title'?200:5000}/></label>)}
        <button className="primary-btn" disabled={busy}>Save decision and reasoning</button>
      </form>
    </section>
    <section className="panel runtime-launch" style={{padding:24}}><h2>Decisions, outcomes and lessons</h2><p>Compare the expected result with what happened. Corrections keep the previous outcome in the history.</p><button type="button" className="secondary-btn" disabled={busy} onClick={()=>perform(refresh)}>Refresh decisions</button>
      {loading?<p role="status">Loading decisions…</p>:!decisions.length&&<p>No structured decisions in this selection yet. Older free-text decision notes remain available in Global memory.</p>}
    </section>
    {editing&&<section className="panel runtime-launch" style={{padding:24}} aria-labelledby="decision-outcome-title">
      <h2 id="decision-outcome-title">Record outcome for {editing.title}</h2><p>{projectName(editing.projectId)} · editing revision {editing.data.revision}</p><p><b>Expected:</b> {editing.data.expectedOutcome}</p>
      {staleOutcome&&<p className="error-banner" role="alert">A newer outcome was saved. Close this form and reopen the decision before recording another observation.</p>}
      <form onSubmit={e=>{e.preventDefault();perform(async()=>{
        if(staleOutcome)throw new Error('Reload and reopen this decision before saving.');
        await request('/api/intelligence',{action:'outcome',id:editing.id,expectedRevision:editing.data.revision,actualOutcome,lessons});
        setEditing(null);await refresh();await onUpdate?.();setNotice('Observed outcome saved. Earlier outcomes remain in the history.');
      })}}>
        <label className="field">Observed outcome<textarea autoFocus value={actualOutcome} onChange={e=>setActualOutcome(e.target.value)} required maxLength={5000} rows={4}/></label>
        <label className="field">What we learned<textarea value={lessons} onChange={e=>setLessons(e.target.value)} required maxLength={5000} rows={4}/></label>
        <div className="modal-actions"><button type="button" className="secondary-btn" disabled={busy} onClick={()=>setEditing(null)}>Close form</button><button className="primary-btn" disabled={busy||staleOutcome||!actualOutcome.trim()||!lessons.trim()}>Save observed outcome</button></div>
      </form>
    </section>}
    {decisions.map(item=><DecisionRecord key={item.id} decision={item} projectTitle={projectName(item.projectId)} onEdit={editOutcome} busy={busy}/>)}
    <section className="panel runtime-launch" style={{padding:24}}><h2>Workspace backup and recovery</h2><p>Exports records and jobs from the whole workspace. Credentials and sessions are excluded. Keep the downloaded file private; it contains your workspace source and history.</p><a className="secondary-btn" href="/api/intelligence?action=backup">Download workspace backup</a>
      <label className="field">Validate a backup<input type="file" accept="application/json,.json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];setBackup(null);setValidation(null);if(!f)return;perform(async()=>{if(f.size>10000000)throw new Error('Backup exceeds 10 MB');const b=JSON.parse(await f.text());const d=await request('/api/intelligence',{action:'validateBackup',backup:b});setBackup(b);setValidation(d.result)})}}/></label>
      {validation&&<><p>Integrity validated: {validation.records} records and {validation.jobs} jobs.</p><button type="button" className="secondary-btn" disabled={busy} onClick={()=>perform(async()=>{await request('/api/intelligence',{action:'restoreBackup',backup});setValidation(null);setBackup(null);await refresh();await onUpdate?.();setNotice('Backup restored. Restored jobs remain canceled.');})}>Restore into empty workspace</button></>}
      <p className="scope-note">Restore refuses to overwrite existing data and cancels restored jobs. Reconnect credentials separately. Large archives require a qualified migration.</p>
    </section>
    <section className="panel runtime-launch" style={{padding:24}}><h2>Agent identities across the workspace</h2><p>Execution jobs have persistent identities, permissions, limits and lifecycle states. Counts do not imply independent expertise or model access.</p><div className="runtime-job-grid">{agents.map(a=><article key={a.id} className="panel"><h3>{a.title}</h3><span className="tag">{a.status}</span><p>{a.data.specialization}</p><small>{a.data.scope}</small></article>)}</div></section>
  </div>;
}
