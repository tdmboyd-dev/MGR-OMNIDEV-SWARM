import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Actual SQLite and prepared production handlers. No native process, provider,
// private policy, existing owner record or external repository is used.
const sql=new DatabaseSync(':memory:');
for(const p of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(p,'utf8'));
let beforeRun=null;
class Statement{
 constructor(query,args=[]){this.query=query;this.args=args;}
 bind(...args){return new Statement(this.query,args);}
 async first(){return sql.prepare(this.query).get(...this.args)??null;}
 async all(){return {results:sql.prepare(this.query).all(...this.args)};}
 async run(){if(beforeRun&&this.query.startsWith('UPDATE jobs SET result=')){const fn=beforeRun;beforeRun=null;fn();}return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}
}
globalThis.__omniEnv={DB:{prepare:q=>new Statement(q),batch:async statements=>{sql.exec('BEGIN');try{const values=statements.map(s=>({meta:{changes:Number(sql.prepare(s.query).run(...s.args).changes)}}));sql.exec('COMMIT');return values;}catch(e){sql.exec('ROLLBACK');throw e;}}}};
const jobs=await import('../.test-runtime/jobs.mjs');
const files=[{path:'tests/omni-snapshot.test.mjs',content:'// immutable owner oracle\n'}];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const command=['node','--preserve-symlinks','--preserve-symlinks-main','--test','--test-isolation=none','tests/omni-snapshot.test.mjs'];
const policy={version:1,enabled:true,hostId:'fixture-not-qualified',launcherSha256:'a'.repeat(64),runtimeSha256:'b'.repeat(64),qualificationDigest:'c'.repeat(64),scope:'approved-mgr-snapshot',allowedSourceDigests:[hash(files)],allowedCandidateDigests:[hash(files)],allowedTestManifestDigests:[hash(command)]};
function seed(id,status='awaiting review',extra={}){
 const payload={workerKind:'windows-appcontainer',testProfile:'snapshot',baseline:files},result={checks:{passed:true},candidate:{patches:[],experts:[]},...extra};
 sql.prepare('INSERT INTO jobs(id,project_id,objective,mode,status,phase,payload,result,created_at,updated_at,attempts,lease_token,lease_until) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,'project-'+id,'preserve native verification','account',status,'review',JSON.stringify(payload),JSON.stringify(result),'now','now','1','lease','2000-01-01T00:00:00.000Z');
 return {payload,result};
}
const row=id=>({...sql.prepare('SELECT * FROM jobs WHERE id=?').get(id)});
for(const state of ['reserved','executing','unknown'])test('held '+state+' job refuses decisions, movement and candidate replacement',async()=>{
 const id='held-'+state,extra=state==='unknown'?{nativeExecutionUnknown:true}:{verificationOwner:{requestId:'owner-request',state}};
 seed(id,'awaiting review',extra);const before=row(id);
 for(const action of ['cancel','reject','retry','apply','rollback'])await assert.rejects(jobs.decide(id,action),/ownership is held/);
 await assert.rejects(jobs.moveJob(id,'elsewhere'),/ownership is held/);
 await assert.rejects(jobs.switchRepository(id,'elsewhere'),/ownership is held/);
 await assert.rejects(jobs.submitAccountCandidate(id,{}),/ownership is held/);
 await assert.rejects(jobs.workerJob(id,'windows-appcontainer'),/ownership is held/);
 assert.deepEqual(row(id),before);
});
test('only exact verification request can cancel its queued reservation',async()=>{
 seed('matching-cancel','queued',{verificationOwner:{requestId:'owner-request',state:'reserved'}});
 await assert.rejects(jobs.decide('matching-cancel','cancel','other-request'),/ownership is held/);
 assert.equal((await jobs.decide('matching-cancel','cancel','owner-request')).status,'canceled');
 seed('uncertain-cancel','queued',{nativeExecutionUnknown:true,verificationOwner:{requestId:'owner-request',state:'executing'}});
 await assert.rejects(jobs.decide('uncertain-cancel','cancel','owner-request'),/ownership is held/);
});
test('settled receipt with explicit false flag keeps ordinary lifecycle compatibility',async()=>{
 for(const [action,start,end] of [['cancel','queued','canceled'],['reject','awaiting review','rejected'],['retry','failed','queued']]){
  const id='settled-'+action;seed(id,start,{nativeExecutionUnknown:false,verificationOwner:{requestId:'historical',state:'settled'}});
  assert.equal((await jobs.decide(id,action)).status,end);
 }
});
test('lease recovery skips reserved and uncertain jobs without removing evidence',async()=>{
 for(const [id,extra] of [['recover-reserved',{verificationOwner:{requestId:'request',state:'reserved'}}],['recover-unknown',{nativeExecutionUnknown:true}]]){
  seed(id,'running',extra);const before=row(id);await jobs.recover();assert.deepEqual(row(id),before);
 }
 seed('recover-settled','running',{nativeExecutionUnknown:false,verificationOwner:{requestId:'old',state:'settled'}});
 await jobs.recover();assert.equal(row('recover-settled').status,'queued');
});
for(const change of ['payload','objective','stop'])test('native claim refuses concurrent '+change+' at its final SQLite update',async()=>{
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify(policy);
 const id='claim-'+change;seed(id);
 beforeRun=()=>{
  if(change==='payload'){const p=JSON.parse(row(id).payload);p.baseline=[{path:'other.mjs',content:'changed'}];sql.prepare('UPDATE jobs SET payload=? WHERE id=?').run(JSON.stringify(p),id);}
  else if(change==='objective')sql.prepare('UPDATE jobs SET objective=? WHERE id=?').run('changed owner objective',id);
  else sql.prepare("INSERT OR REPLACE INTO runtime_settings(id,data,updated_at) VALUES('effect-policy',?,'now')").run(JSON.stringify({stopped:true}));
 };
 try{await assert.rejects(jobs.workerJob(id,'windows-appcontainer'),/Candidate changed while assigning/);assert.equal(JSON.parse(row(id).result).workerAssignment,undefined);}
 finally{beforeRun=null;sql.prepare("DELETE FROM runtime_settings WHERE id='effect-policy'").run();delete globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON;}
});
test('unheld approved native claim retains original job correlation link and records uncertainty',async()=>{
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify(policy);
 try{seed('claim-control');const assigned=await jobs.workerJob('claim-control','windows-appcontainer');assert.equal(assigned.assignment.workerKind,'windows-appcontainer');assert.ok(assigned.assignment.trilogyLink);assert.equal(JSON.parse(row('claim-control').result).nativeExecutionUnknown,true);await assert.rejects(jobs.workerJob('claim-control','windows-appcontainer'),/reconciliation/);}
 finally{delete globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON;}
});
for(const operation of ['clearSnapshot','disconnect','delete'])test('project '+operation+' refuses to remove a held verification source',async()=>{
 const id='project-control-'+operation;seed(id,'awaiting review',{verificationOwner:{requestId:'held',state:'reserved'}});
 const projectId='project-'+id,data=JSON.stringify({files,title:'Held source'});
 sql.prepare("INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at) VALUES(?,'project','Held source','','analyzed',?,'now','now')").run(projectId,data);
 await assert.rejects(jobs.manageProject({projectId,confirmation:'Held source',operation}),/Finish or cancel active jobs/);
 assert.equal(sql.prepare('SELECT data FROM records WHERE id=?').get(projectId).data,data);assert.ok(row(id));
});
