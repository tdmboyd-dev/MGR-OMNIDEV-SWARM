import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {isPublicationPreview,isPublicationState,publicationDraftUrl} from '../lib/trilogy-publication-response.mjs';

// Execute the shipped component and its handlers with deterministic request timing.
// Real browser journeys have a separate receipt; this host is not browser evidence.
const source=readFileSync(new URL('../components/trilogy-publication.tsx',import.meta.url),'utf8');
const parsed=ts.createSourceFile('trilogy-publication.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let body=source;
for(const entry of [...parsed.statements.filter(ts.isImportDeclaration)].reverse())body=body.slice(0,entry.getFullStart())+body.slice(entry.getEnd());
body=body.replaceAll('export function ','function ').replaceAll('export type ','type ');
const compiled=ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None,jsx:ts.JsxEmit.React,jsxFactory:'h',jsxFragmentFactory:'Fragment'}}).outputText;
const require=createRequire(import.meta.url);
let renderer=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
for(const name of ['react','react/jsx-runtime'])renderer=renderer.replaceAll(JSON.stringify(name),JSON.stringify(pathToFileURL(require.resolve(name)).href)).replaceAll("'"+name+"'",JSON.stringify(pathToFileURL(require.resolve(name)).href));
renderer=renderer.replaceAll("'../lib/trilogy-publication-response.mjs'",JSON.stringify(new URL('../lib/trilogy-publication-response.mjs',import.meta.url).href)).replaceAll(JSON.stringify('../lib/trilogy-publication-response.mjs'),JSON.stringify(new URL('../lib/trilogy-publication-response.mjs',import.meta.url).href));
const {TrilogyPublicationPreview}=await import('data:text/javascript;base64,'+Buffer.from(renderer).toString('base64'));

const token='fixture-owner-approval-key-separate-20261029';
const preview={contract:'mgr.trilogy.publication-preview.v1',jobId:'job-a',projectId:'project-a',repositoryId:'owner/repo',ownerId:'owner',baseBranch:'main',baseCommit:'1'.repeat(40),candidateCommit:'2'.repeat(40),candidateRef:'refs/heads/mgr/candidates/fixture',summary:'Repair the exact tested file',changedFiles:[{path:'src/one.ts',operation:'update'}],previewSha256:'3'.repeat(64)};
const authorization=()=>({authorizationId:'approval-a',expiresAt:Date.now()+60_000,state:'authorized',revoked:false,preview});
const published=()=>({...authorization(),state:'published',outcome:{url:'https://github.com/owner/repo/pull/7',number:7,commit:preview.candidateCommit,draft:true}});
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const pending=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};};
function defaultReply(request){
  if(request.method==='GET')return response({publication:null});
  if(request.body.action==='publicationPreview')return response(preview);
  if(request.body.action==='authorizePublication')return response(authorization());
  if(request.body.action==='publish')return response(published());
  if(request.body.action==='revokePublication')return response({...authorization(),revoked:true});
  throw new Error('Unexpected request');
}
function host({reply=defaultReply,props={}}={}){
  const slots=[],effects=[],requests=[],timers=new Map();let cursor=0,dirty=true,tree,mounted=true,timerId=0,publishedCount=0;
  let current={jobId:'job-a',verified:true,onPublished:()=>{publishedCount++;},...props};
  const same=(a,b)=>a?.length===b?.length&&a.every((v,i)=>Object.is(v,b[i]));
  const h=(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}});
  const useState=initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{if(mounted){slots[i]=typeof value==='function'?value(slots[i]):value;dirty=true;}}];};
  const useRef=initial=>{const i=cursor++;return slots[i]??={current:initial};};
  const useEffect=(fn,deps)=>{const i=cursor++;if(!same(slots[i]?.deps,deps))effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});};
  const fetch=async(url,init)=>{const request={url:String(url),method:init?.method||'GET',headers:init?.headers,body:init?.body?JSON.parse(init.body):null,redirect:init?.redirect};requests.push(request);return reply(request);};
  const factory=new Function('h','Fragment','useState','useRef','useEffect','fetch','setInterval','clearInterval','isPublicationPreview','isPublicationState','publicationDraftUrl',compiled+'\nreturn TrilogyPublication;');
  const Component=factory(h,'fragment',useState,useRef,useEffect,fetch,fn=>{timers.set(++timerId,fn);return timerId;},id=>timers.delete(id),isPublicationPreview,isPublicationState,publicationDraftUrl);
  const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
  const text=node=>Array.isArray(node)?node.map(text).join(''):node==null||typeof node==='boolean'?'':typeof node!=='object'?String(node):text(node.props?.children);
  function render(){cursor=0;dirty=false;tree=Component(current);while(effects.length)effects.shift()();}
  async function flush(){for(let n=0;n<24;n++){if(dirty&&mounted)render();await Promise.resolve();}}
  const api={requests,flush,nodes:()=>nodes(tree),text:()=>text(tree),publishedCount:()=>publishedCount,button:label=>nodes(tree).find(n=>n.type==='button'&&text(n)===label),input:()=>nodes(tree).find(n=>n.type==='input'),async key(value){api.input().props.onChange({target:{value}});await flush();},async click(label){const n=api.button(label);assert.ok(n,'Missing '+label);assert.ok(!n.props.disabled,'Disabled '+label);n.props.onClick();await flush();},async props(next){current={...current,...next};dirty=true;await flush();},unmount(){mounted=false;for(const slot of slots)slot?.cleanup?.();}};
  render();return api;
}
async function load(view){await view.flush();await view.click('Review GitHub publication');await view.key(token);await view.click('Load tested version');}

test('preview renders the exact repository, tested commit, base, changed paths and escaped source text',()=>{
  const p={...preview,summary:'<script>bad()</script>',changedFiles:[{path:'<img src=x>',operation:'create'}]};
  const html=renderToStaticMarkup(createElement(TrilogyPublicationPreview,{preview:p}));
  for(const value of [preview.repositoryId,preview.candidateCommit,preview.baseCommit,'Merging and deployment are separate','&lt;script&gt;','&lt;img'])assert.ok(html.includes(value),value);
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
});
test('unverified candidates cannot start the owner publication flow',async()=>{
  const v=host({props:{verified:false}});await v.flush();assert.equal(v.button('Review GitHub publication').props.disabled,true);assert.equal(v.requests.length,0);v.unmount();
});
test('key validation and explicit preview keep approval separate from publishing',async()=>{
  const v=host();await v.flush();await v.click('Review GitHub publication');await v.key('short');assert.equal(v.button('Load tested version').props.disabled,true);
  await v.key(token);await v.click('Load tested version');assert.ok(v.button('Approve this version'));assert.equal(v.button('Create GitHub draft'),undefined);
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status','publicationPreview']);v.unmount();
});
test('the key travels only in an authorization header and is cleared after success',async()=>{
  const v=host();await load(v);await v.click('Approve this version');await v.click('Create GitHub draft');
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status','publicationPreview','authorizePublication','publish']);
  assert.ok(v.requests.every(r=>r.headers.Authorization==='Bearer '+token&&r.redirect==='error'));
  assert.ok(v.requests.every(r=>!JSON.stringify({url:r.url,body:r.body}).includes(token)));
  assert.deepEqual(v.requests[2].body.expectedPreview,preview);assert.equal(v.publishedCount(),1);assert.equal(v.input(),undefined);
  assert.equal(v.nodes().find(n=>n.type==='a').props.href,'https://github.com/owner/repo/pull/7');
  await v.click('Close and clear key');await v.click('Review GitHub publication');assert.equal(v.input().props.value,'');v.unmount();
});
test('reopening recovers the saved authorization without silently reapproving',async()=>{
  const v=host({reply:r=>r.method==='GET'?response({publication:authorization()}):defaultReply(r)});await load(v);
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status']);assert.ok(v.button('Create GitHub draft'));assert.equal(v.button('Approve this version'),undefined);v.unmount();
});
test('failed publication retains the approval and key for deliberate reconciliation',async()=>{
  const v=host({reply:r=>r.body?.action==='publish'?response({error:'Provider result uncertain'},409):defaultReply(r)});await load(v);await v.click('Approve this version');await v.click('Create GitHub draft');
  assert.ok(v.text().includes('Provider result uncertain'));assert.ok(v.button('Reload saved approval'));assert.equal(v.input().props.value,token);assert.equal(v.publishedCount(),0);v.unmount();
});
test('double invocation while publishing sends one mutation',async()=>{
  const wait=pending(),v=host({reply:r=>r.body?.action==='publish'?wait.promise:defaultReply(r)});await load(v);await v.click('Approve this version');
  const callback=v.button('Create GitHub draft').props.onClick;callback();callback();await v.flush();assert.equal(v.requests.filter(r=>r.body?.action==='publish').length,1);
  wait.resolve(response(published()));await v.flush();assert.equal(v.publishedCount(),1);v.unmount();
});
test('revoking sends only the selected approval and clears the key',async()=>{
  const v=host();await load(v);await v.click('Approve this version');await v.click('Revoke approval');
  assert.deepEqual(v.requests.at(-1).body,{action:'revokePublication',jobId:'job-a',authorizationId:'approval-a'});assert.equal(v.input().props.value,'');assert.equal(v.button('Create GitHub draft'),undefined);v.unmount();
});
test('expired approval cannot publish and requires reviewing a new preview',async()=>{
  const v=host({reply:r=>r.method==='GET'?response({publication:{...authorization(),expiresAt:Date.now()-1000}}):defaultReply(r)});await load(v);
  assert.equal(v.button('Create GitHub draft').props.disabled,true);assert.ok(v.text().includes('approval has expired'));
  await v.click('Review a new approval');assert.ok(v.button('Approve this version'));assert.equal(v.requests.at(-1).body.action,'publicationPreview');v.unmount();
});
test('switching jobs clears authority and drops a delayed old preview',async()=>{
  const wait=pending(),v=host({reply:r=>r.body?.action==='publicationPreview'?wait.promise:defaultReply(r)});await load(v);await v.props({jobId:'job-b'});
  wait.resolve(response(preview));await v.flush();assert.equal(v.button('Approve this version'),undefined);await v.click('Review GitHub publication');assert.equal(v.input().props.value,'');v.unmount();
});
test('losing verified status closes controls and drops late responses',async()=>{
  const wait=pending(),v=host({reply:r=>r.method==='GET'?wait.promise:defaultReply(r)});await load(v);await v.props({verified:false});
  wait.resolve(response({publication:authorization()}));await v.flush();assert.equal(v.button('Create GitHub draft'),undefined);assert.equal(v.button('Review GitHub publication').props.disabled,true);v.unmount();
});
test('an older response cannot unlock a new request after the same job is reverified',async()=>{
  const first=pending(),second=pending();let calls=0;
  const v=host({reply:r=>r.method==='GET'?(++calls===1?first.promise:second.promise):defaultReply(r)});
  await load(v);await v.props({verified:false});await v.props({verified:true});await v.click('Review GitHub publication');await v.key(token);await v.click('Load tested version');
  first.resolve(response({publication:null}));await v.flush();
  assert.equal(v.button('Load tested version').props.disabled,true);v.button('Load tested version').props.onClick();await v.flush();assert.equal(calls,2);
  second.resolve(response({publication:null}));await v.flush();assert.ok(v.button('Approve this version'));v.unmount();
});
test('saved provider URLs cannot navigate to an unrelated site',async()=>{
  const v=host({reply:r=>r.method==='GET'?response({publication:{...published(),outcome:{...published().outcome,url:'https://evil.example/token'}}}):defaultReply(r)});await load(v);
  assert.equal(v.nodes().filter(n=>n.type==='a').length,0);v.unmount();
});

test('expired uncertain publication can inspect its saved draft without renewing authority',async()=>{
  const saved={...authorization(),state:'uncertain',expiresAt:Date.now()-1000};
  const v=host({reply:r=>r.method==='GET'?response({publication:saved}):r.body?.action==='reconcilePublication'?response({...published(),expiresAt:saved.expiresAt,authorizationActive:false}):defaultReply(r)});
  await load(v);
  assert.equal(v.button('Resume approved publication').props.disabled,true);
  assert.equal(v.button('Review a new approval'),undefined);
  await v.click('Check saved GitHub draft');
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status','reconcilePublication']);
  assert.equal(v.publishedCount(),1);assert.equal(v.input(),undefined);v.unmount();
});

test('a canceled job can recover an existing attempt but cannot dispatch another publication',async()=>{
  const saved={...authorization(),state:'uncertain',revoked:true};
  const v=host({props:{verified:false,recoverable:true},reply:r=>r.method==='GET'?response({publication:saved}):response({...published(),revoked:true,authorizationActive:false})});
  await load(v);assert.equal(v.button('Create GitHub draft'),undefined);assert.equal(v.button('Resume approved publication'),undefined);
  await v.click('Check saved GitHub draft');
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status','reconcilePublication']);v.unmount();
});

test('failed recovery leaves the original approval visible and sends no publish request',async()=>{
  const v=host({reply:r=>r.method==='GET'?response({publication:{...authorization(),state:'uncertain'}}):response({error:'The saved draft is not confirmed'},409)});
  await load(v);await v.click('Check saved GitHub draft');
  assert.ok(v.text().includes('The saved draft is not confirmed'));assert.ok(v.button('Reload saved approval'));
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status','reconcilePublication']);v.unmount();
});

test('clearing an expired unstarted publication never claims a GitHub draft was saved',async()=>{
  const saved={...authorization(),expiresAt:Date.now()-1000};
  const cleared={...saved,state:'canceled-before-dispatch',outcome:null,reconciliation:'not-dispatched',authorizationActive:false};
  const v=host({reply:r=>r.method==='GET'?response({publication:saved}):response(cleared)});
  await load(v);await v.click('Clear unstarted publication');
  assert.deepEqual(v.requests.map(r=>r.body?.action||'status'),['status','reconcilePublication']);
  assert.ok(v.text().includes('No GitHub draft was created.'));
  assert.ok(!v.text().includes('saved in a GitHub draft'));
  assert.equal(v.publishedCount(),0);assert.equal(v.input().props.value,'');
  assert.equal(v.button('Create GitHub draft'),undefined);assert.equal(v.nodes().filter(n=>n.type==='a').length,0);
  v.unmount();
});

test('revoking an uncertain attempt retains read-only recovery controls',async()=>{
  const saved={...authorization(),state:'uncertain'};
  const v=host({reply:r=>r.method==='GET'?response({publication:saved}):r.body?.action==='revokePublication'?response({...saved,revoked:true}):response({...published(),revoked:true})});
  await load(v);await v.click('Revoke approval');
  assert.ok(v.button('Check saved GitHub draft'));
  assert.equal(v.button('Resume approved publication'),undefined);
  assert.equal(v.input().props.value,'');
  v.unmount();
});

test('an incomplete successful provider response cannot be displayed as a saved draft',async()=>{
  const v=host({reply:r=>r.body?.action==='publish'?response({...authorization(),state:'retryable',outcome:null}):defaultReply(r)});
  await load(v);await v.click('Approve this version');await v.click('Create GitHub draft');
  assert.ok(v.text().includes('has not confirmed the exact tested draft'));
  assert.equal(v.publishedCount(),0);assert.equal(v.input().props.value,token);
  assert.equal(v.nodes().filter(n=>n.type==='a').length,0);
  v.unmount();
});


test('a malformed saved publication never claims success or feeds invalid preview data to rendering',async()=>{
  for(const patch of [
    {outcome:{...published().outcome,draft:false}},
    {outcome:{...published().outcome,commit:'f'.repeat(40)}},
    {preview:{...preview,jobId:'job-b'}},
    {preview:{...preview,changedFiles:null}},
  ]){
    const v=host({reply:r=>r.method==='GET'?response({publication:{...published(),...patch}}):defaultReply(r)});
    await load(v);
    assert.ok(v.text().includes('saved publication response is incomplete'));
    assert.ok(!v.text().includes('Saved GitHub draft recovered.'));
    assert.equal(v.nodes().filter(n=>n.type==='a').length,0);assert.equal(v.publishedCount(),0);
    assert.equal(v.button('Create GitHub draft'),undefined);v.unmount();
  }
});

test('a malformed fresh preview and mismatched approval do not enable a draft',async()=>{
  const malformed=host({reply:r=>r.body?.action==='publicationPreview'?response({...preview,changedFiles:[null]}):defaultReply(r)});
  await load(malformed);assert.ok(malformed.text().includes('preview is incomplete'));assert.equal(malformed.button('Approve this version'),undefined);malformed.unmount();
  const changed=host({reply:r=>r.body?.action==='authorizePublication'?response({...authorization(),preview:{...preview,candidateCommit:'f'.repeat(40)}}):defaultReply(r)});
  await load(changed);await changed.click('Approve this version');
  assert.ok(changed.text().includes('does not match the reviewed version'));assert.equal(changed.button('Create GitHub draft'),undefined);assert.equal(changed.publishedCount(),0);changed.unmount();
});

test('unconfirmed revocation keeps the selected approval and does not announce success',async()=>{
  const v=host({reply:r=>r.body?.action==='revokePublication'?response({...authorization(),revoked:false}):defaultReply(r)});
  await load(v);await v.click('Approve this version');await v.click('Revoke approval');
  assert.ok(v.text().includes('did not confirm revocation'));assert.ok(!v.text().includes('Publication approval revoked.'));
  assert.equal(v.input().props.value,token);assert.ok(v.button('Create GitHub draft'));v.unmount();
});

test('GitHub canonical repository capitalization does not hide a confirmed draft',async()=>{
  const cased={...preview,repositoryId:'Owner/Repo'},result={...published(),preview:cased,revoked:true,expiresAt:Date.now()-1000};
  const v=host({props:{verified:false,recoverable:true},reply:r=>r.method==='GET'?response({publication:result}):defaultReply(r)});await load(v);
  assert.ok(v.text().includes('Saved GitHub draft recovered.'));
  assert.equal(v.nodes().find(n=>n.type==='a').props.href,'https://github.com/Owner/Repo/pull/7');v.unmount();
});
