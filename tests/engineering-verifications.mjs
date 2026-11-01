import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';import {EngineeringVerifications,canonical} from '../scripts/engineering-verifications.mjs';
const digest=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');const input={requestId:'software-regression',workspaceId:'11111111-1111-4111-8111-111111111111',jobId:'22222222-2222-4222-8222-222222222222',sourceDigest:'a'.repeat(64),candidateDigest:'b'.repeat(64),testManifestDigest:'c'.repeat(64)};const config={actorId:'test',tenantId:'test',nativePolicyPath:'test-policy',nativeWorkerRoot:'test-native',nativeReceiptRoot:'test-receipts'};let checks=0;
function subject(){const sql=new DatabaseSync(':memory:');sql.exec("CREATE TABLE records(id TEXT PRIMARY KEY,kind TEXT,title TEXT,project_id TEXT,status TEXT,data TEXT,created_at TEXT,updated_at TEXT);CREATE TABLE jobs(id TEXT PRIMARY KEY,project_id TEXT,status TEXT,payload TEXT,result TEXT,updated_at TEXT)");const x=new EngineeringVerifications(sql,config,{});x.schedule=()=>{};const record={...input,actorId:'test',tenantId:'test',revision:0,status:'queued',cancelRequested:false,workspaceDataDigest:'f'.repeat(64),inputDigest:digest({actorId:'test',tenantId:'test',...input}),policyIdentity:{hostId:'test',launcherSha256:'1'.repeat(64),runtimeSha256:'2'.repeat(64),qualificationDigest:'3'.repeat(64)}};sql.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?)').run(x.key(input.requestId),'engineering_verify','test','','queued',JSON.stringify(record),'now','now');sql.prepare('INSERT INTO jobs VALUES(?,?,?,?,?,?)').run(input.jobId,input.workspaceId,'awaiting review','{}',JSON.stringify({verificationOwner:{requestId:input.requestId,state:'reserved'}}),'now');return{x,sql,record};}
{
 const{x,sql}=subject();x.isCurrent=async()=>true;x.jobs.decide=async()=>{sql.prepare("UPDATE jobs SET status='canceled' WHERE id=?").run(input.jobId)};x.change(input.requestId,r=>({...r,cancelRequested:true}));await x.execute(input.requestId);assert.equal(x.load(input.requestId).status,'cancelled');assert.equal(x.row(input.jobId).status,'canceled');assert.equal(x.active.size,0);checks++;sql.close();
}
{
 const{x,sql}=subject();sql.prepare('UPDATE jobs SET result=?').run(JSON.stringify({workerAssignment:{id:'durable-claim',expiresAt:1},verificationOwner:{requestId:input.requestId,state:'reserved'}}));await x.recover();assert.equal(x.load(input.requestId).status,'unknown');assert.ok(x.row(input.jobId).result.nativeExecutionUnknown);checks++;sql.close();
}
{
 const{x,sql}=subject();sql.prepare('DELETE FROM jobs').run();await x.recover();assert.equal(x.load(input.requestId).status,'unknown');checks++;sql.close();
}
{
 const{x,sql,record}=subject();x.isCurrent=async()=>true;let claimed=false;x.jobs={engineeringBinding:async()=>({...record,currentBindingVerified:true,candidateDigest:'d'.repeat(64)}),workerJob:async()=>{claimed=true;throw Error('unexpected')}};await x.execute(input.requestId);assert.equal(claimed,false);assert.equal(x.load(input.requestId).status,'unknown');checks++;sql.close();
}
{
 const{x,sql,record}=subject();x.isCurrent=async()=>true;x.jobs={engineeringBinding:async()=>({...record,currentBindingVerified:true}),workerJob:async()=>({id:input.jobId,profile:'snapshot',workerKind:'windows-appcontainer',assignment:{...record,...record.policyIdentity,launcherSha256:'4'.repeat(64)}})};await x.execute(input.requestId);assert.equal(x.load(input.requestId).status,'unknown');assert.equal(x.load(input.requestId).rawReport,undefined);checks++;sql.close();
}
{
 const{x,sql}=subject();for(const key of ['requestId','workspaceId','jobId','sourceDigest','candidateDigest','testManifestDigest'])await assert.rejects(()=>x.admit({...input,[key]:[input[key]]}),/Invalid exact/);checks++;sql.close();
}
{
 const{x,sql,record}=subject();sql.prepare("DELETE FROM records WHERE kind='engineering_verify'").run();const data=JSON.stringify({files:[]});const workspaceDataDigest=createHash('sha256').update(data).digest('hex');sql.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?)').run(input.workspaceId,'project','test','','active',JSON.stringify(JSON.parse(data),null,2),'now','now');sql.prepare('UPDATE jobs SET result=?').run('{}');x.jobs.engineeringBinding=async()=>({...record,workspaceDataDigest,currentBindingVerified:true});const replies=await Promise.all([x.admit(input),x.admit(input)]);assert.equal(replies[0].inputDigest,replies[1].inputDigest);assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM records WHERE kind='engineering_verify'").get().n,1);assert.equal(x.row(input.jobId).result.verificationOwner.requestId,input.requestId);checks++;sql.close();
}
console.log(JSON.stringify({passed:checks,scope:'Actual service methods and real in-memory SQLite; protocol/software negatives only, no native execution'}));

