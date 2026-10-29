import assert from 'node:assert/strict';
import {test,beforeEach,after} from 'node:test';
import {openStore,closeStore,database,environment,store,workspace,planning,post,source,snapshot,importProject,makePlan,writeProject,cleanFiles} from './workspace-fixture.mjs';
const {selectedProject,scopeFindings,findingSummary}=await import('../.test-runtime/workspace-scope.mjs');
beforeEach(openStore);after(closeStore);
const rescan=async id=>post({action:'rescan',projectId:id,expectedSourceDigest:(await source(id)).sourceDigest});

test('simulation rejects dangling, wrong-kind and aggregate project references without corrupting backups',async()=>{
  const p=await importProject();const finding=(await store.list()).find(r=>r.kind==='finding');const before=snapshot();
  for(const projectId of ['missing-project',finding.id,'all',false,{}]){
    const result=await post({action:'simulate',projectId,traffic:100,capacity:500,latency:80,cost:45,replicas:2});
    assert.equal(result.status,400);assert.deepEqual(snapshot(),before);
  }
  assert.equal(p.kind,'project');
});

test('simulation records owner assumptions and the actual selected snapshot; a workspace scenario stays unassigned',async()=>{
  const p=await importProject();const expected=await source(p.id);
  const result=await post({action:'simulate',projectId:p.id,expectedSourceDigest:expected.sourceDigest,traffic:600,capacity:500,latency:80,cost:45,replicas:2});
  assert.equal(result.status,200);
  const saved=result.data.records.find(r=>r.id===result.data.id);
  assert.equal(saved.projectId,p.id);assert.equal(saved.data.source.snapshotDigest,expected.snapshotDigest);
  assert.match(saved.data.inputProvenance,/owner-entered/i);assert.match(saved.data.assumption,/not a measured/i);
  const unassigned=await post({action:'simulate',projectId:'',traffic:1,capacity:2,latency:3,cost:4,replicas:1});
  assert.equal(unassigned.status,200);assert.equal(unassigned.data.records.find(r=>r.id===unassigned.data.id).projectId,'');
});

test('stale simulation context and project deletion during admission cannot create an orphan record',async()=>{
  const p=await importProject();const expected=await source(p.id);
  await writeProject(p.id,data=>data.files.push({path:'new.ts',content:'changed'}));const before=snapshot();
  assert.equal((await post({action:'simulate',projectId:p.id,expectedSourceDigest:expected.sourceDigest,traffic:1,capacity:2,latency:3,cost:4,replicas:1})).status,400);
  assert.deepEqual(snapshot(),before);
  const fresh=await source(p.id),batch=environment.DB.batch;
  environment.DB.batch=async statements=>{database().prepare('DELETE FROM records WHERE id=? OR project_id=?').run(p.id,p.id);return batch(statements);};
  assert.equal((await post({action:'simulate',projectId:p.id,expectedSourceDigest:fresh.sourceDigest,traffic:1,capacity:2,latency:3,cost:4,replicas:1})).status,400);
  assert.equal(database().prepare("SELECT count(*) n FROM records WHERE kind='simulation'").get().n,0);
});

test('rescan reconciles stale and new findings, preserves manual dispositions and does not duplicate current signals',async()=>{
  const p=await importProject();const current=(await store.list()).filter(r=>r.kind==='finding');
  const accepted=current.find(r=>r.title==='Dynamic code execution');
  await post({action:'finding',id:accepted.id,status:'accepted risk'});
  await writeProject(p.id,data=>{data.files[0].content='eval("unsafe");\n// TODO: finish validation';});
  const result=await rescan(p.id);assert.equal(result.status,200);
  const rows=result.data.records.filter(r=>r.kind==='finding');
  const sql=rows.find(r=>r.title==='Possible SQL injection path');assert.equal(sql.status,'resolved');assert.equal(sql.data.snapshotResolved,true);
  assert.equal(rows.find(r=>r.id===accepted.id).status,'accepted risk');
  assert.ok(rows.some(r=>r.title==='Unfinished implementation marker'&&r.status==='open'));
  const identities=rows.map(r=>r.id).sort();
  assert.equal((await rescan(p.id)).status,200);
  assert.deepEqual((await store.list()).filter(r=>r.kind==='finding').map(r=>r.id).sort(),identities);
});

test('rescan reopens a signal that returns after snapshot resolution without reopening a manual acceptance',async()=>{
  const p=await importProject();let rows=await store.list();const docs=rows.find(r=>r.title==='No tests in imported snapshot');
  await writeProject(p.id,data=>data.files.push({path:'tests/orders.test.ts',content:'test("orders",()=>{})'}));
  assert.equal((await rescan(p.id)).status,200);assert.equal((await store.list()).find(r=>r.id===docs.id).status,'resolved');
  await writeProject(p.id,data=>{data.files=data.files.filter(f=>!f.path.startsWith('tests/'));});
  assert.equal((await rescan(p.id)).status,200);rows=await store.list();
  assert.equal(rows.find(r=>r.id===docs.id).status,'open');assert.equal(rows.find(r=>r.id===docs.id).data.snapshotResolved,undefined);
});

test('rescan refuses a stale source or finding disposition and keeps the newer source unchanged',async()=>{
  const p=await importProject();const old=await source(p.id);
  await writeProject(p.id,data=>data.files.push({path:'later.ts',content:'later'}));
  const before=snapshot();
  const result=await post({action:'rescan',projectId:p.id,expectedSourceDigest:old.sourceDigest});
  assert.equal(result.status,400);assert.deepEqual(snapshot(),before);
  const fresh=await source(p.id),finding=(await store.list()).find(r=>r.kind==='finding');
  await post({action:'finding',id:finding.id,status:'accepted risk'});
  const after=snapshot();
  assert.equal((await post({action:'rescan',projectId:p.id,expectedSourceDigest:fresh.sourceDigest})).status,400);
  assert.deepEqual(snapshot(),after);
});

test('rescan compare-and-swap detects a disposition changed after reading but before its transaction',async()=>{
  const p=await importProject(),expected=await source(p.id),finding=(await store.list()).find(r=>r.kind==='finding');
  const batch=environment.DB.batch;
  environment.DB.batch=async statements=>{database().prepare("UPDATE records SET status='accepted risk' WHERE id=?").run(finding.id);return batch(statements);};
  const result=await post({action:'rescan',projectId:p.id,expectedSourceDigest:expected.sourceDigest});
  assert.equal(result.status,400);assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get(finding.id).status,'accepted risk');
  assert.equal(JSON.parse(database().prepare('SELECT data FROM records WHERE id=?').get(p.id).data).scanCount,1);
});

test('rescan audit failure rolls back project and finding changes together',async()=>{
  const p=await importProject();await writeProject(p.id,data=>data.files.push({path:'tests/test.ts',content:'test("x",()=>{})'}));
  const before=snapshot();database().exec("CREATE TRIGGER fail_rescan_audit BEFORE INSERT ON records WHEN NEW.kind='memory' AND NEW.title='Snapshot rescanned' BEGIN SELECT RAISE(ABORT,'audit failure'); END");
  assert.equal((await rescan(p.id)).status,503);assert.deepEqual(snapshot(),before);
});

test('each future horizon cites the selected snapshot, explicit unknowns, a measurable milestone and a reversible experiment',async()=>{
  const p=await importProject();const expected=await source(p.id),plan=await makePlan(p.id);
  assert.equal(plan.data.schema,'omnidev-future-plan-v1');assert.equal(plan.data.source.sourceDigest,expected.sourceDigest);
  assert.equal(plan.data.horizons.length,4);
  for(const horizon of plan.data.horizons){
    assert.ok(horizon.evidence.length>0);assert.ok(horizon.evidence.every(e=>e.sourceDigest===expected.sourceDigest&&e.snapshotDigest===expected.snapshotDigest));
    assert.ok(horizon.unknowns.length>0);assert.ok(horizon.milestone.measure&&horizon.milestone.target&&horizon.milestone.evidenceRequired);
    assert.ok(horizon.experiment.action&&horizon.experiment.rollback&&horizon.experiment.stopRule);assert.equal(horizon.confidence,'unassessed');
  }
  assert.match(plan.data.method,/hypotheses/i);assert.match(plan.data.method,/no live measurements/i);
});

test('different projects produce different cited horizons while accepted and resolved findings retain their dispositions',async()=>{
  const p=await importProject('Orders');const q=await importProject('Website',cleanFiles);
  const finding=(await store.list()).find(r=>r.kind==='finding'&&r.projectId===p.id&&r.data.category==='Security');
  await post({action:'finding',id:finding.id,status:'accepted risk'});
  const a=await makePlan(p.id),b=await makePlan(q.id);
  for(let i=0;i<4;i++)assert.notDeepEqual(a.data.horizons[i],b.data.horizons[i]);
  assert.ok(a.data.excludedFindings.some(f=>f.recordId===finding.id&&f.status==='accepted risk'));
  assert.ok(a.data.horizons.every(h=>h.evidence.every(e=>e.recordId!==finding.id)));
  assert.ok(b.data.horizons.every(h=>h.evidence.every(e=>e.recordId===q.id)));
});

test('partial snapshots preserve coverage unknowns and cannot imply measured health or market opportunity',async()=>{
  const p=await importProject();await writeProject(p.id,data=>{data.origin={partial:true,url:'https://github.com/example/orders'};});
  const plan=await makePlan(p.id);
  assert.ok(plan.data.horizons.every(h=>h.unknowns.some(u=>u.includes('Partial imported snapshot'))));
  assert.match(plan.data.horizons[2].hypothesis,/no bottleneck is inferred/);
  assert.match(plan.data.horizons[3].hypothesis,/revenue and demand.*unknown/i);
});

test('repeated and concurrent generation for the same evidence returns one immutable plan and one audit record',async()=>{
  const p=await importProject();const expected=await source(p.id);
  const results=await Promise.all(Array.from({length:4},()=>post({action:'future',projectId:p.id,expectedSourceDigest:expected.sourceDigest})));
  assert.ok(results.every(r=>r.status===200));assert.equal(new Set(results.map(r=>r.data.id)).size,1);
  assert.equal(database().prepare("SELECT count(*) n FROM records WHERE kind='roadmap'").get().n,1);
  assert.equal(database().prepare("SELECT count(*) n FROM records WHERE title='Future-state roadmap drafted'").get().n,1);
});

test('future generation requires a current source commitment and refuses stale sources or missing project scope',async()=>{
  const p=await importProject();const expected=await source(p.id);await writeProject(p.id,data=>data.files.push({path:'changed.ts',content:'changed'}));const before=snapshot();
  for(const payload of [{projectId:p.id,expectedSourceDigest:expected.sourceDigest},{projectId:p.id},{projectId:'all'},{projectId:'missing'}]){
    assert.equal((await post({action:'future',...payload})).status,400);assert.deepEqual(snapshot(),before);
  }
});

test('changed evidence creates a linked plan version while preserving the previous contract and outcomes',async()=>{
  const p=await importProject();const old=await makePlan(p.id);const original=JSON.stringify(old.data);
  await writeProject(p.id,data=>data.files.push({path:'new.ts',content:'new'}));const next=await makePlan(p.id);
  assert.notEqual(next.id,old.id);assert.equal(next.data.version,old.data.version+1);assert.equal(next.data.previousPlanId,old.id);
  assert.equal(JSON.stringify((await store.list()).find(r=>r.id===old.id).data),original);
});

const evaluationPayload=async(plan,extra={})=>({action:'evaluateFuture',id:plan.id,horizon:'V2',expectedRevision:plan.data.revision,expectedPlanDigest:plan.data.contractDigest,
  expectedSourceDigest:(await source(plan.projectId)).sourceDigest,conclusion:'inconclusive',actualOutcome:'One behavior check remains blocked; the forecast is not verified.',evidence:'Local fixture report with source revision and missing-environment disclosure.',...extra});

test('future evaluations append to an immutable plan and preserve the source actually observed',async()=>{
  const p=await importProject(),plan=await makePlan(p.id),contract=JSON.stringify(plan.data.horizons);
  await writeProject(p.id,data=>data.files.push({path:'tests/new.test.ts',content:'test("new",()=>{})'}));
  const current=await source(p.id);const result=await post(await evaluationPayload(plan));
  assert.equal(result.status,200);const saved=result.data.records.find(r=>r.id===plan.id);
  assert.equal(saved.data.revision,2);assert.equal(JSON.stringify(saved.data.horizons),contract);
  assert.equal(saved.data.evaluations[0].observedSource.sourceDigest,current.sourceDigest);
  assert.equal(saved.data.evaluations[0].plannedSourceDigest,plan.data.source.sourceDigest);
  assert.notEqual(current.sourceDigest,plan.data.source.sourceDigest);
  assert.match(saved.data.evaluations[0].verification,/Owner-recorded/);
  assert.equal(saved.data.evaluations[0].conclusion,'inconclusive');
  assert.ok(result.data.records.some(r=>r.kind==='memory'&&r.data.type==='FutureEvaluation'&&r.data.content));
});

test('future evaluation rejects missing or stale revision, wrong contract, wrong horizon and unsupported success claims without writes',async()=>{
  const p=await importProject(),plan=await makePlan(p.id),base=await evaluationPayload(plan),before=snapshot();
  for(const change of [{expectedRevision:undefined},{expectedRevision:0},{expectedPlanDigest:'wrong'},{horizon:'V100'},{conclusion:'verified'},{evidence:''},{expectedSourceDigest:'stale'}]){
    assert.equal((await post({...base,...change})).status,400);assert.deepEqual(snapshot(),before);
  }
});

test('concurrent outcomes have one winner and cannot overwrite or duplicate its history',async()=>{
  const p=await importProject(),plan=await makePlan(p.id),payload=await evaluationPayload(plan);
  const results=await Promise.all([post(payload),post({...payload,actualOutcome:'Concurrent alternative'})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
  const saved=(await store.list()).find(r=>r.id===plan.id);assert.equal(saved.data.evaluations.length,1);assert.equal(saved.data.revision,2);
  assert.equal(database().prepare("SELECT count(*) n FROM records WHERE json_extract(data,'$.type')='FutureEvaluation'").get().n,1);
});

test('recommendations prioritize confirmed current dispositions by severity, retain reasons and exclude accepted or resolved signals',async()=>{
  const p=await importProject();const records=await store.list(),findings=records.filter(r=>r.kind==='finding');
  findings[0].status='accepted risk';findings[1].status='resolved';
  const result=planning.projectRecommendations(records,p.id);
  assert.ok(!result.some(r=>r.id===findings[0].id||r.id===findings[1].id));
  for(const item of result){assert.ok(item.rationale&&item.nextAction&&item.evidence.recordId&&item.qualification);}
  const weights={critical:0,high:1,medium:2,low:3};assert.deepEqual(result.map(r=>weights[r.severity]),result.map(r=>weights[r.severity]).sort());
});

test('All projects never supplies an implicit action target; security statistics and rows share exactly the same scope',async()=>{
  const p=await importProject(),q=await importProject('Other',cleanFiles),records=await store.list();
  assert.equal(selectedProject(records,'all'),undefined);assert.equal(selectedProject(records,'missing'),undefined);
  assert.equal(selectedProject(records,q.id).id,q.id);
  const scoped=scopeFindings(records,p.id,'Security'),summary=findingSummary(scoped);
  assert.ok(scoped.every(r=>r.projectId===p.id&&r.data.category==='Security'));
  assert.equal(summary.open,scoped.filter(r=>r.status==='open').length);
  assert.equal(summary.critical,scoped.filter(r=>r.status==='open'&&r.data.severity==='critical').length);
  assert.equal(findingSummary(scopeFindings(records,q.id,'Security')).open,0);
});
