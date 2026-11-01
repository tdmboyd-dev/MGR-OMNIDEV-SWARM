import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const sql=new DatabaseSync(':memory:');
for(const path of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(path,'utf8'));
let afterRead;
class Statement{
 constructor(query,args=[]){this.query=query;this.args=args;}
 bind(...args){return new Statement(this.query,args);}
 async first(){const row=sql.prepare(this.query).get(...this.args)??null;if(afterRead&&this.query==='SELECT * FROM jobs WHERE id=?'){const callback=afterRead;afterRead=null;callback();}return row;}
 async all(){return {results:sql.prepare(this.query).all(...this.args)};}
 async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}
}
globalThis.__omniEnv={DB:{prepare:q=>new Statement(q)}};
const {decide}=await import('../.test-runtime/jobs.mjs');
function seed(id,status){sql.prepare("INSERT INTO jobs(id,project_id,objective,mode,status,phase,payload,result,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)").run(id,'fixture','preserve applied snapshot','native',status,'fixture','{}','{"receipt":"preserved"}','now','now');}
for(const [action,start,terminal] of [['cancel','awaiting review','applied'],['reject','awaiting review','applied'],['retry','failed','canceled']]){
 test(action+' denies stale decision after concurrent terminal transition',async()=>{
  const id='race-'+action;seed(id,start);afterRead=()=>sql.prepare('UPDATE jobs SET status=? WHERE id=?').run(terminal,id);
  await assert.rejects(decide(id,action),/Job changed/);
  const row=sql.prepare('SELECT * FROM jobs WHERE id=?').get(id);assert.equal(row.status,terminal);assert.equal(JSON.parse(row.result).receipt,'preserved');
 });
}
test('normal cancel/reject/retry persist the requested state and terminal cancellation stays denied',async()=>{
 for(const [action,start,end] of [['cancel','queued','canceled'],['reject','awaiting review','rejected'],['retry','failed','queued']]){const id='normal-'+action;seed(id,start);assert.equal((await decide(id,action)).status,end);assert.equal(sql.prepare('SELECT status FROM jobs WHERE id=?').get(id).status,end);}
 await assert.rejects(decide('race-cancel','cancel'),/Terminal job/);
});

test('retry cannot exceed attempt cap after same-status concurrent failure',async()=>{
 seed('retry-cap','failed');sql.prepare("UPDATE jobs SET attempts='2' WHERE id='retry-cap'").run();
 afterRead=()=>sql.prepare("UPDATE jobs SET attempts='3' WHERE id='retry-cap'").run();
 await assert.rejects(decide('retry-cap','retry'),/Job changed/);
 assert.deepEqual({...sql.prepare("SELECT status,attempts FROM jobs WHERE id='retry-cap'").get()},{status:'failed',attempts:'3'});
});
