import type {RecordItem} from '@/lib/catalog';

export type DecisionWithHistory=RecordItem&{history?:RecordItem[]};

/** Display the expected result and the later observation as separate facts. */
export function DecisionRecord({decision,projectTitle,onEdit,busy=false}:{
  decision:DecisionWithHistory;projectTitle:string;onEdit:(decision:DecisionWithHistory)=>void;busy?:boolean;
}) {
  const data=decision.data;
  return <article className="panel runtime-launch" style={{minWidth:0,overflowWrap:'anywhere',padding:24}}>
    <h3>{decision.title}</h3><p>{projectTitle} · revision {data.revision} · {decision.status}</p>
    <p><b>Expected outcome:</b> {data.expectedOutcome}</p>
    <p><b>Observed outcome:</b> {data.actualOutcome||'No outcome recorded yet.'}</p>
    <p><b>Lesson learned:</b> {data.lessons||'Awaiting an observation.'}</p>
    <details><summary>Reasoning and source</summary>
      <p><b>Why:</b> {data.reason}</p><p><b>Alternatives:</b> {data.alternatives}</p><p><b>Risks:</b> {data.risks}</p>
      {data.source?<><p>Project snapshot: {data.source.projectTitle}</p><p>Source: {data.source.sourceDigest}</p><p>{data.source.coverage}</p></>:<p>This decision has no project snapshot attached.</p>}
    </details>
    <button type="button" className="secondary-btn" disabled={busy} onClick={()=>onEdit(decision)} aria-label={'Record observed outcome for '+decision.title}>{data.actualOutcome?'Record an outcome correction':'Record observed outcome'}</button>
    <p className="scope-note">These are owner-recorded observations and lessons. Saving a result does not independently verify it or authorize a release.</p>
    {!!decision.history?.length&&<details><summary>Preserved outcome history ({decision.history.length})</summary>
      {decision.history.map(record=><section key={record.id} style={{borderTop:'1px solid var(--border)',paddingTop:12}}>
        <h4>Revision {record.data.previous?.revision} → {record.data.next?.revision}</h4>
        <p><b>Earlier outcome:</b> {record.data.previous?.actualOutcome||'No outcome recorded'}</p><p><b>Earlier lesson:</b> {record.data.previous?.lessons||'No lesson recorded'}</p>
        <p><b>Recorded outcome:</b> {record.data.next?.actualOutcome}</p><p><b>Recorded lesson:</b> {record.data.next?.lessons}</p><small>{new Date(record.createdAt).toLocaleString()}</small>
      </section>)}
    </details>}
  </article>;
}
