import assert from 'node:assert/strict';
import {test,beforeEach,after} from 'node:test';
import {openStore,closeStore,database,environment,store,intelligence,post,source,snapshot,importProject,writeProject,makePlan} from './workspace-fixture.mjs';
beforeEach(openStore);after(closeStore);
const decisionFields={title:'Use isolated execution',reason:'Keep changes reviewable',alternatives:'Change the live system',risks:'Additional setup work',expectedOutcome:'Failures stay isolated'};
async function save(projectId=''){
  const result=await post({action:'decision',...decisionFields,projectId,...(projectId?{expectedSourceDigest:(await source(projectId)).sourceDigest}:{})},intelligence);
  assert.equal(result.status,200);return result.data.result;
}
const outcome=(decision,extra={})=>post({action:'outcome',id:decision.id,expectedRevision:decision.data.revision,actualOutcome:'Local checks reproduced the failure safely',lessons:'Qualify real deployment isolation separately',...extra},intelligence);

test('decisions list includes prior structured decisions, project scope and revision history',async()=>{
  const p=await importProject(),q=await importProject('Other');const a=await save(p.id);await save(q.id);await save();
  await outcome(a);
  const response=await intelligence.GET(new Request('https://omni.example/api/intelligence?action=decisions&projectId='+p.id));
  assert.equal(response.status,200);const result=await response.json();assert.equal(result.decisions.length,1);
  assert.equal(result.decisions[0].id,a.id);assert.equal(result.decisions[0].data.revision,2);
  assert.equal(result.decisions[0].history.length,1);assert.equal(result.decisions[0].history[0].data.previous.revision,1);
  assert.equal(result.decisions[0].data.source.projectId,p.id);
});

test('recorded outcomes and corrections retain readable prior and next revisions',async()=>{
  const d=await save();const first=await outcome(d);assert.equal(first.status,200);
  const next={...d,data:first.data.result};const second=await outcome(next,{actualOutcome:'Corrected after another observation'});assert.equal(second.status,200);
  const rows=await store.list(),saved=rows.find(r=>r.id===d.id),history=rows.filter(r=>r.data.type==='DecisionHistory');
  assert.equal(saved.data.revision,3);assert.equal(saved.status,'evaluated');assert.equal(history.length,2);
  assert.ok(history.every(r=>r.data.content&&r.data.previous.revision+1===r.data.next.revision));
  assert.ok(history.some(r=>r.data.previous.actualOutcome==='Local checks reproduced the failure safely'));
});

test('stale outcome forms cannot replace a newer observation even when requests are sequential',async()=>{
  const d=await save();assert.equal((await outcome(d)).status,200);const before=snapshot();
  const stale=await outcome(d,{actualOutcome:'Stale overwrite'});assert.equal(stale.status,400);assert.match(stale.data.error,/changed|revision|reload/i);
  assert.deepEqual(snapshot(),before);
});

test('missing, malformed and wrong revisions or empty outcomes are refused without writes',async()=>{
  const d=await save(),before=snapshot();
  for(const change of [{expectedRevision:undefined},{expectedRevision:'1'},{expectedRevision:0},{expectedRevision:2},{actualOutcome:''},{lessons:''}]){
    assert.equal((await outcome(d,change)).status,400);assert.deepEqual(snapshot(),before);
  }
});

test('simultaneous decision outcomes produce one durable revision and one audit event',async()=>{
  const d=await save();const results=await Promise.all([outcome(d),outcome(d,{actualOutcome:'Alternative'})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);const rows=await store.list();
  assert.equal(rows.find(r=>r.id===d.id).data.revision,2);assert.equal(rows.filter(r=>r.data.type==='DecisionHistory').length,1);
});

test('decision audit failure rolls back the outcome instead of losing its history',async()=>{
  const d=await save(),before=snapshot();
  database().exec("CREATE TRIGGER fail_decision_history BEFORE INSERT ON records WHEN json_extract(NEW.data,'$.type')='DecisionHistory' BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");
  assert.equal((await outcome(d)).status,400);assert.deepEqual(snapshot(),before);
});

test('project-scoped decisions reject stale source and deleted parents without creating orphan records',async()=>{
  const p=await importProject(),expected=await source(p.id),before=snapshot();
  const invalid=await post({action:'decision',...decisionFields,projectId:p.id,expectedSourceDigest:'stale'},intelligence);
  assert.equal(invalid.status,400);assert.deepEqual(snapshot(),before);
  const batch=environment.DB.batch;
  environment.DB.batch=async statements=>{database().prepare('DELETE FROM records WHERE id=? OR project_id=?').run(p.id,p.id);return batch(statements);};
  const raced=await post({action:'decision',...decisionFields,projectId:p.id,expectedSourceDigest:expected.sourceDigest},intelligence);
  assert.equal(raced.status,400);assert.equal(database().prepare("SELECT count(*) n FROM records WHERE kind='decision'").get().n,0);
});

test('unknown decision-list scope and cross-origin outcome writes fail safely',async()=>{
  const d=await save(),before=snapshot();
  const response=await intelligence.GET(new Request('https://omni.example/api/intelligence?action=decisions&projectId=missing'));
  assert.equal(response.status,400);
  const cross=await intelligence.POST(new Request('https://omni.example/api/intelligence',{method:'POST',headers:{Origin:'https://evil.example'},body:JSON.stringify({action:'outcome',id:d.id,expectedRevision:1,actualOutcome:'bad',lessons:'bad'})}));
  assert.equal(cross.status,403);assert.deepEqual(snapshot(),before);
});

const search=async(query,projectId='')=>{
  const url=new URL('https://omni.example/api/intelligence');url.searchParams.set('action','search');url.searchParams.set('query',query);url.searchParams.set('projectId',projectId);
  const response=await intelligence.GET(new Request(url));return {status:response.status,data:await response.json()};
};

test('historical corrected outcomes remain searchable with their exact decision revision and source context',async()=>{
  const p=await importProject('Orders'),original=await source(p.id),d=await save(p.id);
  assert.equal((await outcome(d,{actualOutcome:'Zircon baseline check failed',lessons:'Retain the first observation'})).status,200);
  await writeProject(p.id,data=>{data.files.push({path:'src/correction.ts',content:'export const repaired = true;'});data.revision=1;});
  const observed=await source(p.id),latest=(await store.list()).find(r=>r.id===d.id);
  assert.equal((await outcome(latest,{actualOutcome:'Cobalt follow-up check passed',lessons:'The later source differs from the original choice'})).status,200);
  const old=await search('Zircon',p.id);assert.equal(old.status,200);assert.equal(old.data.hits.length,1);
  const hit=old.data.hits[0];assert.equal(hit.kind,'memory');assert.match(hit.excerpt,/Zircon/);
  assert.equal(hit.citation.projectId,p.id);assert.equal(hit.citation.lineage.decisionId,d.id);assert.equal(hit.citation.lineage.revision,2);
  assert.equal(hit.citation.lineage.previousRevision,1);assert.equal(hit.citation.source.sourceDigest,original.sourceDigest);
  assert.equal(hit.citation.observedSource.sourceDigest,original.sourceDigest);
  const current=await search('Cobalt',p.id);const later=current.data.hits.find(r=>r.kind==='memory');
  assert.equal(later.citation.lineage.revision,3);assert.equal(later.citation.source.sourceDigest,original.sourceDigest);
  assert.equal(later.citation.observedSource.sourceDigest,observed.sourceDigest);assert.notEqual(later.citation.observedSource.sourceDigest,later.citation.source.sourceDigest);
  assert.match(later.limitations,/owner-recorded/i);
});

test('scoped history search excludes matching other-project and unassigned records without changing stored history',async()=>{
  const p=await importProject('Orders'),q=await importProject('Other');
  for(const id of [p.id,q.id,'']){const d=await save(id);await outcome(d,{actualOutcome:'Quartz observation',lessons:'Keep project scope'});}
  const before=snapshot(),result=await search('Quartz',p.id);
  assert.equal(result.status,200);assert.equal(result.data.hits.length,2);assert.ok(result.data.hits.every(h=>h.projectId===p.id&&h.citation.projectId===p.id));
  assert.ok(result.data.hits.every(h=>h.citation.source.projectId===p.id));assert.deepEqual(snapshot(),before);
  assert.equal((await search('Quartz',q.id)).data.hits.length,2);
});

test('unknown and wrong-kind search scopes are rejected instead of silently appearing to contain no evidence',async()=>{
  const d=await save(),before=snapshot();
  for(const id of ['missing-project',d.id,'all']){const result=await search('isolated',id);assert.equal(result.status,400);assert.match(result.data.error,/project/i);}
  assert.deepEqual(snapshot(),before);
});

test('future plan search retains the original version and contract citation after a later source version',async()=>{
  const p=await importProject('PlanVersionProbe'),old=await makePlan(p.id);
  await writeProject(p.id,data=>{data.files.push({path:'tests/later.test.ts',content:'test("later",()=>{})'});data.revision=1;});
  const next=await makePlan(p.id),result=await search('PlanVersionProbe',p.id);
  assert.equal(result.status,200);const plans=result.data.hits.filter(h=>h.kind==='roadmap');
  const prior=plans.find(h=>h.id===old.id),current=plans.find(h=>h.id===next.id);assert.ok(prior&&current);
  assert.equal(prior.citation.lineage.planVersion,1);assert.equal(current.citation.lineage.planVersion,2);
  assert.equal(current.citation.lineage.previousPlanId,old.id);assert.equal(prior.citation.lineage.contractDigest,old.data.contractDigest);
  assert.equal(prior.citation.source.sourceDigest,old.data.source.sourceDigest);assert.equal(current.citation.source.sourceDigest,next.data.source.sourceDigest);
});
