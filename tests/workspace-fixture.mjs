import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export const environment={DB:null};
globalThis.__omniEnv=environment;
let sqlite;
export function openStore(){
  sqlite?.close();sqlite=new DatabaseSync(':memory:');
  for(const file of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sqlite.exec(readFileSync(file,'utf8'));
  class Statement{
    constructor(sql,args=[]){this.sql=sql;this.args=args;}
    bind(...args){return new Statement(this.sql,args);}
    async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
    async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}
    async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}
  }
  environment.DB={prepare:sql=>new Statement(sql),batch:async statements=>{
    sqlite.exec('BEGIN');
    try{const result=statements.map(s=>({meta:{changes:Number(sqlite.prepare(s.sql).run(...s.args).changes)}}));sqlite.exec('COMMIT');return result;}
    catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
  return sqlite;
}
export const database=()=>sqlite;
export const closeStore=()=>sqlite?.close();
openStore();
export const store=await import('../.test-runtime/store.mjs');
export const workspace=await import('../.test-runtime/route.mjs');
export const intelligence=await import('../.test-runtime/intelligence-route.mjs');
export const planning=await import('../.test-runtime/workspace-planning.mjs');
export async function post(payload,route=workspace){
  const response=await route.POST(new Request('https://omni.example/api/workspace',{method:'POST',headers:{Origin:'https://omni.example','Content-Type':'application/json'},body:JSON.stringify(payload)}));
  return {status:response.status,data:await response.json()};
}
export const riskFiles=[{path:'src/orders.ts',content:'export function order(value){ return db.query("SELECT * FROM orders WHERE id=" + value); }\neval("unsafe");'},{path:'README.md',content:'# Orders service'}];
export const cleanFiles=[{path:'src/site.ts',content:'export function page(){ return "hello"; }'},{path:'README.md',content:'# Website'},{path:'tests/site.test.ts',content:'test("page",()=>{})'},{path:'.github/workflows/check.yml',content:'jobs: {}'},{path:'src/logging.ts',content:'export const logger = console;'}];
export async function importProject(title='Orders',files=riskFiles){
  const result=await post({action:'import',title,files});
  if(result.status!==200)throw new Error(JSON.stringify(result));
  return result.data.records.find(r=>r.id===result.data.projectId);
}
export async function source(projectId){
  const records=await store.list();
  const project=records.find(r=>r.id===projectId&&r.kind==='project');
  return planning.planningSource(project,records);
}
export const snapshot=()=>database().prepare('SELECT * FROM records ORDER BY id').all();
export async function makePlan(projectId){
  const expected=await source(projectId);
  const result=await post({action:'future',projectId,expectedSourceDigest:expected.sourceDigest});
  if(result.status!==200)throw new Error(JSON.stringify(result));
  return result.data.records.find(r=>r.id===result.data.id);
}
export async function writeProject(projectId,mutate){
  const row=database().prepare('SELECT * FROM records WHERE id=?').get(projectId);
  const data=JSON.parse(row.data);mutate(data);
  database().prepare('UPDATE records SET data=?,updated_at=? WHERE id=?').run(JSON.stringify(data),new Date().toISOString(),projectId);
}
