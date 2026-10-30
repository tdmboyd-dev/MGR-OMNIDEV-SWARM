import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {publicationFixture,cleanupPublicationFixtures} from './trilogy-publication-fixture.mjs';
import {closeStore,database,rawJob,resultOf,mutateJob,environment} from './trilogy-fixture.mjs';

const publication=await import('../.test-runtime/trilogy-publication.mjs');
const effects=await import('../.test-runtime/control-plane.mjs');
after(()=>{cleanupPublicationFixtures();closeStore();});

const approve=async f=>publication.authorizeTrilogyPublication(
  f.job.id,await publication.previewTrilogyPublication(f.job.id,f.access),f.access,
);
const publish=(f,approval)=>publication.publishTrilogyCandidate(f.job.id,approval.authorizationId,f.access);
const exposure=f=>database().prepare("SELECT * FROM records WHERE id=? AND kind='exposure'").get('exposure-pr-'+f.job.id);

// Reconstruct the durable boundary left by death after admission but before the
// publication-attempt transaction. No original async attempt remains running.
// These are SQLite/Git recovery regressions, not physical host crash evidence.
async function orphanAdmission(f){
  const raw=rawJob(f.job.id);
  await effects.reserveSnapshot({
    id:raw.id,projectId:raw.project_id,objective:raw.objective,mode:raw.mode,
    payload:JSON.parse(raw.payload),result:JSON.parse(raw.result),
  },true);
  assert.equal(exposure(f).status,'active');
  assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized');
  assert.equal(f.mutations().length,0);
}

test('restart after admission but before attempt persistence recovers the exact reserved job',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await orphanAdmission(f);
  const result=await publish(f,approval);
  assert.equal(result.state,'published');
  assert.equal(result.outcome.commit,f.candidate);
  assert.equal(f.pulls.length,1);
  assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/refs').length,1);
  assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/pulls').length,1);
  assert.equal(exposure(f).status,'released');
});

test('concurrent restart of one orphan admission starts at most one provider publication',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await orphanAdmission(f);
  const results=await Promise.allSettled([publish(f,approval),publish(f,approval)]);
  assert.ok(results.some(r=>r.status==='fulfilled'),'At least one recovery must complete');
  assert.equal(f.pulls.length,1);
  assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/refs').length,1);
  assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/pulls').length,1);
  assert.equal(exposure(f).status,'released');
});

test('orphan admission recovery cannot borrow a reservation with a different effect identity',async()=>{
  for(const field of ['operationId','target','action','candidateDigest','sourceDigest']){
    const f=await publicationFixture(),approval=await approve(f);
    await orphanAdmission(f);
    const row=exposure(f),data={...JSON.parse(row.data),[field]:'another-identity'};
    database().prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify(data),row.id);
    await assert.rejects(publish(f,approval),undefined,'Different '+field+' must be refused');
    assert.equal(f.mutations().length,0,'No remote writes for mismatched '+field);
    assert.equal(exposure(f).status,'active','Do not release another effect');
    assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized');
  }
});

test('failed exposure release after provider confirmation is recoverable without another draft',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  database().exec("CREATE TRIGGER interrupt_publication_release BEFORE UPDATE ON records WHEN NEW.kind='exposure' AND NEW.status='released' BEGIN SELECT RAISE(ABORT,'fixture interruption at exposure release'); END");
  try{await assert.rejects(publish(f,approval));}
  finally{database().exec('DROP TRIGGER interrupt_publication_release');}
  assert.equal(f.pulls.length,1,'The provider already created the exact draft');
  assert.equal(exposure(f).status,'active');
  const writes=f.mutations().length;
  const result=await publish(f,approval);
  assert.equal(result.state,'published');
  assert.equal(result.outcome.commit,f.candidate);
  assert.equal(f.pulls.length,1);
  assert.equal(f.mutations().length,writes,'Recovery must only inspect the existing remote result');
  assert.equal(exposure(f).status,'released','Confirmed publication must no longer occupy active capacity');
});

test('legacy published record with an unreleased exposure is repaired by readback',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  const first=await publish(f,approval),row=exposure(f);
  // Reproduce the persisted state from the older two-statement finalization:
  // the job save completed, then the process died before releasing capacity.
  database().prepare("UPDATE records SET status='active',data=json_set(data,'$.state','active') WHERE id=?").run(row.id);
  const writes=f.mutations().length;
  const recovered=await publish(f,approval);
  assert.equal(recovered.state,'published');
  assert.deepEqual(recovered.outcome,first.outcome);
  assert.equal(f.mutations().length,writes);
  assert.equal(f.pulls.length,1);
  assert.equal(exposure(f).status,'released');
});

async function loseDraftResponse(f,approval){
  let lost=false;
  f.setHook(call=>{
    if(!lost&&call.method==='POST'&&call.path==='/pulls'){
      lost=true;
      f.pulls.push({
        number:1,state:'open',draft:true,merged:false,
        html_url:'https://github.com/'+f.repositoryId+'/pull/1',
        head:{ref:call.body.head,sha:f.refs.get(call.body.head),repo:{full_name:f.repositoryId}},
        base:{ref:call.body.base,sha:f.refs.get(call.body.base),repo:{full_name:f.repositoryId}},
      });
      throw Error('fixture interruption after provider persisted the draft');
    }
  });
  try{await assert.rejects(publish(f,approval));}
  finally{f.setHook(null);}
  assert.equal(lost,true);
  assert.equal(f.pulls.length,1);
  assert.equal(resultOf(f.job.id).trilogy.publication.state,'uncertain');
  assert.equal(exposure(f).status,'active');
}

test('expired or revoked authority still permits read-only reconciliation of an already-created draft',async()=>{
  for(const changed of ['approval-expiry','approval-revoke','grant-expiry','grant-revoke']){
    const f=await publicationFixture(),approval=await approve(f);
    await loseDraftResponse(f,approval);
    mutateJob(f.job.id,job=>{
      if(changed==='approval-expiry')job.result.trilogy.publication.authorization.expiresAt=Date.now()-1;
      if(changed==='approval-revoke')job.result.trilogy.publication.authorization.revoked=true;
      if(changed==='grant-expiry')job.result.trilogy.grant.expiresAt=Date.now()-1;
      if(changed==='grant-revoke')job.result.trilogy.grant.revoked=true;
    });
    const before=resultOf(f.job.id),writes=f.mutations().length;
    await assert.rejects(publish(f,approval),'Expired or revoked authority must not authorize another publish');
    const observed=await publication.reconcileTrilogyPublication(f.job.id,f.access);
    assert.equal(observed.state,'published',changed);
    assert.equal(observed.authorizationActive,false,changed);
    assert.equal(observed.outcome.commit,f.candidate);
    assert.equal(observed.authorizationId,approval.authorizationId);
    assert.equal(f.mutations().length,writes,'Reconciliation must send only GitHub reads');
    assert.equal(f.pulls.length,1);
    assert.equal(exposure(f).status,'released');
    const after=resultOf(f.job.id);
    assert.deepEqual(after.trilogy.publication.authorization,before.trilogy.publication.authorization,'Reconciliation cannot renew or restore authority');
    assert.deepEqual(after.trilogy.grant,before.trilogy.grant,'The candidate-only grant stays expired/revoked');
  }
});

test('read-only reconciliation works while new effects are stopped without resuming them',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await loseDraftResponse(f,approval);
  database().prepare("INSERT INTO runtime_settings(id,data,updated_at) VALUES('effect-policy',?,?)").run(JSON.stringify({stopped:true}),new Date().toISOString());
  const writes=f.mutations().length;
  const observed=await publication.reconcileTrilogyPublication(f.job.id,f.access);
  assert.equal(observed.state,'published');
  assert.equal(f.mutations().length,writes);
  assert.equal(JSON.parse(database().prepare("SELECT data FROM runtime_settings WHERE id='effect-policy'").get().data).stopped,true);
  assert.equal(exposure(f).status,'released');
});

test('read-only reconciliation cannot certify changed remote candidates or changed local proof',async()=>{
  for(const changed of ['branch','pull-head','base','candidate','proof','output']){
    const f=await publicationFixture(),approval=await approve(f);
    await loseDraftResponse(f,approval);
    if(changed==='branch')f.refs.set(approval.preview.candidateRef.slice('refs/heads/'.length),f.base);
    if(changed==='pull-head')f.pulls[0].head.sha=f.base;
    if(changed==='base')f.refs.set('main',f.candidate);
    if(changed==='candidate')mutateJob(f.job.id,job=>{job.result.candidate.patches[0].after+='// changed after testing';});
    if(changed==='proof')mutateJob(f.job.id,job=>{job.result.trilogy.proof.receipt.signature='altered';});
    if(changed==='output')mutateJob(f.job.id,job=>{job.result.trilogy.proof.outputBase64=Buffer.from('changed execution output').toString('base64');});
    const writes=f.mutations().length;
    let observed;
    try{observed=await publication.reconcileTrilogyPublication(f.job.id,f.access);}catch{}
    assert.notEqual(observed?.state,'published',changed);
    assert.notEqual(resultOf(f.job.id).trilogy.publication.state,'published',changed);
    assert.equal(f.mutations().length,writes,'No remote writes for '+changed);
    assert.equal(exposure(f).status,'active','Unconfirmed '+changed+' retains its evidence and reservation');
  }
});

test('missing remote draft remains unconfirmed and does not silently create one',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await loseDraftResponse(f,approval);
  f.pulls.splice(0);
  const writes=f.mutations().length;
  let observed;
  try{observed=await publication.reconcileTrilogyPublication(f.job.id,f.access);}catch{}
  assert.notEqual(observed?.state,'published');
  assert.notEqual(resultOf(f.job.id).trilogy.publication.state,'published');
  assert.equal(f.mutations().length,writes);
  assert.equal(f.pulls.length,0);
  assert.equal(exposure(f).status,'active');
});

test('only the scoped owner may reconcile saved publication effects',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await loseDraftResponse(f,approval);
  const calls=f.calls.length;
  for(const access of [
    {...f.access,role:'reader'},
    {...f.access,role:'bridge'},
    {...f.access,role:'worker'},
    {...f.access,ownerId:'another-owner'},
    {...f.access,projectId:'another-project'},
  ])await assert.rejects(publication.reconcileTrilogyPublication(f.job.id,access));
  assert.equal(f.calls.length,calls,'Out-of-scope requests cannot inspect provider effects');
  assert.equal(exposure(f).status,'active');
});

test('canceled, expired or revoked undispatched approvals release their exact orphan reservation without GitHub calls',async()=>{
  for(const changed of ['canceled','approval-expiry','approval-revoke','grant-expiry','grant-revoke']){
    const f=await publicationFixture(),approval=await approve(f);
    await orphanAdmission(f);
    mutateJob(f.job.id,job=>{
      if(changed==='canceled')job.status='canceled';
      if(changed==='approval-expiry')job.result.trilogy.publication.authorization.expiresAt=Date.now()-1;
      if(changed==='approval-revoke')job.result.trilogy.publication.authorization.revoked=true;
      if(changed==='grant-expiry')job.result.trilogy.grant.expiresAt=Date.now()-1;
      if(changed==='grant-revoke')job.result.trilogy.grant.revoked=true;
    });
    const before=resultOf(f.job.id),calls=f.calls.length;
    const cleared=await publication.reconcileTrilogyPublication(f.job.id,f.access);
    assert.equal(cleared.state,'canceled-before-dispatch',changed);
    assert.equal(cleared.reconciliation,'not-dispatched');
    assert.equal(cleared.authorizationActive,false);
    assert.equal(cleared.outcome,null,'No draft may be invented');
    assert.equal(exposure(f).status,'released');
    assert.equal(JSON.parse(exposure(f).data).state,'released');
    assert.equal(JSON.parse(exposure(f).data).outcome,'canceled-before-dispatch');
    assert.equal(f.calls.length,calls,'Undispatched cleanup needs no provider calls');
    assert.equal(resultOf(f.job.id).repository,undefined);
    assert.deepEqual(resultOf(f.job.id).trilogy.publication.authorization,before.trilogy.publication.authorization);
    assert.deepEqual(resultOf(f.job.id).trilogy.grant,before.trilogy.grant);
    await assert.rejects(publish(f,approval));
    const repeated=await publication.reconcileTrilogyPublication(f.job.id,f.access);
    assert.equal(repeated.state,'canceled-before-dispatch');
    assert.equal(f.calls.length,calls);
  }
});

test('an active undispatched approval is preserved until resumed or explicitly revoked',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await orphanAdmission(f);
  const calls=f.calls.length;
  await assert.rejects(publication.reconcileTrilogyPublication(f.job.id,f.access));
  assert.equal(f.calls.length,calls);
  assert.equal(resultOf(f.job.id).trilogy.publication.authorization.id,approval.authorizationId);
  assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized');
  assert.equal(exposure(f).status,'active');
});

test('undispatched cleanup refuses a changed effect identity or ambiguous dispatch history',async()=>{
  for(const changed of ['operationId','target','action','candidateDigest','sourceDigest','project_id','phase','attemptId']){
    const f=await publicationFixture();await approve(f);await orphanAdmission(f);
    mutateJob(f.job.id,job=>{
      job.status='canceled';
      if(changed==='phase')job.result.trilogy.publication.phase='branch';
      if(changed==='attemptId')job.result.trilogy.publication.attemptId='previous-attempt';
    });
    const row=exposure(f);
    if(changed==='project_id')database().prepare('UPDATE records SET project_id=? WHERE id=?').run('another-project',row.id);
    else if(!['phase','attemptId'].includes(changed))database().prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({...JSON.parse(row.data),[changed]:'different'}),row.id);
    const calls=f.calls.length;
    await assert.rejects(publication.reconcileTrilogyPublication(f.job.id,f.access),undefined,changed);
    assert.equal(exposure(f).status,'active',changed);
    assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized',changed);
    assert.equal(f.calls.length,calls);
  }
});

test('a delayed starter cannot dispatch after canceled orphan cleanup wins',async()=>{
  const f=await publicationFixture(),approval=await approve(f),batch=environment.DB.batch;
  let reachedStart,releaseStart;
  const reached=new Promise(resolve=>{reachedStart=resolve;}),hold=new Promise(resolve=>{releaseStart=resolve;});
  environment.DB.batch=async statements=>{
    if(statements.some(s=>s.sql.startsWith('UPDATE jobs SET result=')&&JSON.parse(s.args[0]).trilogy?.publication?.state==='publishing')){reachedStart();await hold;}
    return batch(statements);
  };
  const attempt=publish(f,approval).then(value=>({value}),error=>({error}));
  let timer;
  try{
    await Promise.race([reached,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('start boundary was not reached')),3000);})]);
    assert.equal(exposure(f).status,'active');assert.equal(f.mutations().length,0);
    mutateJob(f.job.id,job=>{job.status='canceled';});
    const cleared=await publication.reconcileTrilogyPublication(f.job.id,f.access);
    assert.equal(cleared.state,'canceled-before-dispatch');
    releaseStart();
    assert.ok((await attempt).error,'The delayed attempt must lose its compare-and-swap');
    assert.equal(f.mutations().length,0);
    assert.equal(exposure(f).status,'released');
  }finally{clearTimeout(timer);releaseStart();environment.DB.batch=batch;await attempt;}
});

test('undispatched cleanup and exposure release roll back together if the release fails',async()=>{
  const f=await publicationFixture();await approve(f);await orphanAdmission(f);
  mutateJob(f.job.id,job=>{job.status='canceled';});
  database().exec("CREATE TRIGGER interrupt_orphan_release BEFORE UPDATE ON records WHEN NEW.kind='exposure' AND NEW.status='released' BEGIN SELECT RAISE(ABORT,'fixture orphan release interruption'); END");
  try{await assert.rejects(publication.reconcileTrilogyPublication(f.job.id,f.access));}
  finally{database().exec('DROP TRIGGER interrupt_orphan_release');}
  assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized');
  assert.equal(exposure(f).status,'active');
  assert.equal(f.mutations().length,0);
  await publication.reconcileTrilogyPublication(f.job.id,f.access);
  assert.equal(exposure(f).status,'released');
});

test('a reservation changed at the cleanup transaction boundary is not adopted or released',async()=>{
  const f=await publicationFixture();await approve(f);await orphanAdmission(f);
  mutateJob(f.job.id,job=>{job.status='canceled';});
  const batch=environment.DB.batch;let altered=false;
  environment.DB.batch=async statements=>{
    if(!altered&&statements.some(s=>s.sql.startsWith('UPDATE jobs SET result=')&&JSON.parse(s.args[0]).trilogy?.publication?.state==='canceled-before-dispatch')){
      altered=true;database().prepare("UPDATE records SET data=json_set(data,'$.operationId','different-operation') WHERE id=?").run('exposure-pr-'+f.job.id);
    }
    return batch(statements);
  };
  try{await assert.rejects(publication.reconcileTrilogyPublication(f.job.id,f.access));}
  finally{environment.DB.batch=batch;}
  assert.equal(altered,true);
  assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized');
  assert.equal(exposure(f).status,'active');
  assert.equal(JSON.parse(exposure(f).data).operationId,'different-operation');
  assert.equal(f.mutations().length,0);
});

test('confirmed publication releases both the capacity row and its saved state metadata',async()=>{
  const f=await publicationFixture(),approval=await approve(f);
  await publish(f,approval);
  assert.equal(exposure(f).status,'released');
  assert.equal(JSON.parse(exposure(f).data).state,'released');
  assert.equal(JSON.parse(exposure(f).data).outcome,'published');
});

test('clearing an undispatched revoked approval requires a new approval before any later draft',async()=>{
  for(const reserved of [false,true]){
    const f=await publicationFixture(),original=await approve(f);
    if(reserved)await orphanAdmission(f);
    await publication.revokeTrilogyPublication(f.job.id,original.authorizationId,f.access);
    const calls=f.calls.length;
    const cleared=await publication.reconcileTrilogyPublication(f.job.id,f.access);
    assert.equal(cleared.state,'canceled-before-dispatch');
    assert.equal(f.calls.length,calls);
    assert.equal(exposure(f)?.status,reserved?'released':undefined);
    await assert.rejects(publish(f,original));
    const replacement=await approve(f);
    assert.notEqual(replacement.authorizationId,original.authorizationId);
    assert.equal(replacement.state,'authorized');
    await assert.rejects(publish(f,original));
    await publish(f,replacement);
    assert.equal(f.pulls.length,1);
    assert.equal(exposure(f).status,'released');
  }
});
