import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const transpile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;

test('actual source picker fences older selection, invalid replacement and cancelled reads',async()=>{
 const page=readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8'),begin=page.indexOf(' async function readFiles('),end=page.indexOf('\n const projectOptions=',begin);
 const state={files:[],error:'',reading:false,title:''},context={selectionRevision:{current:0},selectionMounted:{current:true},setImportFiles:x=>state.files=x,setFileError:x=>state.error=x,setFileReading:x=>state.reading=x,setTitle:fn=>state.title=typeof fn==='function'?fn(state.title):fn};vm.createContext(context);vm.runInContext(transpile(page.slice(begin,end))+'\nglobalThis.read=readFiles;',context);
 const old=deferred();const pending=context.read([{name:'old.txt',size:3,text:()=>old.promise}]);assert.equal(state.reading,true);
 state.title='Owner typed title';await context.read([{name:'new.txt',size:3,text:async()=> 'new'}]);old.resolve('old');await pending;
 assert.equal(state.files.length,1);assert.equal(state.files[0].path,'new.txt');assert.equal(state.files[0].content,'new');assert.equal(state.title,'Owner typed title');
 const late=deferred(),reading=context.read([{name:'late.txt',size:3,text:()=>late.promise}]);await context.read([{name:'too-large.txt',size:100001,text:async()=> 'never'}]);late.resolve('private late content');await reading;assert.equal(state.files.length,0);assert.match(state.error,/100 KB/);assert.equal(state.reading,false);
 const cancelled=deferred(),cancelRead=context.read([{name:'cancelled.txt',size:3,text:()=>cancelled.promise}]);context.selectionRevision.current++;context.selectionMounted.current=false;cancelled.resolve('cancelled private content');await cancelRead;assert.equal(state.files.length,0);
});

function engineFixture(){const source=readFileSync(new URL('../components/engine-connection.tsx',import.meta.url),'utf8'),start=source.indexOf('export function EngineConnection(){'),end=source.indexOf(' return <>',start),states=[],effects=[],intervals=[],events=[],listeners=new Map(),requests=[],timeouts=new Map();let hook=0,timer=0;
 const storage=new Map([['omni-engine-disconnected','yes']]);
 const context={exports:{},companionOrigin:'http://127.0.0.1:8765',useState:initial=>{const index=hook++;states[index]=initial;return [initial,x=>states[index]=x];},useRef:current=>({current}),useEffect:effect=>effects.push(effect()),setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval:()=>{},setTimeout:fn=>{timeouts.set(++timer,fn);return timer;},clearTimeout:id=>timeouts.delete(id),AbortSignal,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),dispatchEvent:event=>{events.push(event.type);listeners.get(event.type)?.(event);}},CustomEvent:class {constructor(type,{detail}={}){this.type=type;this.detail=detail;}},fetch:(url,options)=>{const pending=deferred();requests.push({url,options,...pending});return pending.promise;}};
 vm.createContext(context);vm.runInContext(transpile(source.slice(start,end)+' return {reconnect,disconnect,connection,launchInstalled};\n}'),context);const engine=context.exports.EngineConnection();return {engine,states,effects,intervals,events,requests,timeouts};}
test('actual engine status and reconnect cannot undo an explicit disconnect',async()=>{
 const f=engineFixture();f.engine.connection.current={session:'old'};const poll=f.intervals[0]();f.engine.disconnect();f.requests[0].resolve({ok:true,status:200});await poll;assert.equal(f.states[0],'offline');assert.equal(f.engine.connection.current,null);
 const reconnect=f.engine.reconnect();assert.equal(f.requests.length,2);f.engine.disconnect();f.requests[1].resolve({ok:true,json:async()=>({session:'new'})});await reconnect;assert.equal(f.requests.length,2);assert.equal(f.states[0],'offline');assert.equal(f.events.includes('omnidev-engine-connected'),false);
});
test('actual engine unmount fences late reconnect and clears the deferred launcher',async()=>{
 const f=engineFixture();f.engine.launchInstalled();assert.equal(f.timeouts.size,1);const pending=f.engine.reconnect();f.effects[0]();assert.equal(f.timeouts.size,0);f.requests[0].resolve({ok:true,json:async()=>({session:'late'})});await pending;assert.equal(f.requests.length,1);assert.equal(f.events.includes('omnidev-engine-connected'),false);
});

function runtimeFixture(){const source=readFileSync(new URL('../components/runtime-workspace.tsx',import.meta.url),'utf8'),start=source.indexOf(' async function localApi('),end=source.indexOf(' async function generateInsideOmni(',start),gate=deferred();const events=[],requests=[];let generations=0;
 const view={models:[{id:'fixture',reasoning:['default']}],preferences:{model:'fixture',effort:'default',profile:'codex'}};
 const context={localBusy:false,localJob:null,localConnection:null,selectionKey:'fixture',companionOrigin:'http://127.0.0.1:8765',runtimeLife:{current:{alive:true,epoch:0,connecting:false}},engineDisconnected:{current:false},sessionStorage:{setItem:()=>{},removeItem:()=>{}},stage:()=>{},setCompanionModal:()=>{},setLocalCandidate:()=>{},setLocalJob:()=>{},setLocalBusy:()=>{},setLocalError:()=>{},setLocalConnection:()=>{},setLocalModels:()=>{},setLocalModel:()=>{},setLocalEffort:()=>{},setLocalProfile:()=>{},generateInsideOmni:async()=>{generations++;},window:{dispatchEvent:e=>events.push(e.type)},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},fetch:async(url,options)=>{requests.push({url,options});if(url.endsWith('/connect'))return gate.promise;if(url==='/engine-release.json')return {ok:false};return {ok:true,json:async()=>view};}};
 vm.createContext(context);vm.runInContext(transpile(source.slice(start,end))+'\nglobalThis.local=localApi;globalThis.connect=connectInsideOmni;',context);return {context,requests,events,gate,get generations(){return generations;}};}
test('actual runtime late connection cannot reenable a disconnected engine or start model work',async()=>{
 const f=runtimeFixture(),pending=f.context.connect({id:'job'},true);f.context.engineDisconnected.current=true;f.context.runtimeLife.current.epoch++;f.gate.resolve({ok:true,json:async()=>({session:'fixture-session'})});await pending;
 assert.equal(f.requests.length,1);assert.equal(f.generations,0);assert.equal(f.events.length,0);assert.equal(f.context.runtimeLife.current.connecting,false);
 f.context.engineDisconnected.current=false;await f.context.connect({id:'job'},true);assert.equal(f.generations,1);assert.deepEqual(f.events,['omnidev-engine-connected']);assert.equal(f.context.runtimeLife.current.connecting,false);
});
test('actual runtime local mutation gateway rejects disconnect or unmount before any new model dispatch',async()=>{
 const f=runtimeFixture();f.context.engineDisconnected.current=true;
 for(const path of ['/start','/start-reviews','/append-work'])await assert.rejects(()=>f.context.local(path,{request:{}}),/Engine disconnected/);assert.equal(f.requests.length,0);
 f.context.engineDisconnected.current=false;f.context.runtimeLife.current.alive=false;await assert.rejects(()=>f.context.local('/start',{request:{}}),/Engine disconnected/);assert.equal(f.requests.length,0);
});

test('actual automatic review connection cannot undo disconnect, pause or unmount during its await',async()=>{
 const source=readFileSync(new URL('../components/runtime-workspace.tsx',import.meta.url),'utf8'),start=source.indexOf(' async function coordinateReviews('),end=source.indexOf(' useEffect(()=>{if(busy||localBusy||coordinating.current',start);
 for(const stop of ['disconnect','pause','unmount']){
  const gate=deferred(),actions=[],events=[],requests=[];let connecting;
  const reached=new Promise(resolve=>connecting=resolve),job={id:'parent',payload:{automaticRepair:false},result:{reviews:[],reviewPlan:{budget:1,tasks:[{index:0}],control:{status:'playing'}}}};
  const context={AbortSignal,coordinating:{current:false},runtimeLife:{current:{alive:true,epoch:0}},engineDisconnected:{current:false},haltRequested:{current:null},reviewHalted:id=>context.engineDisconnected.current||context.haltRequested.current?.id===id,fairReviewTasks:x=>x,reviewConcurrency:1,localConnection:null,localModel:'',localEffort:'default',localProfile:'codex',stage:()=>{},setLocalBusy:()=>{},setLocalJob:()=>{},setCompanionModal:()=>{},setReviewTelemetry:()=>{},setLocalConnection:()=>{},setActiveReviewIndex:()=>{},setError:()=>{},onUpdate:()=>{},setTimeout,companionOrigin:'http://127.0.0.1:8765',CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},window:{dispatchEvent:event=>{events.push(event.type);context.engineDisconnected.current=false;context.runtimeLife.current.epoch++;}},fetch:async url=>{requests.push(url);if(url.endsWith('/connect')){connecting();return gate.promise;}return {ok:true,json:async()=>({index:0,jobId:'review',brain:{kind:'account'}})};},localApi:async path=>{if(path.startsWith('/jobs/'))throw Error('No saved job');if(path==='/state')return {models:[{id:'fixture',reasoning:['default']}],preferences:{model:'fixture'}};actions.push(path);return {};},act:async payload=>{actions.push(payload.action);return {};}};
  vm.createContext(context);vm.runInContext(transpile(source.slice(start,end))+'\nglobalThis.review=coordinateReviews;',context);
  const work=context.review(job);await reached;
  if(stop==='disconnect'){context.engineDisconnected.current=true;context.runtimeLife.current.epoch++;}else if(stop==='pause')context.haltRequested.current={id:'parent',command:'pause'};else{context.runtimeLife.current.alive=false;context.runtimeLife.current.epoch++;}
  gate.resolve({ok:true,json:async()=>({session:'late'})});await work;
  assert.deepEqual(events,[],stop+' cannot emit a connected event');assert.deepEqual(actions,[],stop+' cannot dispatch a new specialist/model action');assert.equal(context.coordinating.current,false);
 }
});
