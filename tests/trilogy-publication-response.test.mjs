import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isPublicationPreview,isPublicationState,publicationDraftUrl} from '../lib/trilogy-publication-response.mjs';

const source=readFileSync(new URL('../components/trilogy-publication.tsx',import.meta.url),'utf8');
// Exercise the exact shipped async handler, with only TypeScript annotations
// erased. React rendering, DOM/browser interaction and backend are separate gates.
const start=source.indexOf('  async function act('),end=source.indexOf('\n  const expired =',start);
assert.ok(start>=0&&end>start,'Publication handler boundaries must remain explicit');
const handler=source.slice(start,end)
  .replace(/async function act\([^)]*\)/,'async function act(action)')
  .replace('(body?: Record<string, unknown>)','(body)')
  .replace('const data: any','const data')
  .replaceAll('publication!','publication');
const makeAct=new Function('context','"use strict"; const {jobId,verified,accessKey,preview,publication,session,fetch,AbortController,setTimeout,clearTimeout,onPublished,setAccessKey,setPreview,setPublication,setBusy,setError,setNotice,isPublicationPreview,isPublicationState,publicationDraftUrl}=context;'+handler+'\nreturn act;');

const preview={contract:'mgr.trilogy.publication-preview.v1',jobId:'job-a',projectId:'project-a',repositoryId:'owner/repo',ownerId:'owner',baseBranch:'main',baseCommit:'1'.repeat(40),candidateCommit:'2'.repeat(40),candidateRef:'refs/heads/mgr/candidates/fixture',summary:'Repair the tested file',changedFiles:[{path:'src/one.ts',operation:'update'}],previewSha256:'3'.repeat(64)};
const authorization=()=>({authorizationId:'approval-a',expiresAt:Date.now()+60_000,state:'authorized',revoked:false,preview});
const published=()=>({...authorization(),state:'published',outcome:{url:'https://github.com/owner/repo/pull/7',number:7,commit:preview.candidateCommit,draft:true}});
const clone=value=>JSON.parse(JSON.stringify(value));
const key='fixture-owner-key-that-is-separate-and-long-enough';

function host({reply,initialPreview=null,initialPublication=null,verified=true}={}){
  const state={preview:initialPreview,publication:initialPublication,accessKey:key,busy:false,error:'',notice:'',publishedCount:0};
  const requests=[],session={current:{jobId:'job-a',revision:0,mounted:true,busy:false}};
  const set=name=>value=>{state[name]=value;};
  return {state,requests,async act(action){
    const run=makeAct({...state,jobId:'job-a',verified,session,isPublicationPreview,isPublicationState,publicationDraftUrl,
      setAccessKey:set('accessKey'),setPreview:set('preview'),setPublication:set('publication'),setBusy:set('busy'),setError:set('error'),setNotice:set('notice'),
      onPublished:()=>{state.publishedCount++;},
      AbortController:class{constructor(){this.signal={};}abort(){}},setTimeout:()=>1,clearTimeout:()=>{},
      fetch:async(url,init)=>{const request={url,method:init.method,body:init.body?JSON.parse(init.body):null};requests.push(request);const data=await reply(request);return {ok:true,json:async()=>data};},
    });await run(action);
  }};
}

test('preview validation accepts the current contract and rejects malformed render inputs',()=>{
  assert.equal(isPublicationPreview(preview,'job-a'),true);
  const invalid=[null,[],{},...[
    {jobId:'job-b'},{contract:'unknown'},{repositoryId:'https://evil.invalid/a'},
    {baseCommit:['1'.repeat(40)]},{candidateCommit:preview.baseCommit},{previewSha256:[]},
    {changedFiles:null},{changedFiles:[]},{changedFiles:[null]},{changedFiles:[{path:'a',operation:'delete'}]},
    {changedFiles:[{path:'a',operation:'create'},{path:'a',operation:'update'}]},
  ].map(change=>({...preview,...change}))];
  for(const value of invalid)assert.equal(isPublicationPreview(value,'job-a'),false,JSON.stringify(value));
});

test('expired and revoked saved attempts remain inspectable without granting authority',()=>{
  for(const state of ['authorized','retryable','publishing','uncertain','canceled-before-dispatch']){
    assert.equal(isPublicationState({...authorization(),state,expiresAt:Date.now()-1000,revoked:true,outcome:null},'job-a'),true);
  }
  assert.equal(isPublicationState({...published(),revoked:true,expiresAt:Date.now()-1000},'job-a'),true);
});

test('state validation refuses incomplete approval and foreign preview identities',()=>{
  for(const patch of [{authorizationId:''},{expiresAt:'tomorrow'},{expiresAt:NaN},{expiresAt:0},{revoked:undefined},{state:'made-up'},{preview:null},{preview:{...preview,jobId:'job-b'}},{outcome:{draft:true}}]){
    assert.equal(isPublicationState({...authorization(),...patch},'job-a'),false);
  }
  assert.equal(isPublicationState(authorization(),'job-a','approval-other',preview),false);
  assert.equal(isPublicationState(authorization(),'job-a','approval-a',{...preview,summary:'Another reviewed change'}),false);
  assert.equal(isPublicationState(authorization(),'job-a','approval-a',{...preview,changedFiles:[{path:'other.ts',operation:'update'}]}),false);
  for(const expected of [{...preview,changedFiles:[null]},{...preview,changedFiles:null},{...preview,jobId:'job-b'},[]]){
    assert.equal(isPublicationState(authorization(),'job-a','approval-a',expected),false,'Malformed expected previews must return false without throwing');
  }
});

test('published links require the same tested draft and accept GitHub repository capitalization',()=>{
  assert.equal(publicationDraftUrl(published(),'Owner/Repo'),'https://github.com/Owner/Repo/pull/7');
  for(const patch of [{draft:false},{commit:'f'.repeat(40)},{number:0},{number:1.5},{url:'https://github.com/evil/repo/pull/7'},{url:'https://github.com/owner/repo/pull/8'},{url:'https://github.com/owner/repo/pull/7?token=x'},{url:'javascript:alert(1)'}]){
    const value={...published(),outcome:{...published().outcome,...patch}};
    assert.equal(publicationDraftUrl(value,'Owner/Repo'),null);assert.equal(isPublicationState(value,'job-a'),false);
  }
  assert.equal(publicationDraftUrl({...published(),state:'uncertain'},'Owner/Repo'),null);
});

test('matching preview comparison tolerates key order and rejects all changed server preview fields',()=>{
  const reordered=Object.fromEntries(Object.entries(preview).reverse());
  assert.equal(isPublicationState({...authorization(),preview:reordered},'job-a','approval-a',preview),true);
  for(const [name,value] of Object.entries({candidateCommit:'4'.repeat(40),baseBranch:'release',ownerId:'other-owner',previewSha256:'5'.repeat(64)})){
    assert.equal(isPublicationState({...authorization(),preview:{...preview,[name]:value}},'job-a','approval-a',preview),false);
  }
});

test('load never announces a recovered draft for a non-draft, different candidate or broken preview',async()=>{
  for(const change of [{outcome:{...published().outcome,draft:false}},{outcome:{...published().outcome,commit:'f'.repeat(40)}},{preview:{...preview,changedFiles:null}},{preview:{...preview,jobId:'job-b'}}]){
    const v=host({reply:()=>({publication:{...published(),...change}})});await v.act('load');
    assert.equal(v.state.publication,null);assert.equal(v.state.preview,null);assert.equal(v.state.notice,'');assert.ok(v.state.error);
    assert.equal(v.state.publishedCount,0);assert.equal(v.requests.length,1);assert.equal(v.state.busy,false);
  }
});

test('load distinguishes a missing status response from a valid no-approval response',async()=>{
  const invalid=host({reply:()=>({})});await invalid.act('load');assert.equal(invalid.requests.length,1);assert.ok(invalid.state.error);assert.equal(invalid.state.preview,null);
  const valid=host({reply:r=>r.method==='GET'?{publication:null}:preview});await valid.act('load');
  assert.deepEqual(valid.state.preview,preview);assert.equal(valid.state.error,'');assert.deepEqual(valid.requests.map(r=>r.body?.action||'status'),['status','publicationPreview']);
});

test('fresh malformed previews never enable approval or enter render state',async()=>{
  const v=host({reply:r=>r.method==='GET'?{publication:null}:{...preview,changedFiles:[null]}});
  await v.act('load');assert.equal(v.state.preview,null);assert.equal(v.state.publication,null);assert.ok(v.state.error);assert.equal(v.state.publishedCount,0);
});

test('approve refuses a substituted preview or inactive authorization response',async()=>{
  for(const change of [{preview:{...preview,candidateCommit:'f'.repeat(40)}},{revoked:true},{expiresAt:Date.now()-1},{state:'published',outcome:published().outcome}]){
    const v=host({initialPreview:preview,reply:()=>({...authorization(),...change})});
    await v.act('approve');assert.equal(v.state.publication,null);assert.equal(v.state.notice,'');assert.ok(v.state.error);
  }
});

test('revoke requires confirmation of the selected approval before clearing the key',async()=>{
  for(const change of [{revoked:false},{authorizationId:'approval-other',revoked:true},{preview:{...preview,candidateCommit:'f'.repeat(40)},revoked:true}]){
    const before=authorization(),v=host({initialPreview:preview,initialPublication:before,reply:()=>({...authorization(),...change})});
    await v.act('revoke');assert.deepEqual(v.state.publication,before);assert.equal(v.state.accessKey,key);assert.equal(v.state.notice,'');assert.ok(v.state.error);
  }
  const valid=host({initialPreview:preview,initialPublication:authorization(),reply:()=>({...authorization(),revoked:true})});
  await valid.act('revoke');assert.equal(valid.state.publication.revoked,true);assert.equal(valid.state.accessKey,'');assert.equal(valid.state.error,'');
});

test('publish and recovery cannot replace the saved authorization or reviewed candidate',async()=>{
  for(const action of ['publish','recover'])for(const change of [{authorizationId:'approval-other'},{preview:{...preview,candidateCommit:'f'.repeat(40)},outcome:{...published().outcome,commit:'f'.repeat(40)}}]){
    const before=authorization(),v=host({initialPreview:preview,initialPublication:before,reply:()=>({...published(),...change})});
    await v.act(action);assert.deepEqual(v.state.publication,before);assert.equal(v.state.accessKey,key);assert.equal(v.state.publishedCount,0);assert.ok(v.state.error);
  }
});

test('confirmed mixed-case draft, expired read-only recovery and unstarted cleanup retain their intended results',async()=>{
  for(const action of ['publish','recover']){
    const before={...authorization(),state:action==='recover'?'uncertain':'authorized'};
    const next=action==='recover'?{...published(),expiresAt:Date.now()-1000,revoked:true}:published();
    const v=host({initialPreview:preview,initialPublication:before,reply:()=>next});await v.act(action);
    assert.equal(v.state.error,'');assert.equal(v.state.publishedCount,1);assert.equal(v.state.accessKey,'');assert.equal(v.state.publication.state,'published');
  }
  const historical=host({verified:false,reply:()=>({publication:{...published(),revoked:true,expiresAt:Date.now()-1000}})});
  await historical.act('load');assert.equal(historical.state.error,'');assert.equal(historical.state.publication.state,'published');assert.ok(historical.state.notice.includes('Saved GitHub draft recovered.'));assert.equal(historical.state.publishedCount,0);assert.equal(historical.requests.length,1);
  const mixedPreview={...preview,repositoryId:'Owner/Repo'},mixed=host({initialPreview:mixedPreview,initialPublication:{...authorization(),preview:mixedPreview},reply:()=>({...published(),preview:mixedPreview})});
  await mixed.act('publish');assert.equal(mixed.state.error,'');assert.equal(mixed.state.publishedCount,1);
  const before={...authorization(),expiresAt:Date.now()-1000},v=host({initialPreview:preview,initialPublication:before,reply:()=>({...before,state:'canceled-before-dispatch',outcome:null,reconciliation:'not-dispatched',authorizationActive:false})});
  await v.act('recover');assert.equal(v.state.error,'');assert.equal(v.state.publishedCount,0);assert.ok(v.state.notice.includes('No GitHub draft was created.'));assert.equal(v.state.accessKey,'');
});
