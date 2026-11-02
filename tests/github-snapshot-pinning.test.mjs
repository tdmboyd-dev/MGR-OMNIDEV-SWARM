import {createHash,randomBytes} from 'node:crypto';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {environment,closeStore,post,store} from './workspace-fixture.mjs';
const {githubSnapshot}=await import(process.env.OMNI_GITHUB_SNAPSHOT_MODULE?pathToFileURL(resolve(process.env.OMNI_GITHUB_SNAPSHOT_MODULE)).href:'../.test-runtime/github.mjs');
const originalFetch=globalThis.fetch;after(()=>{globalThis.fetch=originalFetch;closeStore();});
const commit='a'.repeat(40),tree='b'.repeat(40),path='src/example file.ts';
function upstream({revision={sha:commit,commit:{tree:{sha:tree}}},ref='feature/one',missing=false,content='export const pinned = true;',returnedContent=content,filePath=path,mode='100644'}={}){
 const seen=[];globalThis.fetch=async(url,options)=>{
  const target=String(url);seen.push({url:target,headers:options?.headers,redirect:options?.redirect});
  if(target.endsWith('/repos/example/project'))return Response.json({default_branch:ref});
  if(target.includes('/commits/'))return Response.json(revision);
  if(target.includes('/git/trees/'))return Response.json({tree:[{type:'blob',path:filePath,mode,size:Buffer.byteLength(content),sha:createHash('sha1').update('blob '+Buffer.byteLength(content)+'\0').update(content).digest('hex')}],truncated:false});
  if(target.startsWith('https://raw.githubusercontent.com/'))return missing?new Response('',{status:404}):new Response(target.includes('/'+commit+'/')?returnedContent:'export const pinned = false;');
  throw Error('Unexpected fixture URL');
 };return seen;
}
test('branch lookup is resolved once and inventory plus every file use its immutable commit/tree',async()=>{
 const seen=upstream(),snapshot=await githubSnapshot('example/project');
 assert.equal(snapshot.commit,commit);assert.equal(snapshot.tree,tree);assert.equal(snapshot.ref,'feature/one');assert.equal(snapshot.files[0].content,'export const pinned = true;');
 assert.deepEqual(seen.map(x=>x.url),['https://api.github.com/repos/example/project','https://api.github.com/repos/example/project/commits/feature%2Fone','https://api.github.com/repos/example/project/git/trees/'+tree+'?recursive=1','https://raw.githubusercontent.com/example/project/'+commit+'/src/example%20file.ts']);
 assert.ok(seen.every(x=>x.redirect==='manual'));assert.ok(seen.every(x=>!x.headers.Authorization));
});
test('missing or malformed commit/tree identity prevents any source-file download',async()=>{
 for(const revision of [{},{sha:'main',commit:{tree:{sha:tree}}},{sha:commit,commit:{tree:{sha:'unknown'}}}]){
  const seen=upstream({revision});await assert.rejects(githubSnapshot('example/project'),/pinned commit and tree/);assert.ok(!seen.some(x=>x.url.startsWith('https://raw.')));
 }
});
test('one failed pinned file prevents returning a mixed or incomplete success',async()=>{
 upstream({missing:true});await assert.rejects(githubSnapshot('example/project'),/not found/i);
});
test('workspace records the exact import commit and tree for later job grants',async()=>{
 upstream();const imported=await post({action:'github',location:'example/project'});assert.equal(imported.status,200);
 const project=(await store.list()).find(x=>x.id===imported.data.projectId);assert.equal(project.data.origin.commit,commit);assert.equal(project.data.origin.tree,tree);assert.equal(project.data.files[0].content,'export const pinned = true;');
});


test('Node module source and npm lockfiles are eligible committed input',async()=>{
 for(const filePath of ['src/main.mjs','src/common.cjs','src/module.mts','src/common.cts','package-lock.json']){
  upstream({filePath,content:'{}'});const snapshot=await githubSnapshot('example/project');assert.equal(snapshot.files[0].path,filePath);
 }
});
test('Git blob identity rejects changed returned bytes before workspace persistence',async()=>{
 upstream({content:'export const value=1;',returnedContent:'export const value=2;'});const before=await store.list();
 const r=await post({action:'github',location:'example/project',sourceIdentity:'exact-reviewed-git'});assert.equal(r.status,400);assert.deepEqual(await store.list(),before);
});
test('pinned source preserves BOM and decomposed Unicode byte content',async()=>{
 const content='\ufeffexport const café="e\u0301";\r\n';upstream({content});const snapshot=await githubSnapshot('example/project');assert.equal(snapshot.files[0].content,content);
});
test('invalid UTF8 bytes are refused rather than silently repaired',async()=>{
 upstream({content:Buffer.from([0xff,0xfe,0x61])});await assert.rejects(githubSnapshot('example/project'));
});
test('symbolic Git source is not fetched as a regular source file',async()=>{
 const seen=upstream({mode:'120000'});await assert.rejects(githubSnapshot('example/project'));assert.equal(seen.some(x=>x.url.startsWith('https://raw.')),false);
});


test('source response streams stop at the byte budget instead of reading the complete body',async()=>{
 upstream();const metadata=globalThis.fetch;let cancelled=false,pulls=0;
 globalThis.fetch=async(url,options)=>String(url).startsWith('https://raw.')?new Response(new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(8192));if(pulls===100)controller.close();},cancel(){cancelled=true;}})):metadata(url,options);
 await assert.rejects(githubSnapshot('example/project'),/byte budget/);assert.equal(cancelled,true);assert.ok(pulls<=15);
});
test('portable aliases and unknown file modes are not silently selected',async()=>{
 const {selectSnapshotFiles}=await import('../.test-runtime/github-selection.mjs'),blob=path=>({path,type:'blob',size:1,sha:'c'.repeat(40),mode:'100644'});
 assert.throws(()=>selectSnapshotFiles([blob('src/a.ts'),blob('src/A.ts')]),/Ambiguous/);
 assert.deepEqual(selectSnapshotFiles([{...blob('src/a.ts'),mode:'160000'}]),[]);assert.deepEqual(selectSnapshotFiles([{...blob('src/a.ts'),size:-1}]),[]);
});


test('authenticated blob reads verify exact metadata content and UTF8 without using raw-content origin',async()=>{
 environment.OMNI_VAULT_KEY=randomBytes(32).toString('base64');const {saveAccount}=await import('../.test-runtime/github-account.mjs');await saveAccount('github-account',{token:'snapshot-fixture-token',expiresAt:null});
 const content='\ufeffexport const café="e\u0301";\r\n',oid=createHash('sha1').update('blob '+Buffer.byteLength(content)+'\0').update(content).digest('hex'),valid={encoding:'base64',sha:oid,size:Buffer.byteLength(content),content:Buffer.from(content).toString('base64')};
 for(const patch of [null,{sha:'f'.repeat(40)},{size:1},{content:Buffer.from('substituted').toString('base64')},{encoding:'raw'}]){
  const seen=[];globalThis.fetch=async(url,options)=>{
   const target=String(url);seen.push(target);assert.ok(target.startsWith('https://api.github.com/'));assert.equal(options.headers.Authorization,'Bearer snapshot-fixture-token');
   if(target.endsWith('/repos/example/project'))return Response.json({default_branch:'main'});
   if(target.includes('/commits/'))return Response.json({sha:commit,commit:{tree:{sha:tree}}});
   if(target.includes('/git/trees/'))return Response.json({tree:[{path:'src/value.mjs',type:'blob',mode:'100644',sha:oid,size:Buffer.byteLength(content)}],truncated:false});
   if(target.endsWith('/git/blobs/'+oid))return Response.json({...valid,...patch});throw Error('Outside fixture origin');
  };
  if(patch)await assert.rejects(githubSnapshot('example/project',true));else assert.equal((await githubSnapshot('example/project',true)).files[0].content,content);
  assert.ok(seen.every(url=>url.startsWith('https://api.github.com/')));
 }
});
test('an empty-chunk stream cannot spin forever under a zero byte count',async()=>{
 upstream();const metadata=globalThis.fetch;let cancelled=false;
 globalThis.fetch=async(url,options)=>String(url).startsWith('https://raw.')?new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array());},cancel(){cancelled=true;}})):metadata(url,options);
 await assert.rejects(githubSnapshot('example/project'),/chunk budget/);assert.equal(cancelled,true);
});
