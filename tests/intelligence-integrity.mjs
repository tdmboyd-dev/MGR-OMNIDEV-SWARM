import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {after, beforeEach, test} from 'node:test';

// Real SQLite persistence and application functions. No external service is simulated.
const environment = {DB:null};
globalThis.__omniEnv = environment;
let sqlite;
function openStore(){
  sqlite?.close();
  sqlite = new DatabaseSync(':memory:');
  for (const file of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql']) sqlite.exec(readFileSync(file,'utf8'));
  class Stmt {
    constructor(sql,args=[]){this.sql=sql;this.args=args;}
    bind(...args){return new Stmt(this.sql,args);}
    async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
    async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
    async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}
  }
  environment.DB = {prepare:sql=>new Stmt(sql),batch:async statements=>{
    sqlite.exec('BEGIN');
    try {const result=statements.map(statement=>({meta:{changes:Number(sqlite.prepare(statement.sql).run(...statement.args).changes)}}));sqlite.exec('COMMIT');return result;}
    catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
}
openStore();
const store = await import('../.test-runtime/store.mjs');
const intelligence = await import('../.test-runtime/intelligence.mjs');
const jobs = await import('../.test-runtime/jobs.mjs');
const {fingerprint} = await import('../.test-runtime/control-plane.mjs');
beforeEach(openStore);
after(()=>sqlite.close());

async function project(title='Project'){
  const item=store.record('project',title,{files:[{path:'README.md',content:'# Project'}],analysis:{nodes:[],edges:[]}});
  await store.insert(item).run();
  return item;
}
async function archive(){
  const source=await project();
  const memory=store.record('memory','Retained decision',{content:'Measured result'},source.id);
  await store.insert(memory).run();
  const job=await jobs.enqueue({projectId:source.id,objective:'Restore fixture',mode:'native'});
  return {backup:await intelligence.exportBackup(),source,memory,job};
}
async function changed(backup,change){const result=structuredClone(backup);change(result.snapshot);result.digest=await fingerprint(result.snapshot);return result;}
async function rejectsWithoutWrites(backup,pattern){
  const before=await intelligence.exportBackup();
  await assert.rejects(()=>intelligence.restoreBackup(backup),pattern);
  assert.deepEqual((await intelligence.exportBackup()).snapshot,before.snapshot);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM runtime_settings WHERE id='restore-lock'").get().n,0);
}

test('GRAPH-01 deletion does not resurrect stale integration participants or edges',async()=>{
  const source=await project('Deleted private source');
  const integrated=await project('Integration');
  await store.db().prepare('UPDATE records SET data=? WHERE id=?').bind(JSON.stringify({...integrated.data,integration:{sources:[{id:source.id,title:source.title,digest:'snapshot-before-delete'}]}}),integrated.id).run();
  assert.ok((await intelligence.intelligenceGraph()).edges.some(edge=>edge.source===source.id&&edge.target===integrated.id));
  await jobs.manageProject({projectId:source.id,operation:'delete',confirmation:source.title});
  const result=await intelligence.intelligenceGraph();
  assert.equal(result.nodes.some(node=>node.id===source.id),false);
  assert.equal(result.edges.some(edge=>edge.source===source.id||edge.target===source.id),false);
  assert.equal(JSON.stringify(result).includes(source.title),false);
  assert.ok(result.edges.every(edge=>result.nodes.some(node=>node.id===edge.source)&&result.nodes.some(node=>node.id===edge.target)));
});

test('GRAPH-01 integration participants use current project identity after a rename',async()=>{
  const integrated=await project('Integration first');
  const source=await project('Old source name');
  await store.db().prepare('UPDATE records SET data=? WHERE id=?').bind(JSON.stringify({...integrated.data,integration:{sources:[{id:source.id,title:source.title,digest:'snapshot-digest'}]}}),integrated.id).run();
  await store.db().prepare('UPDATE records SET title=? WHERE id=?').bind('Current source name',source.id).run();
  const graph=await intelligence.intelligenceGraph(integrated.id);
  assert.equal(graph.nodes.find(node=>node.id===source.id)?.label,'Current source name');
  assert.equal(JSON.stringify(graph).includes('Old source name'),false);
});

test('DATA-03 complete backup restores into a fresh store without execution authority',async()=>{
  const {backup}=await archive();
  openStore();
  const result=await intelligence.restoreBackup(backup);
  assert.equal(result.restored,true);
  assert.equal(result.resumed,false);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM records').get().n,backup.snapshot.records.length);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,backup.snapshot.jobs.length);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM jobs WHERE status<>'canceled' OR lease_token IS NOT NULL OR lease_until IS NOT NULL").get().n,0);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM runtime_settings').get().n,0);
  const restored=await intelligence.exportBackup();
  assert.deepEqual(restored.snapshot.records,backup.snapshot.records);
  await rejectsWithoutWrites(backup,/nonempty/);
});

test('DATA-03 rejects jobs whose project reference is a memory record',async()=>{
  const {backup,memory}=await archive();
  const invalid=await changed(backup,snapshot=>{snapshot.jobs[0].project_id=memory.id;});
  openStore();
  await rejectsWithoutWrites(invalid,/project|reference/i);
});

test('DATA-03 rejects dangling project links before a restore writes anything',async()=>{
  const {backup,memory}=await archive();
  const invalid=await changed(backup,snapshot=>{snapshot.records.find(record=>record.id===memory.id).project_id='missing-project';});
  openStore();
  await rejectsWithoutWrites(invalid,/project|reference/i);
});

test('DATA-03 rejects null or array record data and job payloads',async()=>{
  const {backup}=await archive();
  for (const [collection,key,value] of [['records','data','null'],['records','data','[]'],['jobs','payload','null'],['jobs','result','[]']]){
    const invalid=await changed(backup,snapshot=>{snapshot[collection][0][key]=value;});
    openStore();
    await rejectsWithoutWrites(invalid,/object|data|payload|result/i);
  }
});

test('DATA-03 rejects malformed job retry counters and empty record identities',async()=>{
  const {backup}=await archive();
  for (const value of ['-1','NaN','Infinity','1.5','',null]){
    const invalid=await changed(backup,snapshot=>{snapshot.jobs[0].attempts=value;});
    openStore();
    await rejectsWithoutWrites(invalid,/attempt|retry/i);
  }
  const empty=await changed(backup,snapshot=>{snapshot.records[0].id='';});
  openStore();
  await rejectsWithoutWrites(empty,/record|identity|id/i);
});

test('DATA-03 concurrent restoration has one winner and no duplicated effects',async()=>{
  const {backup}=await archive();
  openStore();
  const results=await Promise.allSettled([intelligence.restoreBackup(backup),intelligence.restoreBackup(backup)]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(results.filter(result=>result.status==='rejected').length,1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM records').get().n,backup.snapshot.records.length);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM jobs').get().n,backup.snapshot.jobs.length);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM runtime_settings').get().n,0);
});

for(const operation of ['delete','clearSnapshot'])test('DATA-03 '+operation+' removes its audit children without touching another project',async()=>{
 const target=await project('Cleanup target'),other=await project('Unrelated project');
 const children=[];
 for(const owner of [target,other]){
  const audit=store.record('repo_audit','Completed scan',{},owner.id,'completed');await store.insert(audit).run();
  for(const kind of ['repo_tree','repo_file']){const child=store.record(kind,'Scan payload',{},audit.id,'inspected-static-only');await store.insert(child).run();children.push({id:child.id,owner:owner.id});}
 }
 await jobs.manageProject({projectId:target.id,operation,confirmation:target.title});
 for(const child of children)assert.equal(!!sqlite.prepare('SELECT id FROM records WHERE id=?').get(child.id),child.owner===other.id);
 assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM records WHERE kind='repo_audit' AND project_id=?").get(target.id).n,0);
 assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM records WHERE kind='repo_audit' AND project_id=?").get(other.id).n,1);
 assert.equal((await intelligence.validateBackup(await intelligence.exportBackup())).valid,true);
});
