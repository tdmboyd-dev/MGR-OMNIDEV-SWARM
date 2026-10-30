import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const source=readFileSync(new URL('../components/build-progress.tsx',import.meta.url),'utf8');
const parsed=ts.createSourceFile('build-progress.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let body=source;
for(const entry of [...parsed.statements.filter(ts.isImportDeclaration)].reverse())body=body.slice(0,entry.getFullStart())+body.slice(entry.getEnd());
body=body.replace('export function BuildProgressView','function BuildProgressView');
const compiled=ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None,jsx:ts.JsxEmit.React,jsxFactory:'h'}}).outputText;
const board=readFileSync(new URL('../public/owner-progress.html',import.meta.url),'utf8');
const progressData=JSON.parse(board.match(/<script id="progress-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const changedBoard=change=>{
  const altered=structuredClone(progressData);change(altered);
  return board.replace(/(<script id="progress-data" type="application\/json">)[\s\S]*?(<\/script>)/,
    (_,start,end)=>start+JSON.stringify(altered).replace(/</g,'\\u003c')+end);
};
const reply=(html=board,status=200,type='text/html')=>new Response(html,{status,headers:{'Content-Type':type}});

function host(responses){
  const slots=[],effects=[],requests=[];let cursor=0,dirty=true,tree,mounted=true;
  const h=(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}});
  const useState=initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>{if(mounted){slots[i]=typeof value==='function'?value(slots[i]):value;dirty=true;}}];};
  const useEffect=(fn,deps)=>{const i=cursor++;if(!slots[i]||deps.some((v,n)=>v!==slots[i].deps[n]))effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});};
  const fetch=(url,init)=>{requests.push({url,init});const response=responses.shift();return Promise.resolve(typeof response==='function'?response(init):response);};
  const Component=new Function('h','useState','useEffect','fetch',compiled+'\nreturn BuildProgressView;')(h,useState,useEffect,fetch);
  const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
  const text=n=>Array.isArray(n)?n.map(text).join(''):n==null||typeof n==='boolean'?'':typeof n!=='object'?String(n):text(n.props?.children);
  async function flush(){for(let i=0;i<30;i++){if(dirty&&mounted){dirty=false;cursor=0;tree=Component();while(effects.length)effects.shift()();}await Promise.resolve();}}
  return {requests,flush,nodes:()=>nodes(tree),text:()=>text(tree),retry(){const b=nodes(tree).find(n=>n.type==='button'&&text(n)==='Retry progress board');assert.ok(b);b.props.onClick();},unmount(){mounted=false;for(const slot of slots)slot?.cleanup?.();}};
}

test('progress screen loads the saved board with a named isolated frame and no-store fetch',async()=>{
  const view=host([reply()]);await view.flush();const frame=view.nodes().find(n=>n.type==='iframe');assert.ok(frame);
  assert.equal(frame.props.srcDoc,board);assert.match(frame.props.title,/requirements/);assert.ok(!frame.props.sandbox.includes('allow-same-origin'));
  assert.ok(frame.props.sandbox.split(' ').includes('allow-downloads'),'The embedded board must support its user-requested exports');
  assert.equal(view.requests[0].url,'/owner-progress.html');assert.equal(view.requests[0].init.cache,'no-store');assert.equal(view.requests[0].init.redirect,'error');view.unmount();
});
test('HTML mentioning 441, incomplete registers and malformed provenance never appear as a saved board',async()=>{
  const invalid=[
    '<!doctype html><html><body>441 — sign in or temporary error</body></html>',
    board.slice(0,-30),
    changedBoard(data=>data.schema='unrelated.report'),
    changedBoard(data=>data.tasks.pop()),
    changedBoard(data=>data.tasks[1].id=data.tasks[0].id),
    changedBoard(data=>data.tasks[0].acceptance.pop()),
    changedBoard(data=>data.tasks[1].acceptance[0].id=data.tasks[0].acceptance[0].id),
    changedBoard(data=>data.tasks[0].acceptance[0].requirement=''),
    changedBoard(data=>data.upgrades.pop()),
    changedBoard(data=>data.summaries.acceptanceClauses=440),
    changedBoard(data=>data.sourceSnapshot.commit='main'),
  ];
  for(const html of invalid){
    const view=host([reply(html),reply()]);await view.flush();
    assert.equal(view.nodes().some(n=>n.type==='iframe'),false);assert.match(view.text(),/incomplete/);
    view.retry();await view.flush();assert.ok(view.nodes().find(n=>n.type==='iframe'));view.unmount();
  }
});
test('failed or incorrect board reads expose a retry instead of a stale successful frame',async()=>{
  for(const response of [reply('missing',404),reply('{}',200,'application/json'),reply('<html>partial</html>')]){
    const view=host([response,reply()]);await view.flush();assert.equal(view.nodes().some(n=>n.type==='iframe'),false);assert.ok(view.nodes().some(n=>n.props.role==='alert'));
    view.retry();await view.flush();assert.equal(view.requests.length,2);assert.equal(view.nodes().find(n=>n.type==='iframe').props.srcDoc,board);view.unmount();
  }
});
test('a board request is canceled on navigation and a late reply cannot display it',async()=>{
  let resolve;const pending=new Promise(r=>{resolve=r;});const view=host([pending]);await view.flush();view.unmount();assert.equal(view.requests[0].init.signal.aborted,true);
  resolve(reply());await view.flush();assert.equal(view.nodes().some(n=>n.type==='iframe'),false);
});
