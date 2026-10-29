import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Execute the actual component and its event handlers. The hook/element host
// controls request timing; it is not browser or assistive-technology evidence.
const sourcePath=process.env.OMNI_RUNTIME_COMPONENT_SOURCE||new URL('../components/runtime-workspace.tsx',import.meta.url);
const source=readFileSync(sourcePath,'utf8');
const parsed=ts.createSourceFile('runtime-workspace.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const imports=parsed.statements.filter(ts.isImportDeclaration);
const names=new Set();
for(const entry of imports){
  if(entry.importClause?.isTypeOnly)continue;
  for(const element of entry.importClause?.namedBindings?.elements||[])if(!element.isTypeOnly)names.add(element.name.text);
}
let body=source;
for(const entry of [...imports].reverse())body=body.slice(0,entry.getFullStart())+body.slice(entry.getEnd());
body=body.replace('export function RuntimeWorkspace','function RuntimeWorkspace');
const compiled=ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None,jsx:ts.JsxEmit.React,jsxFactory:'h',jsxFragmentFactory:'Fragment'}}).outputText;
const selectedSource=readFileSync(new URL('../lib/workspace-scope.ts',import.meta.url),'utf8');
const selectedBody=ts.transpileModule(selectedSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const scopeExports={};new Function('exports',selectedBody)(scopeExports);
const project=(id,extra={})=>({id,kind:'project',title:'Project '+id,projectId:'',status:'imported',data:{files:[{path:'index.js',content:'export const value = 1;'}],...extra}});
const A=project('A'),B=project('B'),C=project('C');
const pending=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};};
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const state=result=>({result,provider:{configured:false},repository:{configured:false},jobs:result?.payload?[result]:[],capabilityGaps:[]});
const plan=(id='integration-a')=>({id,conflicts:[],inventory:{projects:[{id:'A',contracts:[]},{id:'B',contracts:[]}]},requiredDecisions:[],verification:'Candidate only'});
const job=(projectId='A')=>({id:'job-'+projectId,projectId,mode:'native',status:'queued',objective:'Repair source',attempts:0,payload:{projectTitle:'Project '+projectId,kind:'development'},result:{reviews:[]}});

function host(props,respond=()=>response(state())){
  const slots=[],effects=[],requests=[];let cursor=0,tree,dirty=true,mounted=true,current={onUpdate(){},onNewProject(){},healing:false,...props};
  const same=(a,b)=>a?.length===b?.length&&a.every((v,i)=>Object.is(v,b[i]));
  const h=(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}});
  const deps={h,Fragment:'fragment'};
  deps.useState=initial=>{const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return [slots[index],next=>{if(!mounted)return;const value=typeof next==='function'?next(slots[index]):next;if(!Object.is(value,slots[index])){slots[index]=value;dirty=true;}}];};
  deps.useRef=initial=>{const index=cursor++;return slots[index]??=( {current:initial} );};
  deps.useCallback=(fn,dependencies)=>{const index=cursor++;if(!same(slots[index]?.dependencies,dependencies))slots[index]={value:fn,dependencies};return slots[index].value;};
  deps.useEffect=(fn,dependencies)=>{const index=cursor++;if(!same(slots[index]?.dependencies,dependencies)){effects.push(()=>{slots[index]?.cleanup?.();slots[index]={dependencies,cleanup:fn()};});}};
  for(const name of names)if(!(name in deps))deps[name]=name;
  Object.assign(deps,{selectedProject:scopeExports.selectedProject,jobPresentation:()=>({active:false,label:'Saved',detail:'Recorded job'}),groupCapabilityGaps:()=>[],fairReviewTasks:tasks=>tasks,specialists:[],explainJobError:text=>text,toast:{success(){},error(){}},companionOrigin:'http://localhost:8788',acceptsCompanionMessage:()=>false});
  const values=new Map(),location=new URL('https://omni.example/#runtime');
  const globals={window:{addEventListener(){},removeEventListener(){},dispatchEvent(){},open(){return null}},sessionStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},location,history:{replaceState(){}},setInterval:()=>0,clearInterval(){},setTimeout:()=>0,clearTimeout(){},fetch:async(url,init)=>{const entry={url:String(url),method:init?.method||'GET',body:init?.body?JSON.parse(init.body):null};requests.push(entry);return respond(entry);}};
  const factory=new Function(...Object.keys(deps),...Object.keys(globals),compiled+'\nreturn RuntimeWorkspace;');
  const Component=factory(...Object.values(deps),...Object.values(globals));
  function render(){if(!mounted)return;cursor=0;dirty=false;tree=Component(current);while(effects.length)effects.shift()();}
  function nodes(node){if(node===null||node===undefined||typeof node==='boolean')return [];if(Array.isArray(node))return node.flatMap(nodes);if(typeof node!=='object')return [];return [node,...nodes(node.props?.children)];}
  function text(node){if(node===null||node===undefined||typeof node==='boolean')return '';if(Array.isArray(node))return node.map(text).join('');if(typeof node!=='object')return String(node);return text(node.props?.children);}
  async function flush(){for(let n=0;n<20;n++){if(dirty)render();await Promise.resolve();}if(dirty)render();}
  function find(type,label){return nodes(tree).find(n=>n.type===type&&text(n)===label);}
  const api={requests,nodes:()=>nodes(tree),text:()=>text(tree),find,async flush(){await flush();},async props(next){current={...current,...next};dirty=true;await flush();},async change(type,predicate,value){const node=nodes(tree).find(n=>n.type===type&&predicate(n));assert.ok(node,'Expected interactive element');await node.props.onChange(value);await flush();},button:label=>find('button',label),async click(label,{force=false}={}){const button=find('button',label);assert.ok(button,'Missing button '+label);if(button.props.disabled&&!force)return;const pending=button.props.onClick();await flush();return pending;},unmount(){mounted=false;for(const slot of slots)slot?.cleanup?.();}};
  render();return api;
}

async function objective(view){await view.change('textarea',()=>true,{target:{value:'Repair the selected source'}});}
async function selectIntegration(view,id='B'){await view.change('select',n=>n.props.multiple,{target:{selectedOptions:[{value:id}]}});}
const mutations=view=>view.requests.filter(r=>r.method==='POST');

for(const selection of ['all','deleted-project',''])test('no implicit launch or integration target for '+JSON.stringify(selection),async()=>{
  const view=host({projects:[A,B],projectId:selection});await view.flush();await objective(view);await selectIntegration(view);
  assert.equal(view.button('Start work').props.disabled,true);
  assert.equal(view.button('Plan how they connect').props.disabled,true);
  await view.click('Start work',{force:true});await view.click('Plan how they connect',{force:true});
  assert.equal(mutations(view).length,0);view.unmount();
});

test('self healing also requires one selected project',async()=>{
  const view=host({projects:[A,B],projectId:'all',healing:true});await view.flush();
  assert.equal(view.button('Start work').props.disabled,true);await view.click('Start work',{force:true});assert.equal(mutations(view).length,0);view.unmount();
});

test('selected project, not first project, owns a native launch',async()=>{
  const view=host({projects:[A,B],projectId:'B'},r=>response(state(r.body?.action==='enqueue'?job('B'):r.body?.action==='tick'?{...job('B'),status:'awaiting review'}:undefined)));
  await view.flush();await objective(view);await view.click('Start work');
  assert.equal(mutations(view).find(r=>r.body.action==='enqueue').body.projectId,'B');view.unmount();
});

test('a rendered launch callback becomes inert if its project is deleted',async()=>{
  const view=host({projects:[A,B],projectId:'A'});await view.flush();await objective(view);const callback=view.button('Start work').props.onClick;
  await view.props({projects:[B]});await callback();await view.flush();assert.equal(mutations(view).length,0);view.unmount();
});

test('switching projects clears old integration plans and selected partner projects',async()=>{
  const view=host({projects:[A,B,C],projectId:'A'},r=>response(state(r.body?.action==='createIntegration'?plan():undefined)));
  await view.flush();await objective(view);await selectIntegration(view);await view.click('Plan how they connect');assert.ok(view.button('Propose integration changes'));
  await view.props({projectId:'C'});assert.equal(view.button('Propose integration changes'),undefined);
  assert.deepEqual(view.nodes().find(n=>n.type==='select'&&n.props.multiple).props.value,[]);view.unmount();
});

test('a delayed integration response cannot attach to the new project, even after switching back',async()=>{
  const wait=pending();const view=host({projects:[A,B,C],projectId:'A'},r=>r.body?.action==='createIntegration'?wait.promise:response(state()));
  await view.flush();await objective(view);await selectIntegration(view);const task=view.button('Plan how they connect').props.onClick();await view.flush();
  await view.props({projectId:'C'});await view.props({projectId:'A'});wait.resolve(response(state(plan())));await task;await view.flush();
  assert.equal(view.button('Propose integration changes'),undefined);view.unmount();
});

test('deleted partner projects cannot enter an integration request',async()=>{
  const view=host({projects:[A,B],projectId:'A'});await view.flush();await objective(view);await selectIntegration(view);const callback=view.button('Plan how they connect').props.onClick;
  await view.props({projects:[A]});await callback();await view.flush();assert.equal(mutations(view).length,0);view.unmount();
});

test('switching while audit lookup is pending prevents audit mutation and job enqueue',async()=>{
  const wait=pending(),origin={url:'https://github.com/example/project-a'};
  const view=host({projects:[project('A',{origin}),B],projectId:'A'},r=>r.url.includes('latestAudit')?wait.promise:response(state(job())));
  await view.flush();await objective(view);const task=view.button('Start work').props.onClick();await view.flush();await view.props({projectId:'B'});
  wait.resolve(response(null));await task;await view.flush();assert.equal(mutations(view).length,0);view.unmount();
});

test('failed audit cannot silently fall through to job creation',async()=>{
  const origin={url:'https://github.com/example/project-a'};
  const view=host({projects:[project('A',{origin})],projectId:'A'},r=>r.url.includes('latestAudit')?response({error:'Audit unavailable'},503):response(state(job())));
  await view.flush();await objective(view);await view.click('Start work');assert.equal(mutations(view).length,0);assert.match(view.text(),/Audit unavailable/);view.unmount();
});

test('an old integration job response cannot launch generation in the new selection',async()=>{
  const wait=pending();const view=host({projects:[A,B,C],projectId:'A'},r=>r.body?.action==='createIntegration'?response(state(plan())):r.body?.action==='integrationJob'?wait.promise:response(state()));
  await view.flush();await objective(view);await selectIntegration(view);await view.click('Plan how they connect');
  const task=view.button('Propose integration changes').props.onClick();await view.flush();await view.props({projectId:'C'});
  wait.resolve(response(state(job())));await task;await view.flush();assert.deepEqual(mutations(view).map(r=>r.body.action),['createIntegration','integrationJob']);view.unmount();
});

test('a completed integration proposal remains executable for its current selection',async()=>{
  const view=host({projects:[A,B],projectId:'A'},r=>response(state(r.body?.action==='createIntegration'?plan():r.body?.action==='integrationJob'?job():r.body?.action==='tick'?{...job(),status:'awaiting review'}:undefined)));
  await view.flush();await objective(view);await selectIntegration(view);await view.click('Plan how they connect');await view.click('Propose integration changes');
  assert.deepEqual(mutations(view).map(r=>r.body.action),['createIntegration','integrationJob','tick']);view.unmount();
});

test('a captured proposal callback cannot execute after switching away and back',async()=>{
  const view=host({projects:[A,B,C],projectId:'A'},r=>response(state(r.body?.action==='createIntegration'?plan():undefined)));
  await view.flush();await objective(view);await selectIntegration(view);await view.click('Plan how they connect');const callback=view.button('Propose integration changes').props.onClick;
  await view.props({projectId:'C'});await view.props({projectId:'A'});await callback();await view.flush();
  assert.deepEqual(mutations(view).map(r=>r.body.action),['createIntegration']);view.unmount();
});

test('switching after enqueue preserves that request but prevents additional dispatch',async()=>{
  const wait=pending();const view=host({projects:[A,B],projectId:'A'},r=>r.body?.action==='enqueue'?wait.promise:response(state()));
  await view.flush();await objective(view);const task=view.button('Start work').props.onClick();await view.flush();await view.props({projectId:'B'});
  wait.resolve(response(state(job())));await task;await view.flush();assert.deepEqual(mutations(view).map(r=>r.body.action),['enqueue']);view.unmount();
});

test('audit execution keeps the chosen project through its final status read',async()=>{
  const origin={url:'https://github.com/example/project-b'},audit={id:'audit-b',projectId:'B',status:'active',counts:[{status:'queued',n:1}],commit:'b'.repeat(40)};
  const view=host({projects:[A,project('B',{origin})],projectId:'B'},r=>r.url.includes('latestAudit')?response(null):response(state(r.body?.action==='startAudit'?audit:r.body?.action==='auditStep'?{...audit,status:'completed',counts:[]}:undefined)));
  await view.flush();await view.click('Audit entire repository');
  assert.deepEqual(mutations(view).map(r=>r.body),[{action:'startAudit',projectId:'B'},{action:'auditStep',id:'audit-b'},{action:'auditStep',id:'audit-b'}]);view.unmount();
});

test('an audit for a different project cannot be resumed or launch a job',async()=>{
  const origin={url:'https://github.com/example/project-a'},audit={id:'audit-b',projectId:'B',status:'active',counts:[]};
  const view=host({projects:[project('A',{origin}),B],projectId:'A'},r=>r.url.includes('latestAudit')?response(audit):response(state(job())));
  await view.flush();await objective(view);await view.click('Start work');assert.equal(mutations(view).length,0);assert.match(view.text(),/does not match/);view.unmount();
});

test('unmounting during audit lookup prevents later mutations',async()=>{
  const wait=pending(),origin={url:'https://github.com/example/project-a'};
  const view=host({projects:[project('A',{origin})],projectId:'A'},r=>r.url.includes('latestAudit')?wait.promise:response(state(job())));
  await view.flush();await objective(view);const task=view.button('Start work').props.onClick();await view.flush();view.unmount();
  wait.resolve(response(null));await task;assert.equal(mutations(view).length,0);
});
