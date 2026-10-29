import type {RecordItem} from './catalog';

export const FUTURE_PLAN_SCHEMA='omnidev-future-plan-v1';
export const FUTURE_METHOD='Evidence-based planning hypotheses from the stored snapshot and current finding dispositions. No live measurements, market research, model forecast or production verification has run.';
export const findingKey=(finding:{title:string;file:string})=>finding.title+'\n'+finding.file;
const severityOrder:Record<string,number>={critical:0,high:1,medium:2,low:3};
const byId=(a:{id:string},b:{id:string})=>a.id<b.id?-1:a.id>b.id?1:0;

export async function planningDigest(value:unknown) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}

/** Manual dispositions are retained; a finding is a lead, not a proven defect. */
export function rankCurrentFindings(records:RecordItem[], projectId?:string) {
  return records.filter(r=>r.kind==='finding'&&(!projectId||r.projectId===projectId)
    && ['open','in review'].includes(r.status)&&!r.data.snapshotResolved)
    .slice().sort((a,b)=>(severityOrder[a.data.severity]??4)-(severityOrder[b.data.severity]??4)
      || (a.status==='in review'?1:0)-(b.status==='in review'?1:0)
      || a.title.localeCompare(b.title)||byId(a,b));
}

export function projectRecommendations(records:RecordItem[],projectId?:string) {
  return rankCurrentFindings(records,projectId).map(f=>({
    id:f.id,projectId:f.projectId,title:f.title,status:f.status,severity:f.data.severity,
    rationale:'Prioritized by '+String(f.data.severity||'unknown')+' severity; '+f.status+' disposition. Confirm this heuristic against the cited source.',
    nextAction:typeof f.data.remediation==='string'?f.data.remediation:'Inspect the source and define a reproducible check.',
    evidence:{recordId:f.id,path:f.data.file,claim:f.data.evidence,updatedAt:f.updatedAt},
    qualification:'Snapshot signal; no automatic repair or confirmed vulnerability.'
  }));
}

/** One browser/server contract binds source, analyzer state and manual dispositions. */
export async function planningSource(project:RecordItem, records:RecordItem[]) {
  if(!project||project.kind!=='project'||!project.id||!Array.isArray(project.data?.files))throw new Error('Select an imported project');
  const findings=records.filter(r=>r.kind==='finding'&&r.projectId===project.id).sort(byId);
  const findingState=findings.map(r=>({id:r.id,title:r.title,status:r.status,data:r.data}));
  const snapshotDigest=await planningDigest(project.data.files);
  const findingDigest=await planningDigest(findingState);
  const sourceDigest=await planningDigest({projectId:project.id,title:project.title,data:project.data,findings:findingState});
  return {
    projectId:project.id,projectTitle:project.title,
    revision:Number.isSafeInteger(project.data.revision)?project.data.revision:0,
    observedAt:project.updatedAt,snapshotDigest,findingDigest,sourceDigest,
    fileCount:project.data.files.length,
    paths:project.data.files.map((file:{path:string})=>file.path).sort() as string[],
    coverage:project.data.origin?.partial
      ? 'Partial imported snapshot; absence is not proof of a repository-wide gap.'
      : 'Stored snapshot only; repository completeness and runtime behavior are not verified.'
  };
}
export type PlanningSource=Awaited<ReturnType<typeof planningSource>>;
export type PlanEvidence={recordId:string;path:string;claim:string;kind:'snapshot-signal'|'snapshot-scope';sourceDigest:string;snapshotDigest:string;disposition?:string};
export type PlanHorizon={
  version:string;title:string;scope:string;hypothesis:string;
  evidence:PlanEvidence[];unknowns:string[];dependencies:string[];tradeoffs:string[];
  milestone:{measure:string;target:string;evidenceRequired:string};
  experiment:{action:string;rollback:string;stopRule:string};
  confidence:'unassessed';
};

export async function buildFuturePlan(project:RecordItem,records:RecordItem[]) {
  const source=await planningSource(project,records);
  const current=rankCurrentFindings(records,project.id);
  const cited=(categories:string[]):PlanEvidence[]=>current.filter(f=>categories.includes(f.data.category)).slice(0,12).map(f=>({
    recordId:f.id,path:f.data.file,claim:f.data.evidence||f.title,
    kind:'snapshot-signal',sourceDigest:source.sourceDigest,snapshotDigest:source.snapshotDigest,disposition:f.status
  }));
  const snapshot=(purpose:string):PlanEvidence=>({
    recordId:project.id,path:source.paths.slice(0,6).join(', ')||'Empty snapshot',
    claim:project.title+' contains '+source.fileCount+' stored files. '+purpose,
    kind:'snapshot-scope',sourceDigest:source.sourceDigest,snapshotDigest:source.snapshotDigest
  });
  const trust=cited(['Security','Testing','Accessibility','Code Quality']);
  const operations=cited(['Documentation','DevOps','Observability']);
  const scope=(items:PlanEvidence[],fallback:string)=>items.length
    ? items.length+' current source signal(s) in '+project.title+': '+items.map(e=>e.path).filter((p,i,a)=>a.indexOf(p)===i).join(', ')+'.'
    : fallback+' for '+project.title+'.';
  const horizons:PlanHorizon[]=[
    {
      version:'V2',title:'Test the trust gaps',scope:scope(trust,'Establish the missing behavior and security baseline'),
      hypothesis:'Validating and addressing confirmed source signals may reduce avoidable failures in '+project.title+'.',
      evidence:[snapshot('Static findings guide checks; they do not establish application correctness.'),...trust],
      unknowns:[source.coverage,'Exploitability, critical user journeys and executed behavior tests remain unverified.'],
      dependencies:[],tradeoffs:['Confirm applicability before changing code; broader scans cost more time and may produce false positives.'],
      milestone:{measure:'Disposition and regression evidence for each cited trust signal',target:trust.length?trust.length+' of '+trust.length+' cited signals confirmed, dismissed with evidence, or explicitly accepted; zero unreviewed signals.':'Record at least one critical user journey and an executed success and failure check.',
        evidenceRequired:'Pinned source revision, relevant test command, actual output, finding disposition and reviewer.'},
      experiment:{action:'Validate the cited signals in an isolated copy of '+project.title+'; change one confirmed behavior at a time.',
        rollback:'Retain the baseline snapshot and discard the candidate if its regression checks fail.',
        stopRule:'Stop before applying a candidate if a critical check fails, evidence is missing, or the source digest changes.'},
      confidence:'unassessed'
    },
    {
      version:'V3',title:'Rehearse operations',scope:scope(operations,'Collect delivery, observability and recovery evidence'),
      hypothesis:'A rehearsed delivery and recovery path may reduce operational uncertainty for '+project.title+'.',
      evidence:[snapshot('Configuration presence does not prove a working pipeline, monitoring or recovery.'),...operations],
      unknowns:[source.coverage,'Deployment ownership, recovery objectives and live service measurements are not recorded here.'],
      dependencies:['V2'],tradeoffs:['A narrow rehearsal is reversible but does not establish production reliability.'],
      milestone:{measure:'Repeatable operating and recovery rehearsal',target:'Record one successful rehearsal and one induced failure/recovery result for the selected project.',
        evidenceRequired:'Environment, source revision, runbook steps, observed outputs, recovery time and operating owner.'},
      experiment:{action:'Rehearse one delivery or recovery runbook for '+project.title+' in an owner-approved test environment.',
        rollback:'Restore the preserved test baseline and remove only resources created by the rehearsal.',
        stopRule:'Stop if the test would touch production, lacks an owner or exceeds its declared resource budget.'},
      confidence:'unassessed'
    },
    {
      version:'V5',title:'Measure a scaling option',scope:'Measure a representative workload against the '+source.fileCount+'-file snapshot of '+project.title+'.',
      hypothesis:'One measured bottleneck may justify a reversible capacity change for '+project.title+'; no bottleneck is inferred from file count.',
      evidence:[snapshot('No workload trace, capacity measurement or calibrated staging outcome is available to this planner.')],
      unknowns:['Traffic distribution, latency targets, database limits and provider costs need measured inputs.',source.coverage],
      dependencies:['V2','V3'],tradeoffs:['More capacity can increase cost without fixing the actual limiting resource.'],
      milestone:{measure:'Repeatability and comparison against a declared baseline',target:'Record three repeated baseline measurements and three candidate measurements under the same declared workload.',
        evidenceRequired:'Source revisions, workload, environment, latency/throughput/resource observations and measurement spread.'},
      experiment:{action:'Measure '+project.title+' in an isolated staging environment, then change one resource or code path within an owner-set budget.',
        rollback:'Revert the one changed variable and restore the baseline configuration.',
        stopRule:'Stop if correctness regresses, the declared cost/latency limit is exceeded, or the workloads are not comparable.'},
      confidence:'unassessed'
    },
    {
      version:'V10',title:'Test a product opportunity',scope:'Evaluate one customer problem related to '+project.title+' before funding a product expansion.',
      hypothesis:'A documented unmet need may support a small product experiment; revenue and demand for '+project.title+' are unknown.',
      evidence:[snapshot('Source code does not establish demand, novelty, market size or revenue.')],
      unknowns:['No authorized customer research, competing-solution comparison or revenue observations were supplied.',source.coverage],
      dependencies:['V2'],tradeoffs:['A small research prototype limits commitment but cannot validate a full business model.'],
      milestone:{measure:'Problem evidence and a predeclared experiment result',target:'Record three independent problem observations, one competing-solution comparison, and one experiment against a success threshold chosen before it runs.',
        evidenceRequired:'Permitted research sources, dated observations, experiment method, result and known confounders.'},
      experiment:{action:'Document one reversible prototype or research experiment for '+project.title+' with its owner and explicit success threshold.',
        rollback:'Retire the prototype and preserve only permitted research records.',
        stopRule:'Stop expansion if demand evidence is absent, the declared threshold fails, consent is missing, or the experiment exceeds its approved budget.'},
      confidence:'unassessed'
    }
  ];
  const excludedFindings=records.filter(r=>r.kind==='finding'&&r.projectId===project.id&&['resolved','accepted risk'].includes(r.status))
    .sort(byId).map(r=>({recordId:r.id,title:r.title,status:r.status,reason:'Existing disposition retained; this plan does not reopen it or claim a verified repair.'}));
  const contract={schema:FUTURE_PLAN_SCHEMA,source,horizons,excludedFindings,method:FUTURE_METHOD};
  return {...contract,contractDigest:await planningDigest(contract),gapCount:current.length,revision:1,evaluations:[] as FutureEvaluation[]};
}

export type FutureEvaluation={
  id:string;horizon:string;conclusion:'supported'|'inconclusive'|'invalidated';
  actualOutcome:string;evidence:string;recordedAt:string;recordedBy:string;
  plannedSourceDigest:string;observedSource:PlanningSource;verification:string;
};
export function futureEvaluation(input:any,plan:ReturnType<typeof JSON.parse>,observedSource:PlanningSource):FutureEvaluation {
  if(plan.schema!==FUTURE_PLAN_SCHEMA)throw new Error('This legacy template needs a new evidence-based plan before evaluation');
  if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision!==plan.revision)throw new Error('Plan changed; reload before recording an outcome');
  if(input.expectedPlanDigest!==plan.contractDigest)throw new Error('Plan evidence changed; reload before recording an outcome');
  if(!plan.horizons.some((h:PlanHorizon)=>h.version===input.horizon))throw new Error('Unknown planning horizon');
  if(!['supported','inconclusive','invalidated'].includes(input.conclusion))throw new Error('Choose a supported, inconclusive or invalidated outcome');
  for(const field of ['actualOutcome','evidence'])if(typeof input[field]!=='string'||!input[field].trim()||input[field].length>5000)throw new Error('Outcome requires bounded '+field);
  if(!Array.isArray(plan.evaluations)||plan.evaluations.length>=100)throw new Error('This plan has reached its evaluation limit; create a new version');
  return {id:crypto.randomUUID(),horizon:input.horizon,conclusion:input.conclusion,actualOutcome:input.actualOutcome.trim(),evidence:input.evidence.trim(),
    recordedAt:new Date().toISOString(),recordedBy:'workspace-owner',plannedSourceDigest:plan.source.sourceDigest,observedSource,
    verification:'Owner-recorded observation and evidence references; not an independently verified forecast or release approval.'};
}
