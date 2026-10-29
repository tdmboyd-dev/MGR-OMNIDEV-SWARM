import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {environment,closeStore,post,store} from './workspace-fixture.mjs';
const {githubSnapshot}=await import(process.env.OMNI_GITHUB_SNAPSHOT_MODULE?pathToFileURL(resolve(process.env.OMNI_GITHUB_SNAPSHOT_MODULE)).href:'../.test-runtime/github.mjs');
const originalFetch=globalThis.fetch;after(()=>{globalThis.fetch=originalFetch;closeStore();});
const commit='a'.repeat(40),tree='b'.repeat(40),path='src/example file.ts';
function upstream({revision={sha:commit,commit:{tree:{sha:tree}}},ref='feature/one',missing=false}={}){
 const seen=[];globalThis.fetch=async(url,options)=>{
  const target=String(url);seen.push({url:target,headers:options?.headers,redirect:options?.redirect});
  if(target.endsWith('/repos/example/project'))return Response.json({default_branch:ref});
  if(target.includes('/commits/'))return Response.json(revision);
  if(target.includes('/git/trees/'))return Response.json({tree:[{type:'blob',path,size:30,sha:'c'.repeat(40)}],truncated:false});
  if(target.startsWith('https://raw.githubusercontent.com/'))return missing?new Response('',{status:404}):new Response(target.includes('/'+commit+'/')?'export const pinned = true;':'export const pinned = false;');
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
