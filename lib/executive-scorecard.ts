/**
 * EXEC-01: the original fourteen executive dimensions, without silently
 * converting static-analysis absence into measured health or business value.
 * Snapshot findings are discovery leads. This module makes no external calls
 * and cannot promote a historical task, certify a control, or release a change.
 */
export const EXECUTIVE_METHODOLOGY_VERSION = 'executive-evidence-v1';

type Definition = {
  name: string;
  requiredEvidence: readonly string[];
  methodology: string;
  nextAction: string;
  snapshotCategories: readonly string[];
};

export const EXECUTIVE_DIMENSIONS: readonly Definition[] = [
  {name:'Security', requiredEvidence:['Applicable threat model and control inventory','Executed vulnerability, authorization and secret-handling checks'], methodology:'Evaluate applicable controls and verified findings against the declared threat model; retain critical exposures separately.', nextAction:'Validate the security signals and run authorization and vulnerability checks for the selected project.', snapshotCategories:['Security']},
  {name:'Performance', requiredEvidence:['Representative workload and measurement window','Latency, throughput and resource measurements with baseline'], methodology:'Compare repeated workload measurements with declared latency, throughput and resource targets.', nextAction:'Run a representative workload against a pinned build and record the observed latency and throughput.', snapshotCategories:[]},
  {name:'Architecture', requiredEvidence:['Owned service and dependency boundaries','Executed architecture fitness and change-impact checks'], methodology:'Evaluate documented boundaries, dependency cycles and change impact against the project architecture contract.', nextAction:'Confirm the dependency map and test the boundaries that the project is supposed to enforce.', snapshotCategories:[]},
  {name:'Scalability', requiredEvidence:['Capacity tests across declared load levels','Measured bottlenecks and calibrated headroom'], methodology:'Measure capacity and failure thresholds across load levels; a queueing illustration alone is insufficient.', nextAction:'Measure increasing load and verify the first limiting resource before estimating headroom.', snapshotCategories:[]},
  {name:'Reliability', requiredEvidence:['Service objectives and observation window','Failure, recovery and incident measurements'], methodology:'Evaluate error-budget consumption and reproduced recovery behavior against service objectives.', nextAction:'Define service objectives and reproduce recovery from the failures the project must survive.', snapshotCategories:[]},
  {name:'Maintainability', requiredEvidence:['Change lead time and ownership data','Executed regression and testability measurements'], methodology:'Assess observed change effort, ownership coverage and repeatable regression behavior for a stated period.', nextAction:'Measure a representative change from implementation through review and regression checks.', snapshotCategories:['Code Quality','Testing','Documentation']},
  {name:'Innovation', requiredEvidence:['Problem and competing-solution research','Recorded experiments and validation outcomes'], methodology:'Evaluate validated experiment outcomes and unmet needs; idea count is not novelty, patentability or value.', nextAction:'Attach competing solutions and a measured experiment to the proposed opportunity.', snapshotCategories:[]},
  {name:'Revenue Potential', requiredEvidence:['Authorized demand and unit-economics inputs','Assumptions, uncertainty and validation outcomes'], methodology:'Evaluate evidenced demand and unit economics; forecasts remain hypotheses and are separate from booked revenue.', nextAction:'Connect authorized business evidence and test the assumptions behind a revenue scenario.', snapshotCategories:[]},
  {name:'AI Readiness', requiredEvidence:['Data provenance and permitted tool contracts','Executed model, policy and quality evaluations'], methodology:'Evaluate data rights, tool boundaries and outcome tests; package names and agent counts are insufficient.', nextAction:'Verify data provenance, permitted tool actions and representative model evaluations.', snapshotCategories:[]},
  {name:'Technical Debt', requiredEvidence:['Confirmed debt inventory and ownership','Measured change cost, remediation and recurrence'], methodology:'Track confirmed debt burden with explicit direction (more debt is worse); unfinished markers alone do not measure debt.', nextAction:'Confirm debt items, assign ownership and measure the effort and recurrence of repairs.', snapshotCategories:['Code Quality']},
  {name:'Operational Excellence', requiredEvidence:['Delivery and incident records','Executed runbooks, observability and recovery checks'], methodology:'Evaluate observed operations against owned runbooks and objectives; configuration presence is only a signal.', nextAction:'Reproduce the operating and recovery runbooks and retain the observed outcomes.', snapshotCategories:['DevOps','Observability']},
  {name:'Developer Experience', requiredEvidence:['Measured build and test feedback times','Onboarding and developer-journey findings'], methodology:'Evaluate observed engineering journeys and feedback times, with cohort and measurement window.', nextAction:'Run onboarding and a normal development task, recording time, failures and friction.', snapshotCategories:['Documentation','Testing']},
  {name:'User Experience', requiredEvidence:['Representative user-journey outcomes','Keyboard, assistive-technology and responsive findings'], methodology:'Evaluate task success, usability and accessibility across representative journeys; a static accessibility rule is not a complete UX audit.', nextAction:'Run the critical user journeys by keyboard and assistive technology at representative viewport sizes.', snapshotCategories:['Accessibility']},
  {name:'Business Health', requiredEvidence:['Authorized objective, customer and financial records','Defined reporting period, retention and access controls'], methodology:'Evaluate actual business outcomes against declared objectives; code quality is not a proxy for business health.', nextAction:'Define the business objectives and connect permission-scoped evidence for the reporting period.', snapshotCategories:[]}
];

export type ExecutiveSnapshot = {
  id: string;
  title?: string;
  updatedAt?: string;
  data?: {revision?: number; analysis?: {findings?: unknown; scores?: unknown}};
};

type Finding = {title:string; category:string; file:string; severity:string};
const isFinding = (value: unknown): value is Finding => !!value && typeof value === 'object'
  && ['title','category','file','severity'].every(key => typeof (value as Record<string, unknown>)[key] === 'string');

export function executiveScorecard(project?: ExecutiveSnapshot | null) {
  const source = project && typeof project.id === 'string' && project.id.trim()
    ? {recordId:project.id, title:typeof project.title === 'string' ? project.title : project.id,
       revision:Number.isSafeInteger(project.data?.revision) && Number(project.data?.revision)>0 ? project.data!.revision! : null,
       observedAt:typeof project.updatedAt === 'string' ? project.updatedAt : null,
       kind:'stored-snapshot' as const}
    : null;
  const raw = project?.data?.analysis?.findings;
  const findings = source && Array.isArray(raw) ? raw.filter(isFinding) : [];
  const dimensions = EXECUTIVE_DIMENSIONS.map(definition => {
    const evidence = findings.filter(f => definition.snapshotCategories.includes(f.category)).map(f => ({
      recordId:source!.recordId, snapshotRevision:source!.revision, path:f.file,
      title:f.title, severity:f.severity, kind:'snapshot-signal' as const,
      qualification:'Heuristic source finding; behavior and applicability require verification.'
    }));
    return {
      name:definition.name, value:null, status:'unassessed' as const, coverage:0,
      confidence:'unassessed' as const, methodologyVersion:EXECUTIVE_METHODOLOGY_VERSION,
      methodology:definition.methodology, requiredEvidence:[...definition.requiredEvidence],
      weighting:'No aggregate weight is applied to unassessed dimensions.',
      evidence, criticalFlags:evidence.filter(e => e.severity === 'critical'),
      nextAction:definition.nextAction,
      reason:source ? 'The stored snapshot has no qualified measurements for this dimension.' : 'Select a project and collect the required evidence.'
    };
  });
  return {methodologyVersion:EXECUTIVE_METHODOLOGY_VERSION, source, dimensions,
    assessedDimensions:0, totalDimensions:dimensions.length, weightedCoverage:0,
    overallScore:null, certification:false,
    scope:'Executive measurements remain unassessed until supported by qualified evidence. Snapshot signals are investigation leads, not certifications.'};
}
