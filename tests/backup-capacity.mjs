import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {after, beforeEach, test} from 'node:test';

// Execute the application against real SQLite transactions. Production D1
// operation, recovery objectives and credential custody are separate gates.
const environment={DB:null};
globalThis.__omniEnv=environment;
let sqlite,batches;
function openStore(){
 sqlite?.close(); sqlite=new DatabaseSync(':memory:'); batches=[];
 for(const path of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sqlite.exec(readFileSync(path,'utf8'));
 class Statement {
  constructor(sql,args=[]){this.sql=sql;this.args=args;}
  bind(...args){return new Statement(this.sql,args);}
  async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
  async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
  async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}
 }
 environment.DB={prepare:sql=>new Statement(sql),batch:async statements=>{
  batches.push(statements);sqlite.exec('BEGIN');
  try{const result=statements.map(statement=>({meta:{changes:Number(sqlite.prepare(statement.sql).run(...statement.args).changes)}}));sqlite.exec('COMMIT');return result;}
  catch(error){sqlite.exec('ROLLBACK');throw error;}
 }};
}
openStore();
const intelligence=await import('../.test-runtime/intelligence.mjs');
const route=await import('../.test-runtime/intelligence-route.mjs');
const {fingerprint}=await import('../.test-runtime/control-plane.mjs');
beforeEach(openStore);after(()=>sqlite.close());
const now='2026-10-30T07:00:00.000Z';
async function archive(recordCount=1000,jobCount=600){
 const records=Array.from({length:recordCount},(_,i)=>({id:i?'memory-'+i:'project',kind:i?'memory':'project',title:i?'History '+i:'Project',project_id:i?'project':'',status:'active',data:JSON.stringify(i?{content:'Saved 🧡 result '+i}:{files:[],analysis:{nodes:[],edges:[]}}),created_at:now,updated_at:now}));
 const jobs=Array.from({length:jobCount},(_,i)=>({id:'job-'+i,project_id:'project',objective:'Saved job '+i,mode:'native',status:i%2?'running':'queued',phase:'test',payload:'{"sourceProjectId":"project"}',result:'{"output":"retained"}',attempts:String(i%3),created_at:now,updated_at:now}));
 const snapshot={records,jobs};return {format:'omnidev-owner-snapshot',version:1,exportedAt:now,snapshot,digest:await fingerprint(snapshot)};
}
async function resign(backup){backup.digest=await fingerprint(backup.snapshot);return backup;}
function counts(){return {records:sqlite.prepare('SELECT count(*) n FROM records').get().n,jobs:sqlite.prepare('SELECT count(*) n FROM jobs').get().n,settings:sqlite.prepare('SELECT count(*) n FROM runtime_settings').get().n};}
const sortRows=rows=>[...rows].sort((a,b)=>a.id.localeCompare(b.id));

test('DATA-03 restores 1,600 records/jobs atomically and preserves text without restarting jobs',async()=>{
 const backup=await archive();backup.snapshot.records[1].data=JSON.stringify({content:'Quotes " / backslash \\ / newline\n / emoji 🧡 / null \u0000',nested:{accepted:false,number:12}});await resign(backup);
 const result=await intelligence.restoreBackup(backup);
 assert.equal(result.restored,true);assert.equal(result.resumed,false);
 assert.deepEqual(counts(),{records:1000,jobs:600,settings:0});assert.equal(batches.length,1);
 const restored=await intelligence.exportBackup();
 assert.deepEqual(sortRows(restored.snapshot.records),sortRows(backup.snapshot.records));
 assert.deepEqual(sortRows(restored.snapshot.jobs),sortRows(backup.snapshot.jobs.map(job=>({...job,status:'canceled'}))));
 assert.equal(sqlite.prepare('SELECT count(*) n FROM jobs WHERE lease_token IS NOT NULL OR lease_until IS NOT NULL').get().n,0);
 for(const statement of batches[0]){
  assert.ok(statement.args.length<=100);assert.ok(Buffer.byteLength(statement.sql)<100000);
  for(const arg of statement.args)if(typeof arg==='string')assert.ok(Buffer.byteLength(arg)<=1800000);
 }
 assert.ok(batches[0].length<50,'Bulk restore should not use a query per saved row');
});

test('DATA-03 a failure in a later job chunk rolls back records, jobs and admission together',async()=>{
 const backup=await archive();
 sqlite.exec("CREATE TRIGGER fail_late_restore BEFORE INSERT ON jobs WHEN NEW.id='job-500' BEGIN SELECT RAISE(ABORT,'late restore failure'); END;");
 await assert.rejects(()=>intelligence.restoreBackup(backup),/late restore failure/);
 assert.deepEqual(counts(),{records:0,jobs:0,settings:0});
 sqlite.exec('DROP TRIGGER fail_late_restore');
 assert.equal((await intelligence.restoreBackup(backup)).restored,true);
});

test('DATA-03 silently skipped rows cannot produce a successful partial restore',async()=>{
 const backup=await archive();
 sqlite.exec("CREATE TRIGGER skip_restore_row BEFORE INSERT ON records WHEN NEW.id='memory-750' BEGIN SELECT RAISE(IGNORE); END;");
 await assert.rejects(()=>intelligence.restoreBackup(backup));
 assert.deepEqual(counts(),{records:0,jobs:0,settings:0});
});

test('DATA-03 concurrent large restores have one winner and preserve existing settings',async()=>{
 const backup=await archive();
 sqlite.prepare('INSERT INTO runtime_settings(id,data,updated_at) VALUES (?,?,?)').run('kept-setting','{"local":"retained"}',now);
 const results=await Promise.allSettled([intelligence.restoreBackup(backup),intelligence.restoreBackup(backup)]);
 assert.equal(results.filter(value=>value.status==='fulfilled').length,1);
 assert.equal(results.filter(value=>value.status==='rejected').length,1);
 assert.deepEqual(counts(),{records:1000,jobs:600,settings:1});
 assert.equal(sqlite.prepare('SELECT data FROM runtime_settings WHERE id=?').get('kept-setting').data,'{"local":"retained"}');
});

test('DATA-03 export and restore cover the declared 10,000 records plus 10,000 jobs',async()=>{
 const backup=await archive(10000,10000);
 assert.ok(Buffer.byteLength(JSON.stringify(backup))<10000000);
 await intelligence.restoreBackup(backup);
 const exported=await intelligence.exportBackup();
 assert.equal(exported.snapshot.records.length,10000);assert.equal(exported.snapshot.jobs.length,10000);
 assert.equal((await intelligence.validateBackup(exported)).valid,true);
 assert.ok(batches[0].length<150);
 assert.equal(sqlite.prepare("SELECT count(*) n FROM jobs WHERE status<>'canceled'").get().n,0);
});

test('DATA-03 export refuses record overflow instead of producing a truncated restorable archive',async()=>{
 const backup=await archive(10000,0);await intelligence.restoreBackup(backup);
 sqlite.prepare('INSERT INTO records SELECT ?,kind,title,project_id,status,data,created_at,updated_at FROM records WHERE id=?').run('overflow','memory-1');
 await assert.rejects(()=>intelligence.exportBackup(),/limit|oversized|10,000|10000/);
});

test('DATA-03 oversized UTF-8 archives and individual rows fail before any write',async()=>{
 const utf8=await archive(3,0);for(const record of utf8.snapshot.records)record.data=JSON.stringify({content:'🧡'.repeat(850000)});await resign(utf8);
 assert.ok(JSON.stringify(utf8).length<10000000);assert.ok(Buffer.byteLength(JSON.stringify(utf8))>10000000);
 await assert.rejects(()=>intelligence.restoreBackup(utf8),/oversized|10 MB|limit/);assert.equal(batches.length,0);
 const row=await archive(2,0);row.snapshot.records[1].data=JSON.stringify({content:'x'.repeat(1800000)});await resign(row);
 await assert.rejects(()=>intelligence.restoreBackup(row),/row|oversized|limit/);assert.equal(batches.length,0);
 assert.deepEqual(counts(),{records:0,jobs:0,settings:0});
});

test('DATA-03 the real API restores a large archive and refuses cross-origin restore',async()=>{
 const backup=await archive(600,500);
 const request=origin=>new Request('https://omnidev.example/api/intelligence',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({action:'restoreBackup',backup})});
 const denied=await route.POST(request('https://other.example'));assert.equal(denied.status,403);assert.deepEqual(counts(),{records:0,jobs:0,settings:0});
 const restored=await route.POST(request('https://omnidev.example'));assert.equal(restored.status,200);const result=(await restored.json()).result;
 assert.equal(result.records,600);assert.equal(result.jobs,500);assert.equal(result.resumed,false);
 const exported=await route.GET(new Request('https://omnidev.example/api/intelligence?action=backup'));
 assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition'),/attachment/);
 assert.equal((await exported.json()).snapshot.jobs.length,500);
});

test('DATA-03 malformed late records and nonempty targets never write a partial prefix',async()=>{
 const backup=await archive();backup.snapshot.records.at(-1).project_id='unknown';await resign(backup);
 await assert.rejects(()=>intelligence.restoreBackup(backup),/reference/);assert.equal(batches.length,0);
 const valid=await archive();await intelligence.restoreBackup(valid);
 const before=await intelligence.exportBackup();await assert.rejects(()=>intelligence.restoreBackup(valid),/nonempty/);
 assert.deepEqual((await intelligence.exportBackup()).snapshot,before.snapshot);
});

test('DATA-03 a large individual record stays intact across bounded chunks',async()=>{
 const backup=await archive(700,0);
 backup.snapshot.records[301].data=JSON.stringify({content:'🧡'.repeat(120000),detail:'A row larger than the normal chunk target'});
 await resign(backup);await intelligence.restoreBackup(backup);
 const saved=sqlite.prepare('SELECT data FROM records WHERE id=?').get('memory-301').data;
 assert.equal(saved,backup.snapshot.records[301].data);
 assert.equal((await intelligence.validateBackup(await intelligence.exportBackup())).valid,true);
 assert.equal(batches.length,1);
});

test('DATA-03 caller mutation during async validation cannot change restored bytes',async()=>{
 const backup=await archive(600,10),title=backup.snapshot.records[0].title;
 const pending=intelligence.restoreBackup(backup);
 backup.snapshot.records[0].title='Unvalidated changed title';backup.snapshot.jobs[0].payload='{}';
 await pending;
 assert.equal(sqlite.prepare('SELECT title FROM records WHERE id=?').get('project').title,title);
 assert.equal(sqlite.prepare('SELECT payload FROM jobs WHERE id=?').get('job-0').payload,'{"sourceProjectId":"project"}');
});

test('DATA-03 a valid near-10-MB archive roundtrips through the actual API envelope',async()=>{
 const backup=await archive(6,0);
 for(const row of backup.snapshot.records)row.data=JSON.stringify({...JSON.parse(row.data),padding:'x'.repeat(1660000)});
 await resign(backup);
 const extra=9999990-Buffer.byteLength(JSON.stringify(backup));
 const last=backup.snapshot.records.at(-1),data=JSON.parse(last.data);data.padding+='x'.repeat(extra);last.data=JSON.stringify(data);await resign(backup);
 assert.equal(Buffer.byteLength(JSON.stringify(backup)),9999990);assert.equal((await intelligence.validateBackup(backup)).valid,true);
 for(const action of ['validateBackup','restoreBackup']){
  const body=JSON.stringify({action,backup});assert.ok(Buffer.byteLength(body)>10000000);
  const response=await route.POST(new Request('https://omnidev.example/api/intelligence',{method:'POST',headers:{origin:'https://omnidev.example','Content-Type':'application/json'},body}));
  assert.equal(response.status,200,await response.text());
 }
 assert.deepEqual(counts(),{records:6,jobs:0,settings:0});
});

test('DATA-03 malformed Unicode in persisted fields is rejected instead of changed',async()=>{
 for(const [collection,index,field] of [['records',1,'title'],['records',1,'id'],['jobs',0,'objective'],['jobs',0,'payload']]){
  const backup=await archive(2,1);backup.snapshot[collection][index][field]=field==='payload'?'{"note":"prefix\ud800suffix"}':'prefix\ud800suffix';await resign(backup);
  await assert.rejects(()=>intelligence.restoreBackup(backup),/Invalid|Unicode|text/i);
  assert.deepEqual(counts(),{records:0,jobs:0,settings:0});assert.equal(batches.length,0);
 }
});
