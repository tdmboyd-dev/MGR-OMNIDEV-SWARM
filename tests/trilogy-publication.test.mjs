import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {publicationFixture,cleanupPublicationFixtures} from './trilogy-publication-fixture.mjs';
import {closeStore,database,environment,writeProject,dbSnapshot,mutateJob,resultOf,post,get,jobs,route} from './trilogy-fixture.mjs';
const publication=await import('../.test-runtime/trilogy-publication.mjs');
after(()=>{cleanupPublicationFixtures();closeStore();});
const preview=f=>publication.previewTrilogyPublication(f.job.id,f.access);
const authorize=async f=>publication.authorizeTrilogyPublication(f.job.id,await preview(f),f.access);
const publish=(f,grant)=>publication.publishTrilogyCandidate(f.job.id,grant.authorizationId,f.access);
const denied=async promise=>assert.rejects(promise);
const noVisibleWrites=f=>assert.equal(f.visibleWrites().length,0,JSON.stringify(f.visibleWrites()));

test('publication preview names the exact signed Git commit and does not authorize writes',async()=>{
 const f=await publicationFixture(),before=dbSnapshot(),value=await preview(f);
 assert.equal(value.contract,'mgr.trilogy.publication-preview.v1');assert.equal(value.candidateCommit,f.candidate);assert.equal(value.baseCommit,f.base);assert.equal(value.baseBranch,'main');assert.equal(value.permission,'draft-pr-exact-candidate');assert.equal(value.merged,false);assert.equal(value.released,false);assert.equal(value.changedFiles.length,f.job.result.candidate.patches.length);assert.match(value.previewSha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(dbSnapshot(),before);assert.equal(f.mutations().length,0);
 for(const secret of [...Object.values(f.tokens),'encrypted','PRIVATE KEY','outputBase64'])assert.ok(!JSON.stringify(value).includes(secret));
});
test('candidate-only scope and unsigned candidate cannot authorize publication',async()=>{
 const f=await publicationFixture({verified:false});await denied(preview(f));noVisibleWrites(f);
 await denied(f.repository.createPullRequest(f.job.id));
 for(const role of ['bridge','reader','worker'])await denied(publication.previewTrilogyPublication(f.job.id,{...f.access,role}));
});
test('owner approval is bound to the complete current preview',async()=>{
 const f=await publicationFixture(),value=await preview(f),before=dbSnapshot();
 for(const patch of [{candidateCommit:'f'.repeat(40)},{baseBranch:'another'},{previewSha256:'f'.repeat(64)},{permission:'merge'},{released:true}])await denied(publication.authorizeTrilogyPublication(f.job.id,{...value,...patch},f.access));
 assert.deepEqual(dbSnapshot(),before);noVisibleWrites(f);
});
test('approved draft publication preserves the exact real Git commit and untouched base tree',async()=>{
 const f=await publicationFixture(),head=f.git(['rev-parse','HEAD']),grant=await authorize(f),outcome=await publish(f,grant);
 const saved=resultOf(f.job.id),state=saved.trilogy.publication;
 assert.equal(f.pulls.length,1);assert.equal(f.pulls[0].draft,true);assert.equal(f.pulls[0].head.sha,f.candidate);assert.equal(f.pulls[0].base.sha,f.base);assert.equal(f.pulls[0].merged,false);
 assert.equal(f.git(['rev-parse','HEAD']),head);assert.equal(f.git(['rev-parse',f.candidate+'^']),f.base);assert.equal(f.git(['show',f.candidate+':untouched.txt']),'# Untouched committed file');assert.equal(state.state,'published');
 assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/refs').length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/pulls').length,1);
 assert.ok(JSON.stringify(outcome).includes(f.candidate));assert.equal(saved.trilogy.result.released,false);assert.equal(saved.trilogy.result.merged,false);
});
test('the generic publisher remains blocked after separate draft authorization',async()=>{
 const f=await publicationFixture();await authorize(f);await denied(f.repository.createPullRequest(f.job.id));noVisibleWrites(f);
});
test('remote base drift before preview or after authorization refuses all visible writes',async()=>{
 for(const when of ['preview','publish']){
  const f=await publicationFixture(),grant=when==='publish'?await authorize(f):null;f.refs.set('main',f.candidate);
  await denied(when==='publish'?publish(f,grant):preview(f));noVisibleWrites(f);
 }
});
test('changed source, objective, candidate or canceled job invalidates publication approval',async()=>{
 for(const kind of ['source','objective','candidate','canceled']){
  const f=await publicationFixture(),grant=await authorize(f);
  if(kind==='source')await writeProject(f.project.id,value=>{value.files[0].content+='// newer source';});
  else mutateJob(f.job.id,j=>{if(kind==='objective')j.objective='Another task';if(kind==='candidate')j.result.candidate.patches[0].after+='// altered';if(kind==='canceled')j.status='canceled';});
  await denied(publish(f,grant));noVisibleWrites(f);
 }
});
test('revoked, expired or replaced proof cannot be published',async()=>{
 for(const kind of ['verifier','key','grant','expiry','proof']){
  const f=await publicationFixture(),grant=await authorize(f);
  if(kind==='verifier')environment.OMNI_TRILOGY_VERIFIER_REVOKED='true';
  if(kind==='key')environment.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY=generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'pem'});
  mutateJob(f.job.id,j=>{if(kind==='grant')j.result.trilogy.grant.revoked=true;if(kind==='expiry')j.result.trilogy.grant.expiresAt=Date.now()-1;if(kind==='proof')j.result.trilogy.proof.receipt.signature='altered';});
  await denied(publish(f,grant));noVisibleWrites(f);
 }
});
test('owner stop, publication revoke and expired publication approval each block dispatch',async()=>{
 for(const kind of ['stop','revoke','expiry']){
  const f=await publicationFixture(),grant=await authorize(f);
  if(kind==='stop')database().prepare("INSERT INTO runtime_settings(id,data,updated_at) VALUES('effect-policy',?,?)").run(JSON.stringify({stopped:true}),new Date().toISOString());
  if(kind==='revoke')await publication.revokeTrilogyPublication(f.job.id,grant.authorizationId,f.access);
  if(kind==='expiry')mutateJob(f.job.id,j=>j.result.trilogy.publication.authorization.expiresAt=Date.now()-1);
  await denied(publish(f,grant));noVisibleWrites(f);
 }
});
test('a different connected repository or credential invalidates an earlier approval',async()=>{
 for(const kind of ['repository','credential']){
  const f=await publicationFixture(),grant=await authorize(f),row=database().prepare("SELECT data FROM runtime_settings WHERE id='github'").get();const settings=JSON.parse(row.data);
  if(kind==='repository')settings.repository='fixture/other';else settings.encrypted='changed';database().prepare("UPDATE runtime_settings SET data=? WHERE id='github'").run(JSON.stringify(settings));
  await denied(publish(f,grant));noVisibleWrites(f);
 }
});
test('a rejected or changed specialist review invalidates publication',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);mutateJob(f.job.id,j=>j.result.reviews=[{approved:false,findings:['unresolved']}]);await denied(publish(f,grant));noVisibleWrites(f);
});
test('wrong provider tree cannot be converted into a published tested commit',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);f.setHook(call=>call.method==='POST'&&call.path==='/git/trees'?f.json({sha:f.git(['rev-parse',f.base+'^{tree}'])},201):undefined);
 await denied(publish(f,grant));noVisibleWrites(f);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/commits').length,0);
});
test('provider commit substitution is rejected before any branch or PR',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);f.setHook(call=>call.method==='POST'&&call.path==='/git/commits'?f.json({sha:f.base},201):undefined);
 await denied(publish(f,grant));noVisibleWrites(f);
});

test('a malformed successful final branch read cannot confirm a published draft',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);
 f.setHook(call=>call.method==='GET'&&call.path.startsWith('/git/ref/heads/mgr')&&f.pulls.length?f.json(null):undefined);
 await denied(publish(f,grant));
 assert.equal(f.pulls.length,1);assert.notEqual(resultOf(f.job.id).trilogy.publication.state,'published');
 assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get('exposure-pr-'+f.job.id).status,'active');
});
test('existing candidate branch with different content is never overwritten',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);f.refs.set(grant.preview.candidateRef.replace(/^refs\/heads\//,''),f.base);
 await denied(publish(f,grant));noVisibleWrites(f);assert.ok(f.refs.has('main'));assert.equal(f.refs.get('main'),f.base);
});
test('successful retry reads back the same draft instead of creating duplicates',async()=>{
 const f=await publicationFixture(),grant=await authorize(f),first=await publish(f,grant),visible=f.visibleWrites().length,second=await publish(f,grant);
 assert.deepEqual(second,first);assert.equal(f.pulls.length,1);assert.equal(f.visibleWrites().length,visible);
});
test('remote base drift during object transfer prevents branch publication',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);f.setHook(call=>{if(call.method==='POST'&&call.path==='/git/trees')f.refs.set('main',f.candidate);});
 await denied(publish(f,grant));noVisibleWrites(f);
});
test('revocation during provider reads is not overwritten by an earlier authorization snapshot',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);let revoked=false;
 f.setHook(call=>{if(!revoked&&call.method==='GET'){revoked=true;mutateJob(f.job.id,j=>j.result.trilogy.publication.authorization.revoked=true);}});
 await denied(publish(f,grant));assert.equal(resultOf(f.job.id).trilogy.publication.authorization.revoked,true);noVisibleWrites(f);
});
test('object upload failure permits a controlled retry without duplicate visible writes',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);let failed=false;
 f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/git/blobs'){failed=true;return f.json({message:'fixture unavailable'},503);}});
 await denied(publish(f,grant));assert.ok(failed);noVisibleWrites(f);f.setHook(null);
 await publish(f,grant);assert.equal(f.pulls.length,1);assert.equal(f.visibleWrites().length,2);
});
test('ambiguous PR response is reconciled read-only when the exact draft already exists',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);let failed=false;
 f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/pulls'){
  failed=true;const {body}=call;f.pulls.push({number:1,state:'open',draft:true,merged:false,html_url:'https://github.com/'+f.repositoryId+'/pull/1',head:{ref:body.head,sha:f.refs.get(body.head),repo:{full_name:f.repositoryId}},base:{ref:body.base,sha:f.refs.get(body.base),repo:{full_name:f.repositoryId}}});throw Error('fixture lost response');
 }});
 await denied(publish(f,grant));assert.ok(failed);const written=f.visibleWrites().length;f.setHook(null);
 await publish(f,grant);assert.equal(f.visibleWrites().length,written);assert.equal(f.pulls.length,1);assert.equal(resultOf(f.job.id).trilogy.publication.state,'published');
});
test('lost branch response resumes only the still-unstarted PR after exact branch readback',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);let failed=false;
 f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/git/refs'){failed=true;f.refs.set(call.body.ref.replace(/^refs\/heads\//,''),call.body.sha);throw Error('fixture lost ref response');}});
 await denied(publish(f,grant));assert.ok(failed);f.setHook(null);await publish(f,grant);assert.equal(f.pulls.length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/refs').length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/pulls').length,1);
});
test('concurrent publication attempts produce at most one branch and one draft',async()=>{
 const f=await publicationFixture(),grant=await authorize(f),results=await Promise.allSettled([publish(f,grant),publish(f,grant)]);
 assert.ok(results.some(r=>r.status==='fulfilled'));assert.equal(f.pulls.length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/refs').length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/pulls').length,1);
});
test('publication status and ordinary job responses expose no credentials or signed output',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);await publish(f,grant);const state=await publication.trilogyPublicationStatus(f.job.id,f.access),job=await jobs.readJob(f.job.id),text=JSON.stringify({state,job});
 for(const secret of [...Object.values(f.tokens),resultOf(f.job.id).trilogy.proof.receipt.signature,resultOf(f.job.id).trilogy.proof.outputBase64,'encrypted','connectionDigest'])assert.ok(!text.includes(secret),'leaked '+secret.slice(0,30));
});
test('partial, corrupt or truncated Git trees cannot enter a publication preview',async()=>{
 for(const kind of ['omitted','duplicate','truncated']){
  const f=await publicationFixture();f.setHook(call=>{if(call.method==='GET'&&call.path.startsWith('/git/trees/')){
   const sha=call.path.slice('/git/trees/'.length),entries=f.git(['ls-tree','-r','-t',sha]).split('\n').filter(Boolean).map(line=>{const [meta,path]=line.split('\t'),[mode,type,sha]=meta.split(' ');return {path,mode,type,sha};});
   if(kind==='omitted')entries.pop();if(kind==='duplicate')entries.push(entries[0]);return f.json({sha,truncated:kind==='truncated',tree:entries});
  }});await denied(preview(f));assert.equal(f.mutations().length,0);
 }
});
test('a signed candidate with an unapproved extra file change is refused before uploads',async()=>{
 const f=await publicationFixture({extraCandidateChange:true});await denied(preview(f));assert.equal(f.mutations().length,0);
});
test('real Git directory ordering, executable files and unchanged symlinks retain exact identity',async()=>{
 const f=await publicationFixture({specialTree:true}),grant=await authorize(f);await publish(f,grant);assert.equal(f.pulls[0].head.sha,f.candidate);assert.match(f.git(['ls-tree',f.candidate,'readme-link']),/^120000 blob /);assert.match(f.git(['ls-tree',f.candidate,'src/value.mjs']),/^100755 blob /);
});
test('publication API isolates owner credentials from bridge, reader and worker roles',async()=>{
 const f=await publicationFixture();
 for(const token of [undefined,f.tokens.bridge,f.tokens.reader,f.tokens.worker]){
  assert.equal((await post({action:'publicationPreview',jobId:f.job.id},token)).status,401);
  assert.equal((await get(f.job.id,token,'publication')).status,401);
 }
 const value=await post({action:'publicationPreview',jobId:f.job.id},f.tokens.owner);assert.equal(value.status,200);assert.equal(value.headers.get('cache-control'),'no-store');
 const grant=await post({action:'authorizePublication',jobId:f.job.id,expectedPreview:value.data},f.tokens.owner);assert.equal(grant.status,200,JSON.stringify(grant.data));
 const state=await get(f.job.id,f.tokens.owner,'publication');assert.equal(state.status,200);assert.equal(state.data.publication.authorizationId,grant.data.authorizationId);noVisibleWrites(f);
});
test('publication API refuses cross-origin, unknown authority fields and ambiguous queries',async()=>{
 const f=await publicationFixture();
 assert.equal((await post({action:'publicationPreview',jobId:f.job.id},f.tokens.owner,{Origin:'https://foreign.example'})).status,403);
 for(const value of [{action:'publicationPreview',jobId:f.job.id,approved:true},{action:'authorizePublication',jobId:f.job.id,expectedPreview:{},release:true},{action:'publish',jobId:f.job.id,authorizationId:'x',force:true},{action:'revokePublication',jobId:f.job.id,authorizationId:'x',ownerId:'another'}])assert.equal((await post(value,f.tokens.owner)).status,400);
 const response=await route.GET(new Request('https://omni.example/api/trilogy?jobId='+f.job.id+'&action=publication&action=status',{headers:{Authorization:'Bearer '+f.tokens.owner}}));assert.equal(response.status,400);assert.equal(f.mutations().length,0);
});
test('lost branch response cannot resume after branch tampering or remote base drift',async()=>{
 for(const mutation of ['branch','base']){
  const f=await publicationFixture(),grant=await authorize(f);let failed=false;
  f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/git/refs'){failed=true;f.refs.set(call.body.ref.replace(/^refs\/heads\//,''),call.body.sha);throw Error('fixture lost ref response');}});
  await denied(publish(f,grant));f.setHook(null);const key=mutation==='base'?'main':grant.preview.candidateRef.replace(/^refs\/heads\//,'');f.refs.set(key,mutation==='base'?f.candidate:f.base);const writes=f.visibleWrites().length;
  await denied(publish(f,grant));assert.equal(f.visibleWrites().length,writes);assert.equal(f.pulls.length,0);
 }
});
test('concurrent branch recovery starts the pending draft at most once',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);let failed=false;
 f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/git/refs'){failed=true;f.refs.set(call.body.ref.replace(/^refs\/heads\//,''),call.body.sha);throw Error('fixture lost ref response');}});
 await denied(publish(f,grant));f.setHook(null);const results=await Promise.allSettled([publish(f,grant),publish(f,grant)]);assert.ok(results.some(r=>r.status==='fulfilled'));assert.equal(f.pulls.length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/git/refs').length,1);assert.equal(f.calls.filter(c=>c.method==='POST'&&c.path==='/pulls').length,1);
});
test('base drift during a PR write cannot be recorded as a confirmed publication',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);f.setHook(call=>{if(call.method==='POST'&&call.path==='/pulls')f.refs.set('main',f.candidate);});
 await denied(publish(f,grant));assert.equal(f.pulls.length,1);assert.notEqual(resultOf(f.job.id).trilogy.publication.state,'published');assert.equal(resultOf(f.job.id).repository,undefined);
});
test('revocation during an external write wins without erasing the uncertain effect',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);f.setHook(call=>{if(call.method==='POST'&&call.path==='/pulls')mutateJob(f.job.id,j=>j.result.trilogy.publication.authorization.revoked=true);});
 await denied(publish(f,grant));assert.equal(f.pulls.length,1);const saved=resultOf(f.job.id);assert.equal(saved.trilogy.publication.authorization.revoked,true);assert.notEqual(saved.trilogy.publication.state,'published');assert.equal(saved.repository,undefined);assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get('exposure-pr-'+f.job.id).status,'active');
});
test('competing object retries cannot release the capacity reserved by the winning attempt',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);let failed=false;
 f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/git/blobs'){failed=true;return f.json({message:'temporary fixture failure'},503);}});await denied(publish(f,grant));
 const batch=environment.DB.batch;let arrivals=0,releaseStart,enteredWrite,releaseWrite,firstSettled,winningTimer;
 const start=new Promise(resolve=>{releaseStart=resolve;}),entered=new Promise(resolve=>{enteredWrite=resolve;}),hold=new Promise(resolve=>{releaseWrite=resolve;}),settled=new Promise(resolve=>{firstSettled=resolve;});
 const timer=setTimeout(()=>releaseStart(),250);
 environment.DB.batch=async statements=>{if(statements.some(s=>s.sql.startsWith('UPDATE jobs SET result=')&&JSON.parse(s.args[0]).trilogy?.publication?.state==='publishing'&&JSON.parse(s.args[0]).trilogy?.publication?.phase==='objects')){if(++arrivals>=2)releaseStart();await start;}return batch(statements);};
 let held=false;f.setHook(async call=>{if(!held&&call.method==='POST'&&call.path==='/git/blobs'){held=true;enteredWrite();await hold;}});
 const attempts=[publish(f,grant),publish(f,grant)].map(p=>p.then(value=>({ok:true,value}),error=>{firstSettled();return {ok:false,error};}));
 try{await Promise.race([entered,new Promise((_,reject)=>{winningTimer=setTimeout(()=>reject(Error('no winning retry reached provider')),3000);})]);await settled;assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get('exposure-pr-'+f.job.id).status,'active');}
 finally{clearTimeout(timer);clearTimeout(winningTimer);releaseStart();releaseWrite();environment.DB.batch=batch;await Promise.all(attempts);}
 assert.equal(f.pulls.length,1);
});
test('a failed local start transaction does not strand an approved publication with no provider effects',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);
 database().exec("CREATE TRIGGER block_publication_start BEFORE INSERT ON records WHEN NEW.title='Exact candidate publication attempt started' BEGIN SELECT RAISE(ABORT,'fixture durable audit unavailable'); END");
 await denied(publish(f,grant));noVisibleWrites(f);assert.equal(f.mutations().length,0);assert.equal(resultOf(f.job.id).trilogy.publication.state,'authorized');database().exec('DROP TRIGGER block_publication_start');
 await publish(f,grant);assert.equal(f.pulls.length,1);assert.equal(resultOf(f.job.id).trilogy.publication.state,'published');
});
test('reclaiming a released start reservation still enforces target, recipe and global capacity',async()=>{
 for(const kind of ['target','recipe','global']){
  const f=await publicationFixture(),grant=await authorize(f);
  database().exec("CREATE TRIGGER block_publication_start BEFORE INSERT ON records WHEN NEW.title='Exact candidate publication attempt started' BEGIN SELECT RAISE(ABORT,'fixture durable audit unavailable'); END");await denied(publish(f,grant));database().exec('DROP TRIGGER block_publication_start');
  const source=database().prepare('SELECT * FROM records WHERE id=?').get('exposure-pr-'+f.job.id),count=kind==='global'?5:kind==='recipe'?2:1;
  for(let i=0;i<count;i++){
   const data={...JSON.parse(source.data),state:'active',operationId:'competing-'+i,recipe:kind==='recipe'?'native-maintenance-v1':'other-recipe'};
   database().prepare('INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run('competing-'+i,source.kind,source.title,kind==='target'?f.project.id:'other-project-'+i,'active',JSON.stringify(data),source.created_at,source.updated_at);
  }
  await denied(publish(f,grant));noVisibleWrites(f);assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get(source.id).status,'released');database().prepare("UPDATE records SET status='released' WHERE id LIKE 'competing-%'").run();await publish(f,grant);assert.equal(f.pulls.length,1);
 }
});
test('competing recovery of a released start reservation performs one external operation',async()=>{
 const f=await publicationFixture(),grant=await authorize(f);
 database().exec("CREATE TRIGGER block_publication_start BEFORE INSERT ON records WHEN NEW.title='Exact candidate publication attempt started' BEGIN SELECT RAISE(ABORT,'fixture durable audit unavailable'); END");await denied(publish(f,grant));database().exec('DROP TRIGGER block_publication_start');
 const results=await Promise.allSettled([publish(f,grant),publish(f,grant)]);assert.ok(results.some(r=>r.status==='fulfilled'));assert.equal(f.pulls.length,1);assert.equal(f.visibleWrites().length,2);assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get('exposure-pr-'+f.job.id).status,'released');
});
test('fresh owner approval after an object-only failure keeps recoverable capacity and invalidates the old approval',async()=>{
 for(const change of ['expiry','connection','revoke']){
  const f=await publicationFixture(),first=await authorize(f);let failed=false;
  f.setHook(call=>{if(!failed&&call.method==='POST'&&call.path==='/git/blobs'){failed=true;return f.json({message:'fixture unavailable'},503);}});await denied(publish(f,first));f.setHook(null);
  if(change==='expiry')mutateJob(f.job.id,j=>j.result.trilogy.publication.authorization.expiresAt=Date.now()-1);
  if(change==='connection'){await f.repository.saveRepository({repository:f.repositoryId,token:'fixture-replacement-provider-token'});await f.repository.verifyRepository();}
  if(change==='revoke')await publication.revokeTrilogyPublication(f.job.id,first.authorizationId,f.access);
  const next=await authorize(f);assert.notEqual(next.authorizationId,first.authorizationId);await denied(publish(f,first));noVisibleWrites(f);assert.equal(database().prepare('SELECT status FROM records WHERE id=?').get('exposure-pr-'+f.job.id).status,'active');
  await publish(f,next);assert.equal(f.pulls.length,1);assert.equal(resultOf(f.job.id).trilogy.publication.state,'published');
 }
});
