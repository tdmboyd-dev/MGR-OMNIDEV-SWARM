import assert from 'node:assert/strict';
import {test,beforeEach,after} from 'node:test';
import {openStore,closeStore,store,post,source,importProject,writeProject} from './workspace-fixture.mjs';
import {enqueue,tick,decide,submitAccountCandidate} from '../.test-runtime/jobs.mjs';
import {fingerprint} from '../.test-runtime/control-plane.mjs';
import {staticTests} from '../.test-runtime/runtime-contract.mjs';
beforeEach(openStore);after(closeStore);
const security=async projectId=>(await store.list()).filter(r=>r.kind==='finding'&&r.projectId===projectId&&r.data.category==='Security');
const rescan=async projectId=>post({action:'rescan',projectId,expectedSourceDigest:(await source(projectId)).sourceDigest});
const broken='const text = "unterminated';

test('rescan preserves existing security dispositions when source cannot be inspected',async()=>{
 const p=await importProject(),findings=await security(p.id);
 await post({action:'finding',id:findings[0].id,status:'in review'});
 await post({action:'finding',id:findings[1].id,status:'accepted risk'});
 const before=await security(p.id);
 await writeProject(p.id,data=>{data.files[0].content=broken;});
 const response=await rescan(p.id);assert.equal(response.status,200);
 assert.deepEqual(await security(p.id),before);
 const coverage=response.data.records.find(r=>r.id===p.id).data.analysis.securityAnalysis.files;
 assert.match(coverage.find(f=>f.path==='src/orders.ts').status,/^not-inspected/);
});

test('a completed clean rescan can still resolve absent snapshot signals',async()=>{
 const p=await importProject();await writeProject(p.id,data=>{data.files[0].content='export const value = 1;';});
 assert.equal((await rescan(p.id)).status,200);
 assert.ok((await security(p.id)).every(r=>r.status==='resolved'&&r.data.snapshotResolved));
});

test('removing the source file resolves snapshot absence rather than pretending it was uninspected',async()=>{
 const p=await importProject();await writeProject(p.id,data=>{data.files=data.files.filter(f=>f.path!=='src/orders.ts');});
 assert.equal((await rescan(p.id)).status,200);
 assert.ok((await security(p.id)).every(r=>r.status==='resolved'&&r.data.snapshotResolved));
});

test('native maintenance apply and rollback retain findings for unchanged uninspected source',async()=>{
 const p=await importProject(),findings=await security(p.id);
 await post({action:'finding',id:findings[0].id,status:'in review'});
 await post({action:'finding',id:findings[1].id,status:'accepted risk'});
 const before=await security(p.id);
 await writeProject(p.id,data=>{data.files[0].content=broken;});
 const job=await enqueue({mode:'native',projectId:p.id,objective:'Add snapshot integrity tests'}),generated=await tick(job.id);
 assert.equal(generated.status,'awaiting review');assert.equal(generated.result.checks.passed,true);
 assert.equal(generated.result.checks.tests.find(t=>t.name==='No increase in high / critical heuristic findings').status,'not run');
 assert.equal((await decide(job.id,'apply')).status,'applied');assert.deepEqual(await security(p.id),before);
 assert.equal((await decide(job.id,'rollback')).status,'rolled back');assert.deepEqual(await security(p.id),before);
});

test('malformed changed source fails static inspection and cannot enter snapshot apply',async()=>{
 const p=await importProject(),job=await enqueue({mode:'account',projectId:p.id,objective:'Change the source'});
 const baseline=job.payload.baseline,original=baseline[0];
 const candidate={summary:'Malformed source candidate',patches:[{path:original.path,before:original.content,after:broken}],experts:[]};
 const submitted=await submitAccountCandidate(job.id,{jobId:job.id,sourceDigest:await fingerprint(baseline),candidate});
 assert.equal(submitted.status,'failed');assert.equal(submitted.result.checks.passed,false);
 assert.equal(submitted.result.checks.tests.find(t=>t.name==='Bounded security-rule inspection for changed files').status,'failed');
 assert.equal(submitted.result.checks.tests.find(t=>t.name==='No increase in high / critical heuristic findings').status,'not run');
 await assert.rejects(()=>decide(job.id,'apply'),/Candidate must pass checks/);
 assert.deepEqual((await store.list()).find(r=>r.id===p.id).data.files,baseline);
});

test('a local fix of malformed source can be reviewed without claiming a complete before comparison',()=>{
 const file={path:'src/broken.ts',content:broken};
 const result=staticTests([file],{patches:[{path:file.path,before:file.content,after:'export const value = 1;'}]});
 assert.equal(result.passed,true);
 assert.equal(result.tests.find(t=>t.name==='Bounded security-rule inspection for changed files').status,'passed');
 assert.equal(result.tests.find(t=>t.name==='No increase in high / critical heuristic findings').status,'not run');
});
