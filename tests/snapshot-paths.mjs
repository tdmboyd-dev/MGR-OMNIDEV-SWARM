import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const sqlite=new DatabaseSync(':memory:');
for(const path of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sqlite.exec(readFileSync(path,'utf8'));
class Statement{
 constructor(sql,args=[]){this.sql=sql;this.args=args;}
 bind(...args){return new Statement(this.sql,args);}
 async all(){return {results:sqlite.prepare(this.sql).all(...this.args)};}
 async first(){return sqlite.prepare(this.sql).get(...this.args)??null;}
 async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}
}
globalThis.__omniEnv={DB:{prepare:sql=>new Statement(sql),batch:async statements=>{
 sqlite.exec('BEGIN');try{const result=statements.map(s=>({meta:{changes:Number(sqlite.prepare(s.sql).run(...s.args).changes)}}));sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}
}}};
const {POST,GET}=await import('../.test-runtime/route.mjs');
const {candidate,safePath}=await import('../.test-runtime/runtime-contract.mjs');
const submit=async body=>{const response=await POST(new Request('https://omni.example/api/workspace',{method:'POST',headers:{Origin:'https://omni.example','Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:response.status,body:await response.json()};};
const unsafe=['C:/outside.ts','source.ts:alternate','a\\b.ts','nul.ts','src/CON','src/Lpt1.txt','src/end.','src/end ','../outside.ts','/root.ts','a//b.ts','a/./b.ts','a\u0000b.ts','a?b.ts','.GIT/config','.env.production'];
test('unsafe import and candidate paths are rejected before SQLite writes',async()=>{
 for(const path of unsafe){assert.equal(safePath(path),false,path);const result=await submit({action:'import',title:'Unsafe',files:[{path,content:'fixture'}]});assert.equal(result.status,400,path);
  assert.throws(()=>candidate({summary:'fixture',patches:[{path,before:null,after:'fixture'}]},[]),/unsafe patch path/,path);
 }
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM records').get().n,0);
});
test('case aliases, malformed files and action objects are denied without writes',async()=>{
 for(const files of [[{path:'src/Foo.ts',content:'a'},{path:'src/foo.ts',content:'b'}],[null]]){
  assert.equal((await submit({action:'import',title:'Fixture',files})).status,400);
 }
 assert.equal((await submit(null)).status,400);assert.equal((await submit([])).status,400);
 assert.throws(()=>candidate({summary:'case',patches:[{path:'src/foo.ts',before:null,after:'new'}]},[{path:'src/Foo.ts',content:'old'}]),/unsafe patch path/);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM records').get().n,0);
});
test('UTF8 byte budget rejects oversized individual source without pretending codepoints are bytes',async()=>{
 const result=await submit({action:'import',title:'Oversized',files:[{path:'src/unicode.ts',content:'😀'.repeat(25000)}]});assert.equal(result.status,400);assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM records').get().n,0);
});
test('valid portable snapshot persists with exact content readback and SHA256 ledger',async()=>{
 const content='export const answer = 42;';const result=await submit({action:'import',title:'Portable fixture',files:[{path:'src/answer.ts',content}]});assert.equal(result.status,200);
 const response=await GET();const project=(await response.json()).records.find(r=>r.id===result.body.projectId);assert.equal(project.data.files[0].content,content);assert.match(project.data.fileLedger[0].contentDigest,/^[0-9a-f]{64}$/);assert.equal(project.data.fileLedger[0].runtimeVerified,false);
});

const {classification}=await import('../.test-runtime/repo-audit.mjs');
const {selectSnapshotFiles}=await import('../.test-runtime/github-selection.mjs');
test('GitHub snapshot selection and full-audit classification exclude case aliases of secret paths',()=>{
 for(const path of ['.ENV.json','src/.ENV.production.json','src/ID_RSA','src/ID_ED25519'])assert.equal(classification(path,20,'100644'),'secret-file',path);
 assert.equal(classification('.GIT/config.json',20,'100644'),'generated-or-dependency');
 const blobs=['.ENV.json','src/.ENV.production.json','.GIT/config.json','src/safe.ts'].map(path=>({path,type:'blob',size:20}));assert.deepEqual(selectSnapshotFiles(blobs).map(x=>x.path),['src/safe.ts']);
});
