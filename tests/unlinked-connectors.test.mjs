// These are local catalog-boundary tests, never live-provider qualification.
// Run `node tests/prepare.mjs` first, then this file directly with Node.
import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

const baseline=JSON.parse(readFileSync(new URL('../UNFINISHED-WORK/mgr-44-unlinked-source-gaps-20261029.json',import.meta.url),'utf8'));
const connectors=baseline.records.filter(r=>r.id.startsWith('CONN-'));
assert.equal(connectors.length,34,'Keep the original 34-connector investigation cohort explicit.');
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../drizzle/0000_orange_phalanx.sql',import.meta.url),'utf8'));
class Statement {
 constructor(sql,args=[]){this.sql=sql;this.args=args;}
 bind(...args){return new Statement(this.sql,args);}
 async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
 async run(){return sqlite.prepare(this.sql).run(...this.args);}
}
globalThis.__omniEnv={DB:{prepare:sql=>new Statement(sql),batch:async statements=>{
 sqlite.exec('BEGIN');try{const result=statements.map(s=>sqlite.prepare(s.sql).run(...s.args));sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}
}}};
const {GET,POST}=await import('../.test-runtime/route.mjs');
const originalFetch=globalThis.fetch;let requests=0;
globalThis.fetch=async()=>{requests++;throw Error('A catalog registration must not contact an external provider.');};
after(()=>{globalThis.fetch=originalFetch;sqlite.close();});
const post=async(body,origin='https://omni.example')=>{
 const response=await POST(new Request('https://omni.example/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)}));
 return {status:response.status,data:await response.json()};
};

for(const entry of connectors){
 test(`${entry.id}: ${entry.title} registration stays disconnected and unsupported execution is refused`,async()=>{
  const name=entry.title.replace(/ integration$/,'');const before=requests;
  const registration=await post({action:'connection',provider:name,title:name+' investigation',endpoint:'https://provider.example.invalid'});
  assert.equal(registration.status,200);
  const registered=registration.data.records.find(r=>r.id===registration.data.id);
  assert.equal(registered.status,'not connected');assert.equal(registered.data.provider,name);
  assert.match(registered.data.detail,/Catalog registration only/);
  const response=await GET();const readback=await response.json();
  assert.equal(readback.records.find(r=>r.id===registered.id).status,'not connected');
  const unsupported=await post({action:'invokeConnector',provider:name,connectorId:registered.id,operation:'write',arguments:{}});
  assert.equal(unsupported.status,400);assert.match(unsupported.data.error,/Unknown action/);
  assert.equal(requests,before,'No provider calls are made by catalog registration or denied invocation.');
 });
}
test('cross-origin connector registration is rejected without a stored registration or provider call',async()=>{
 const before=sqlite.prepare('SELECT COUNT(*) AS count FROM records').get().count;
 const denied=await post({action:'connection',provider:'GitLab',title:'Denied registration'},'https://untrusted.example');
 assert.equal(denied.status,403);assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM records').get().count,before);assert.equal(requests,0);
});
