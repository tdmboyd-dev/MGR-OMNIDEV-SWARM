import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {sign,generateKeyPairSync} from 'node:crypto';
import {fixture,closeStore,database,environment,writeProject,clone,hash,canon,dbSnapshot,mutateJob,resultOf,post,get,contract,control,jobs,route} from './trilogy-fixture.mjs';
after(closeStore);
const stages=async f=>{const pending=await f.pending();assert.equal((await f.save({result:pending.result})).status,200);return pending;};
const audits=id=>database().prepare("SELECT * FROM records WHERE json_extract(data,'$.type')='TrilogyControl' AND json_extract(data,'$.jobId')=?").all(id);

test('separate service roles authorize only their scoped operations and responses are never cached',async()=>{
 const f=await fixture(),before=dbSnapshot();
 for(const token of [undefined,f.tokens.reader,f.tokens.bridge,f.tokens.worker])assert.equal((await post({action:'authorize',jobId:f.job.id,plan:f.plan},token)).status,401);
 assert.deepEqual(dbSnapshot(),before);const auth=await f.authorize();assert.equal(auth.status,200);assert.equal(auth.headers.get('cache-control'),'no-store');
 assert.equal((await get(f.job.id,f.tokens.owner,'grant')).status,401);assert.equal((await get(f.job.id,f.tokens.bridge,'grant')).status,200);
 assert.equal((await get(f.job.id,f.tokens.bridge)).status,401);assert.equal((await get(f.job.id,f.tokens.reader)).status,200);
 environment.OMNI_TRILOGY_READ_TOKEN=environment.OMNI_TRILOGY_OWNER_TOKEN;assert.equal((await get(f.job.id,f.tokens.owner)).status,503);
});
test('project, repository and job-reader scope are enforced even with a valid service token',async()=>{
 const f=await fixture();await f.authorize();const before=dbSnapshot();
 assert.equal((await get('another-job',f.tokens.reader)).status,403);assert.equal((await post({action:'revoke',jobId:'another-job'},f.tokens.owner)).status,403);
 environment.OMNI_TRILOGY_SCOPE=JSON.stringify({ownerId:f.ownerId,projectId:f.project.id,repositoryId:'other/repository'});
 assert.equal((await get(f.job.id,f.tokens.reader)).status,403);assert.deepEqual(dbSnapshot(),before);
});
test('new grants require a committed origin and exact existing candidate bytes; they never execute or apply it',async()=>{
 const f=await fixture(),before=dbSnapshot();
 for(const changes of [{confidence:1},{requiresOwnerApproval:false},{commit:'e'.repeat(40)},{planSha256:'e'.repeat(64)}])assert.notEqual((await post({action:'authorize',jobId:f.job.id,plan:{...f.plan,...changes}},f.tokens.owner)).status,200);
 const altered=clone(f.plan);altered.proposals[0].afterHash='f'.repeat(64);const {id,planSha256,...body}=altered;altered.planSha256=hash(canon(body));altered.id='IMP-'+altered.planSha256.slice(0,24);
 assert.notEqual((await post({action:'authorize',jobId:f.job.id,plan:altered},f.tokens.owner)).status,200);assert.deepEqual(dbSnapshot(),before);
 const approved=await f.authorize();assert.equal(approved.status,200);assert.equal(approved.data.grant.permission,'candidate-only');assert.match(approved.data.grant.request.candidateRef,/^refs\/heads\/mgr\/candidates\//);assert.equal(resultOf(f.job.id).externalTests,null);
});
test('same authorization and result replay produce one transition and one audit',async()=>{
 const f=await fixture(),pending=await stages(f);assert.equal((await f.authorize()).status,200);const count=audits(f.job.id).length;
 assert.equal((await f.save({result:pending.result})).data.replayed,true);assert.equal(audits(f.job.id).length,count);
});
test('concurrent identical submissions cannot append a losing transaction audit',async()=>{
 const f=await fixture(),pending=await f.pending(),count=audits(f.job.id).length;
 const results=await Promise.all([f.save({result:pending.result}),f.save({result:pending.result})]);
 assert.equal(results.filter(x=>x.status===200&&!x.data.replayed).length,1);
 assert.equal(audits(f.job.id).length,count+1);assert.equal(resultOf(f.job.id).trilogy.statusRevision,2);
});
test('audit insertion failure rolls back the grant together with its job state',async()=>{
 const f=await fixture(),before=dbSnapshot();database().exec("CREATE TRIGGER block_trilogy_audit BEFORE INSERT ON records WHEN json_extract(NEW.data,'$.type')='TrilogyControl' BEGIN SELECT RAISE(ABORT,'fixture audit failure'); END");
 assert.notEqual((await f.authorize()).status,200);assert.deepEqual(dbSnapshot(),before);
});
test('revocation, expiry and the owner stop switch reject reads, retries and reports without mutating evidence',async()=>{
 for(const failure of ['revoked','expired','stopped']){
  const f=await fixture(),pending=await stages(f);
  if(failure==='revoked')assert.equal((await post({action:'revoke',jobId:f.job.id},f.tokens.owner)).status,200);
  if(failure==='expired')mutateJob(f.job.id,j=>j.result.trilogy.grant.expiresAt=Date.now()-1);
  if(failure==='stopped')database().prepare("INSERT INTO runtime_settings(id,data,updated_at) VALUES('effect-policy',?,?)").run(JSON.stringify({stopped:true}),new Date().toISOString());
  const before=dbSnapshot();assert.equal((await get(f.job.id,f.tokens.reader)).status,403);assert.equal((await f.save({result:pending.result})).status,403);assert.deepEqual(dbSnapshot(),before);
 }
});
test('a newer source, objective, candidate or canceled job invalidates its grant',async()=>{
 for(const mutation of ['source','objective','candidate','cancel']){
  const f=await fixture(),pending=await stages(f);
  if(mutation==='source')await writeProject(f.project.id,data=>data.files[0].content+='// changed');
  else mutateJob(f.job.id,j=>{if(mutation==='objective')j.objective='Different objective';if(mutation==='candidate')j.result.candidate.patches[0].after+='changed';if(mutation==='cancel')j.status='canceled';});
  assert.equal((await f.save({result:pending.result})).status,403);assert.equal((await get(f.job.id,f.tokens.reader)).status,403);
 }
});
test('signed verification requires prior candidate stage and never grants release authority',async()=>{
 const f=await fixture(),pending=await f.pending();assert.equal((await f.save(await f.verified(pending))).status,409);
 assert.equal((await f.save({result:pending.result})).status,200);const signed=await f.verified(pending),accepted=await f.save(signed);assert.equal(accepted.status,200);
 const viewed=await get(f.job.id,f.tokens.reader);assert.equal(viewed.status,200);assert.equal(viewed.data.result.state,'verified-pending-owner');assert.equal(viewed.data.result.merged,false);assert.equal(viewed.data.result.released,false);assert.equal(viewed.data.execution.isolationVerified,false);
 for(const secret of [f.tokens.owner,f.tokens.bridge,f.tokens.reader,signed.outputBase64,signed.receipt.signature,'PRIVATE KEY','export const value'])assert.ok(!JSON.stringify(viewed.data).includes(secret));
});
test('Boolean passes, rewritten history, substituted candidates and shifted files cannot become evidence',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending),before=dbSnapshot();
 for(const patch of [{receipt:true},{receipt:{...signed.receipt,signature:'invalid'}},{outputBase64:Buffer.from('different').toString('base64')},{result:{...signed.result,candidateCommit:'e'.repeat(40)}},{result:{...signed.result,files:[]}}, {result:{...signed.result,merged:true}}])assert.notEqual((await f.save({...signed,...patch})).status,200);
 const changed=clone(signed);changed.result.evidence.eventRefs[0].hash='f'.repeat(64);assert.equal((await f.save(changed)).status,409);assert.deepEqual(dbSnapshot(),before);
});
test('expired or replaced verifier cannot keep an old verified result visible',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending);assert.equal((await f.save(signed)).status,200);
 environment.OMNI_TRILOGY_VERIFIER_REVOKED='true';assert.equal((await get(f.job.id,f.tokens.reader)).status,503);
 environment.OMNI_TRILOGY_VERIFIER_REVOKED='false';environment.OMNI_TRILOGY_VERIFIER_PUBLIC_KEY=generateKeyPairSync('ed25519').publicKey.export({type:'spki',format:'pem'});assert.notEqual((await get(f.job.id,f.tokens.reader)).status,200);
});
test('validly signed output from before staging is still rejected',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending),old=new Date(Date.now()-60000).toISOString();
 const {signature,...body}=signed.receipt;body.startedAt=old;body.endedAt=old;signed.receipt={...body,signature:sign(null,Buffer.from(canon(body)),f.keys.privateKey).toString('base64')};Object.assign(signed.result.verification,{startedAt:old,endedAt:old,receiptSha256:hash(canon(signed.receipt))});
 assert.notEqual((await f.save(signed)).status,200);
});
test('empty output or malformed request identity never qualifies',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending);signed.outputBase64='';assert.notEqual((await f.save(signed)).status,200);
 assert.throws(()=>contract.validateRequest({...pending.request,candidateRef:'refs/heads/mgr/candidates/'+'-'.repeat(36)}));
});
test('worker assignment waits for a candidate commit and binds the live grant',async()=>{
 const f=await fixture();await f.authorize();await assert.rejects(jobs.workerJob(f.job.id));
 const pending=await stages(f),assignment=await jobs.workerJob(f.job.id);assert.equal(assignment.trilogy.candidateCommit,pending.result.candidateCommit);assert.equal(assignment.trilogy.requestSha256,pending.grant.requestSha256);assert.equal(assignment.assignment.trilogyBindingDigest,await hash(JSON.stringify(assignment.trilogy)));
});
test('generic worker Boolean success cannot qualify a trilogy job',async()=>{
 const f=await fixture();await stages(f);const assignment=await jobs.workerJob(f.job.id),before=dbSnapshot();
 await assert.rejects(jobs.report(f.job.id,{passed:true,output:'pretend pass',worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assignment.assignment}));assert.deepEqual(dbSnapshot(),before);
});
test('scoped worker report fixture keeps exact signed proof and allows verified replay without rerunning',async()=>{
 const f=await fixture(),pending=await stages(f),assignment=await jobs.workerJob(f.job.id),signed=await f.verified(pending);
 const p={passed:true,output:Buffer.from(signed.outputBase64,'base64').toString('utf8'),worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assignment.assignment,trilogyReceipt:signed.receipt,trilogySignerId:environment.OMNI_TRILOGY_VERIFIER_ID};
 // This checks report admission with disposable fixture credentials/cleanup,
 // not physical Docker isolation or an independent deployed signer.
 const saved=await jobs.report(f.job.id,p);assert.equal(saved.result.externalTests.isolationVerified,false);
 const first=await get(f.job.id,f.tokens.bridge,'execution');assert.equal(first.status,200);assert.equal(first.data.available,true);assert.deepEqual(first.data.receipt,signed.receipt);
 assert.equal((await f.save(signed)).status,200);const replay=await get(f.job.id,f.tokens.bridge,'execution');assert.equal(replay.status,200);assert.deepEqual(replay.data.receipt,signed.receipt);
 assert.equal((await f.save(signed)).data.replayed,true);
 const visible=JSON.stringify(jobs.publicJob(await jobs.report(f.job.id,p).catch(()=>saved)));assert.ok(!visible.includes(signed.receipt.signature));assert.ok(!visible.includes(signed.outputBase64));
});
test('stopped or revoked grant cannot accept an already issued worker report',async()=>{
 for(const failure of ['revoked','stopped']){
  const f=await fixture(),pending=await stages(f),assignment=await jobs.workerJob(f.job.id),signed=await f.verified(pending);
  if(failure==='revoked')assert.equal((await post({action:'revoke',jobId:f.job.id},f.tokens.owner)).status,200);
  else database().prepare("INSERT INTO runtime_settings(id,data,updated_at) VALUES('effect-policy',?,?)").run(JSON.stringify({stopped:true}),new Date().toISOString());
  const before=dbSnapshot();await assert.rejects(jobs.report(f.job.id,{passed:true,output:Buffer.from(signed.outputBase64,'base64').toString('utf8'),worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assignment.assignment,trilogyReceipt:signed.receipt,trilogySignerId:environment.OMNI_TRILOGY_VERIFIER_ID}));assert.deepEqual(dbSnapshot(),before);
 }
});
test('verifier revocation during signature checking cannot be persisted as a successful worker report',async()=>{
 const f=await fixture(),pending=await stages(f),assignment=await jobs.workerJob(f.job.id),signed=await f.verified(pending),before=dbSnapshot();
 const verify=crypto.subtle.verify;crypto.subtle.verify=async function(...args){const valid=await verify.apply(this,args);environment.OMNI_TRILOGY_VERIFIER_REVOKED='true';return valid;};
 try{await assert.rejects(jobs.report(f.job.id,{passed:true,output:Buffer.from(signed.outputBase64,'base64').toString('utf8'),worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assignment.assignment,trilogyReceipt:signed.receipt,trilogySignerId:environment.OMNI_TRILOGY_VERIFIER_ID}));assert.deepEqual(dbSnapshot(),before);}finally{crypto.subtle.verify=verify;}
});
test('existing snapshot apply cannot bypass a trilogy job still awaiting signed verification',async()=>{
 const f=await fixture();await stages(f);const before=dbSnapshot();await assert.rejects(jobs.decide(f.job.id,'apply'),/verified|verification/i);assert.deepEqual(dbSnapshot(),before);
});
test('explicit owner snapshot apply succeeds only after current exact proof is accepted',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending);assert.equal((await f.save(signed)).status,200);
 const applied=await jobs.decide(f.job.id,'apply');assert.equal(applied.status,'applied');assert.equal(applied.result.trilogy.result.released,false);assert.equal(applied.result.trilogy.result.merged,false);
});
test('concurrent revocation cannot be overwritten by snapshot apply',async()=>{
 const f=await fixture(),pending=await stages(f);assert.equal((await f.save(await f.verified(pending))).status,200);
 const beforeFiles=JSON.parse(database().prepare('SELECT data FROM records WHERE id=?').get(f.project.id).data).files,batch=environment.DB.batch;
 environment.DB.batch=async statements=>{if(statements.some(s=>s.sql.includes("SET status='applying'")))mutateJob(f.job.id,j=>j.result.trilogy.grant.revoked=true);return batch(statements);};
 await assert.rejects(jobs.decide(f.job.id,'apply'));assert.equal(resultOf(f.job.id).trilogy.grant.revoked,true);assert.deepEqual(JSON.parse(database().prepare('SELECT data FROM records WHERE id=?').get(f.project.id).data).files,beforeFiles);
});
test('candidate-only trilogy grants cannot enter the generic unbound GitHub publisher',async()=>{
 const f=await fixture();await stages(f);const repository=await import('../.test-runtime/repository.mjs');await assert.rejects(repository.createPullRequest(f.job.id),/candidate-only/i);
});
test('revocation during execution-proof verification refuses the output read',async()=>{
 const f=await fixture(),pending=await stages(f),assignment=await jobs.workerJob(f.job.id),signed=await f.verified(pending);
 await jobs.report(f.job.id,{passed:true,output:Buffer.from(signed.outputBase64,'base64').toString('utf8'),worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assignment.assignment,trilogyReceipt:signed.receipt,trilogySignerId:environment.OMNI_TRILOGY_VERIFIER_ID});
 const verify=crypto.subtle.verify;let revoked=false;crypto.subtle.verify=async function(...args){const valid=await verify.apply(this,args);assert.equal((await post({action:'revoke',jobId:f.job.id},f.tokens.owner)).status,200);revoked=true;return valid;};
 try{const response=await get(f.job.id,f.tokens.bridge,'execution');assert.ok(revoked);assert.notEqual(response.status,200);assert.ok(!JSON.stringify(response.data).includes(signed.outputBase64));}finally{crypto.subtle.verify=verify;}
});
test('revocation during a verified replay cannot return accepted',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending);assert.equal((await f.save(signed)).status,200);
 const verify=crypto.subtle.verify;crypto.subtle.verify=async function(...args){const valid=await verify.apply(this,args);assert.equal((await post({action:'revoke',jobId:f.job.id},f.tokens.owner)).status,200);return valid;};
 try{assert.notEqual((await f.save(signed)).status,200);assert.equal(resultOf(f.job.id).trilogy.grant.revoked,true);}finally{crypto.subtle.verify=verify;}
});
test('objective change at the durable result write cannot record stale candidate evidence',async()=>{
 const f=await fixture(),pending=await f.pending(),before=resultOf(f.job.id),count=audits(f.job.id).length,batch=environment.DB.batch;
 environment.DB.batch=async statements=>{if(statements.some(s=>s.sql.includes('UPDATE jobs SET result=')))mutateJob(f.job.id,j=>j.objective='Changed during durable write');return batch(statements);};
 assert.notEqual((await f.save({result:pending.result})).status,200);assert.deepEqual(resultOf(f.job.id),before);assert.equal(audits(f.job.id).length,count);
});
test('grant expiry during signature verification cannot persist verified evidence',async()=>{
 const f=await fixture(),pending=await stages(f),signed=await f.verified(pending),before=dbSnapshot(),verify=crypto.subtle.verify,now=Date.now;
 crypto.subtle.verify=async function(...args){const valid=await verify.apply(this,args);Date.now=()=>pending.grant.expiresAt+1;return valid;};
 try{assert.notEqual((await f.save(signed)).status,200);assert.deepEqual(dbSnapshot(),before);}finally{crypto.subtle.verify=verify;Date.now=now;}
});
test('grant expiry while a database write waits is checked by the database clock',async()=>{
 const f=await fixture(),pending=await stages(f);mutateJob(f.job.id,j=>j.result.trilogy.grant.expiresAt=Date.now()+250);const signed=await f.verified(pending),before=dbSnapshot(),batch=environment.DB.batch;let delayed=false;
 environment.DB.batch=async statements=>{if(statements.some(s=>s.sql.includes('UPDATE jobs SET result='))){delayed=true;await new Promise(resolve=>setTimeout(resolve,300));}return batch(statements);};
 assert.notEqual((await f.save(signed)).status,200);assert.ok(delayed);assert.deepEqual(dbSnapshot(),before);
});
test('snapshot application refuses a grant that expires while effect capacity is reserved',async()=>{
 const f=await fixture(),pending=await stages(f);assert.equal((await f.save(await f.verified(pending))).status,200);
 const before=JSON.parse(database().prepare('SELECT data FROM records WHERE id=?').get(f.project.id).data),prepare=environment.DB.prepare,now=Date.now;let advanced=false;
 environment.DB.prepare=sql=>{const statement=prepare(sql),bind=statement.bind;statement.bind=function(...args){const bound=bind.apply(this,args),run=bound.run;bound.run=async function(){const value=await run.call(this);if(sql.startsWith('INSERT OR IGNORE INTO records')&&args[1]==='exposure'){Date.now=()=>pending.grant.expiresAt+1;advanced=true;}return value;};return bound;};return statement;};
 try{await assert.rejects(jobs.decide(f.job.id,'apply'));assert.ok(advanced);assert.equal(database().prepare('SELECT status FROM jobs WHERE id=?').get(f.job.id).status,'awaiting review');assert.deepEqual(JSON.parse(database().prepare('SELECT data FROM records WHERE id=?').get(f.project.id).data),before);}finally{Date.now=now;}
});
for(const action of ['assignment','report'])test('objective change at worker '+action+' write refuses stale authorization',async()=>{
 const f=await fixture(),pending=await stages(f),assignment=action==='report'?await jobs.workerJob(f.job.id):null,signed=action==='report'?await f.verified(pending):null,before=resultOf(f.job.id),prepare=environment.DB.prepare;let mutated=false;
 environment.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('UPDATE jobs SET result=')){const bind=statement.bind;statement.bind=function(...args){const bound=bind.apply(this,args),run=bound.run;bound.run=async function(){if(!mutated){mutateJob(f.job.id,j=>j.objective='Different objective at worker write');mutated=true;}return run.call(this);};return bound;};}return statement;};
 const request=action==='assignment'?jobs.workerJob(f.job.id):jobs.report(f.job.id,{passed:true,output:Buffer.from(signed.outputBase64,'base64').toString('utf8'),worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assignment.assignment,trilogyReceipt:signed.receipt,trilogySignerId:environment.OMNI_TRILOGY_VERIFIER_ID});
 await assert.rejects(request);assert.ok(mutated);assert.deepEqual(resultOf(f.job.id),before);
});
test('duplicate event identities or evidence beyond the fixed protocol do not enter the durable record',async()=>{
 const f=await fixture(),pending=await f.pending(),before=dbSnapshot();const bad=clone(pending.result);bad.evidence.eventRefs[1].kind='trilogy.job_bound';assert.notEqual((await f.save({result:bad})).status,200);assert.deepEqual(dbSnapshot(),before);
});
test('request body byte limit and strict UTF-8 hold for multibyte or malformed input',async()=>{
 const f=await fixture();const response=await route.POST(new Request('https://omni.example/api/trilogy',{method:'POST',headers:{Authorization:'Bearer '+f.tokens.owner},body:JSON.stringify({action:'authorize',jobId:f.job.id,plan:'é'.repeat(128001)})}));assert.equal(response.status,413);
 const invalid=await route.POST(new Request('https://omni.example/api/trilogy',{method:'POST',headers:{Authorization:'Bearer '+f.tokens.owner},body:new Uint8Array([0xff,0xfe])}));assert.equal(invalid.status,400);
});
test('API refuses cross-origin, unexpected authority fields, ambiguous reads and oversized bodies',async()=>{
 const f=await fixture();assert.equal((await post({action:'authorize',jobId:f.job.id,plan:f.plan},f.tokens.owner,{Origin:'https://other.example'})).status,403);
 assert.equal((await post({action:'authorize',jobId:f.job.id,plan:f.plan,approved:true},f.tokens.owner)).status,400);
 const response=await route.GET(new Request('https://omni.example/api/trilogy?jobId=a&jobId=b',{headers:{Authorization:'Bearer '+f.tokens.reader}}));assert.equal(response.status,400);
 const large=await route.POST(new Request('https://omni.example/api/trilogy',{method:'POST',headers:{Authorization:'Bearer '+f.tokens.owner},body:' '.repeat(256001)}));assert.equal(large.status,413);
});
