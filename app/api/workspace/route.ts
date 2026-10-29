import {fileLedger} from '@/lib/file-ledger';
import {db,list,record,insert} from "@/db/store";
import {domains,exampleFiles} from "@/lib/catalog";
import {analyze,simulate,type SourceFile} from "@/lib/analyzer";
import {githubSnapshot} from "@/lib/github";
import {planningSource,buildFuturePlan,futureEvaluation,findingKey,planningDigest} from '@/lib/workspace-planning';
import {admittedWrite,sourceGuard,recordGuard,combineGuards,guardedInsert,WorkspaceConflict} from '@/lib/workspace-storage';
import type {RecordItem} from '@/lib/catalog';
export const dynamic="force-dynamic";
class InputError extends Error{}
function check(v:unknown,msg:string):asserts v{if(!v)throw new InputError(msg);}
function text(v:unknown,max=200){check(typeof v==="string"&&v.trim().length>0&&v.length<=max,"A valid text value is required");return v.trim();}
function numeric(v:unknown,min:number,max:number){check(typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max,"Value is outside the allowed range");return v;}
function redact(s:string){return s.replace(/((?:api[_-]?key|password|secret)\s*[:=]\s*["'])[^"']+/gi,"$1[REDACTED]").replace(/(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16})/g,"[REDACTED]");}
async function currentSource(project:RecordItem,existing:RecordItem[],expected:unknown){
 const source=await planningSource(project,existing);
 check(typeof expected==='string'&&expected===source.sourceDigest,'Project or findings changed; reload before saving');return source;
}
export async function GET(){try{return Response.json({records:await list()},{headers:{"Cache-Control":"no-store"}});}catch(e){console.error("workspace read failed",e);return Response.json({error:"Workspace storage is unavailable. Please retry."},{status:503});}}
export async function POST(request:Request){
 try{
  const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return Response.json({error:"Cross-origin request refused"},{status:403});
  check(Number(request.headers.get("content-length")||0)<2200000,"Import exceeds the 2 MB limit");
  const raw=await request.text();check(raw.length<2200000,"Import exceeds the 2 MB limit");const p=JSON.parse(raw);check(p&&typeof p==='object'&&!Array.isArray(p),'A valid action is required');let out:any={};const existing=await list();const ops:any[]=[];
  check(existing.length<9000,"Workspace record limit reached");
  const audit=(title:string,data:any={},pid="")=>ops.push(insert(record("memory",title,{type:"Activity",...data},pid)));
  if(p.action==="initialize"){
   if(!existing.some(r=>r.kind==="swarm")){const root=record("swarm","Omni Core",{domain:"Orchestration",parentId:null},"","ready");root.id="omni-core";ops.push(insert(root,true));for(const d of domains){const s=record("swarm",d+" Swarm",{domain:d,parentId:root.id},"","ready");s.id="master-"+d.toLowerCase().replace(/[^a-z0-9]+/g,"-");ops.push(insert(s,true));}audit("Workspace initialized",{content:"47 specialist master swarms registered. Execution requires a connected runtime."});}
  }else if(p.action==="import"||p.action==="example"||(p.action==="github"||p.action==="githubAccount")){
   let snapshot:any=null; if(p.action==="github"||p.action==="githubAccount"){try{snapshot=await githubSnapshot(text(p.location,500),p.action==="githubAccount");}catch(e:any){throw new InputError(e.message)}}
   const files:SourceFile[]=p.action==="example"?exampleFiles:snapshot?snapshot.files:p.files;const name=p.action==="example"?"Atlas Commerce":snapshot?snapshot.title:text(p.title);
   check(Array.isArray(files)&&files.length>0&&files.length<=300,"Import 1–300 files");
   check(files.every(f=>typeof f.path==="string"&&f.path.length<300&&typeof f.content==="string"&&f.content.length<100000),"Invalid files; each file must be text under 100 KB");
   check(new Set(files.map(f=>f.path)).size===files.length,"File paths must be unique");
   const result=analyze(files);const project=record("project",name,{source:p.action==="example"?"Example dataset":snapshot?snapshot.authenticated?"Authorized GitHub snapshot":"Public GitHub snapshot":"Imported snapshot",origin:snapshot?{url:snapshot.url,ref:snapshot.ref,commit:snapshot.commit,tree:snapshot.tree,partial:snapshot.partial,coverage:snapshot.coverage}:null,fileLedger:await fileLedger(files.map(f=>({path:f.path,content:redact(f.content)}))),files:files.map(f=>({path:f.path,content:redact(f.content)})),analysis:result,scanCount:1},"","analyzed");ops.push(insert(project));
   for(const f of result.findings)ops.push(insert(record("finding",f.title,f,project.id,"open")));
   audit("Snapshot analyzed: "+name,{content:files.length+" files mapped; "+result.findings.length+" rule-based findings. "+result.scope},project.id);out={projectId:project.id};
  }else if(p.action==="spawn"){
   const parent=existing.find(r=>r.id===p.parentId&&r.kind==="swarm");check(parent,"Parent swarm does not exist");const s=record("swarm",text(p.title),{domain:text(p.domain),parentId:parent.id},"","ready");ops.push(insert(s));audit("Specialist spawned: "+s.title,{content:"Parent: "+parent.title});out={id:s.id};
  }else if(p.action==="mission"){
   const project=existing.find(r=>r.id===p.projectId&&r.kind==="project");check(project,"Select an imported project");const objective=text(p.objective,2000);const a=analyze(project.data.files);const focus=a.findings.sort((x,y)=>({critical:0,high:1,medium:2,low:3}[x.severity as string]||0)-({critical:0,high:1,medium:2,low:3}[y.severity as string]||0)).slice(0,5);
   const run=record("mission",objective,{mode:"Rule-based plan",steps:focus.map(f=>({title:f.title,domain:f.category,instruction:f.remediation,evidence:f.file,status:"review"})),projectName:project.title,objective,execution:"No code was changed. No agent runtime is connected."},project.id,"awaiting review");ops.push(insert(run));audit("Development plan created",{content:objective},project.id);out={id:run.id};
  }else if(p.action==="rescan"){
   const project=existing.find(r=>r.id===p.projectId&&r.kind==='project');check(project,'Project not found');
   const source=await currentSource(project,existing,p.expectedSourceDigest),a=analyze(project.data.files),now=new Date().toISOString();
   const previous=existing.filter(r=>r.kind==='finding'&&r.projectId===project.id);
   const current=new Map(a.findings.map(f=>[findingKey(f),f]));
   const uninspectedSecurity=new Set(a.securityAnalysis.files.filter(f=>f.status!=='inspected-heuristic').map(f=>f.path));
   const updates:RecordItem[]=previous.map(r=>{
    const signal=current.get(findingKey({title:r.title,file:r.data.file}));
    if(signal){const data={...r.data,...signal,lastObservedSnapshotDigest:source.snapshotDigest};delete data.snapshotResolved;return {...r,data,status:r.data.snapshotResolved?'open':r.status,updatedAt:now};}
    if(r.data.category==='Security'&&uninspectedSecurity.has(r.data.file))return r;
    return ['open','in review'].includes(r.status)?{...r,status:'resolved',data:{...r.data,snapshotResolved:true,resolution:'Signal absent from the current stored snapshot; not proof of a runtime repair.'},updatedAt:now}:r;
   });
   const seen=new Set(previous.map(r=>findingKey({title:r.title,file:r.data.file})));
   const additions=a.findings.filter(f=>!seen.has(findingKey(f))).map(f=>record('finding',f.title,{...f,lastObservedSnapshotDigest:source.snapshotDigest},project.id,'open'));
   const next={...project.data,fileLedger:await fileLedger(project.data.files,project.data.fileLedger||[]),analysis:a,scanCount:(project.data.scanCount||1)+1};
   const event=record('memory','Snapshot rescanned',{type:'Activity',content:'Reconciled signals against the stored snapshot; manual dispositions retained. Snapshot absence is not verified repair.',snapshotDigest:source.snapshotDigest},project.id);
   await admittedWrite(sourceGuard(project,existing),guard=>[
    db().prepare('UPDATE records SET data=?,updated_at=? WHERE id=? AND '+guard.sql).bind(JSON.stringify(next),now,project.id,...guard.args),
    ...updates.filter(r=>r!==previous.find(old=>old.id===r.id)).map(r=>db().prepare('UPDATE records SET status=?,data=?,updated_at=? WHERE id=? AND '+guard.sql).bind(r.status,JSON.stringify(r.data),now,r.id,...guard.args)),
    ...additions.map(r=>guardedInsert(r,guard)),guardedInsert(event,guard)
   ]);out={projectId:project.id};
  }else if(p.action==="finding"){
   const r=existing.find(r=>r.id===p.id&&r.kind==='finding');check(r,'Finding not found');check(['open','in review','accepted risk','resolved'].includes(p.status),'Invalid status');
   const data={...r.data};delete data.snapshotResolved;data.dispositionSource='manual';
   const event=record('memory','Finding disposition updated',{type:'Activity',content:r.title+': '+p.status+'. Manual disposition; no automated repair verification.'},r.projectId);
   await admittedWrite(recordGuard(r),guard=>[db().prepare('UPDATE records SET status=?,data=?,updated_at=? WHERE id=? AND '+guard.sql).bind(p.status,JSON.stringify(data),new Date().toISOString(),r.id,...guard.args),guardedInsert(event,guard)]);
  }else if(p.action==="review"){
   const r=existing.find(r=>r.id===p.id&&r.kind==="mission");check(r&&r.status==="awaiting review","Plan is not awaiting review");check(["approved plan","rejected"].includes(p.status),"Invalid decision");ops.push(db().prepare("UPDATE records SET status=?,updated_at=? WHERE id=?").bind(p.status,new Date().toISOString(),r.id));audit("Development plan "+p.status,{content:r.title+". Approval records a decision; it does not run or deploy code."},r.projectId);
  }else if(p.action==="memory"){
   const r=record("memory",text(p.title),{type:p.type==="Decision"?"Decision":"Research",content:text(p.content,10000)},"","saved");ops.push(insert(r));out={id:r.id};
  }else if(p.action==="connection"){
   const r=record("connection",text(p.title),{provider:text(p.provider),endpoint:p.endpoint?text(p.endpoint,500):"",detail:"Catalog registration only. Provider authorization and an execution adapter are not configured."},"","not connected");ops.push(insert(r));audit("Connection registered: "+r.title,{content:"Awaiting provider authorization. No external access has occurred."});out={id:r.id};
  }else if(p.action==="simulate"){
   check(p.projectId===undefined||typeof p.projectId==='string','Select a valid project or an unassigned scenario');const projectId=p.projectId||'';
   const project=projectId?existing.find(r=>r.id===projectId&&r.kind==='project'):undefined;check(!projectId||project,'Select an imported project');
   const source=project?await currentSource(project,existing,p.expectedSourceDigest):null;
   const input={traffic:numeric(p.traffic,0,1000000),capacity:numeric(p.capacity,1,1000000),latency:numeric(p.latency,1,100000),cost:numeric(p.cost,0,1000000),replicas:numeric(p.replicas,1,1000)};
   check(Number.isInteger(input.replicas),'Replicas must be an integer');const result=simulate(input);
   const r=record('simulation','Capacity scenario · '+input.replicas+' replicas',{input,...result,source,inputProvenance:'Owner-entered hypothetical assumptions; no billing, traffic or staging measurements were imported.'},projectId,'modeled');
   await admittedWrite(project?sourceGuard(project,existing):combineGuards(),guard=>[guardedInsert(r,guard)]);out={id:r.id,result};
  }else if(p.action==="future"){
   const project=existing.find(r=>r.id===p.projectId&&r.kind==='project');check(project,'Select an imported project');
   const source=await currentSource(project,existing,p.expectedSourceDigest),data=await buildFuturePlan(project,existing);
   const prior=existing.filter(r=>r.kind==='roadmap'&&r.projectId===project.id).sort((a,b)=>(b.data.version||0)-(a.data.version||0)||b.createdAt.localeCompare(a.createdAt))[0];
   const r=record('roadmap',project.title+' · Future states',{...data,version:(prior?.data.version||0)+1,previousPlanId:prior?.id||null},project.id,'proposed');
   r.id='future:'+project.id+':'+source.sourceDigest;
   const event=record('memory','Future-state roadmap drafted',{type:'Activity',content:r.title+'. Evidence-based planning hypotheses; no measured prediction or release approval.',planId:r.id,sourceDigest:source.sourceDigest},project.id);
   await admittedWrite(sourceGuard(project,existing),guard=>[
    guardedInsert(r,guard,true),
    guardedInsert(event,{sql:'changes()=1 AND '+guard.sql,args:guard.args})
   ]);out={id:r.id};
  }else if(p.action==='evaluateFuture'){
   const plan=existing.find(r=>r.id===p.id&&r.kind==='roadmap');check(plan,'Future plan not found');
   const project=existing.find(r=>r.id===plan.projectId&&r.kind==='project');check(project,'Project not found');
   const source=await currentSource(project,existing,p.expectedSourceDigest);
   const contract={schema:plan.data.schema,source:plan.data.source,horizons:plan.data.horizons,excludedFindings:plan.data.excludedFindings,method:plan.data.method};
   check(plan.data.contractDigest===await planningDigest(contract),'Original plan contract changed; create a new version');
   let evaluation;try{evaluation=futureEvaluation(p,plan.data,source);}catch(e){throw new InputError((e as Error).message);}
   const next={...plan.data,revision:plan.data.revision+1,evaluations:[...plan.data.evaluations,evaluation]};
   const event=record('memory','Future-state observation recorded',{type:'FutureEvaluation',planId:plan.id,evaluationId:evaluation.id,content:plan.title+' / '+evaluation.horizon+': '+evaluation.actualOutcome+' Evidence: '+evaluation.evidence,previousRevision:plan.data.revision,nextRevision:next.revision,evaluation},project.id,'saved');
   await admittedWrite(combineGuards(sourceGuard(project,existing),recordGuard(plan)),guard=>[
    db().prepare('UPDATE records SET data=?,updated_at=? WHERE id=? AND '+guard.sql).bind(JSON.stringify(next),new Date().toISOString(),plan.id,...guard.args),guardedInsert(event,guard)
   ]);out={id:plan.id};
  }else throw new InputError("Unknown action");
  if(ops.length)await db().batch(ops);return Response.json({...out,records:await list()},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(e instanceof InputError||e instanceof SyntaxError||e instanceof WorkspaceConflict)return Response.json({error:e.message},{status:400});console.error("workspace write failed",e);return Response.json({error:"Could not save the change. Your input has been preserved; please retry."},{status:503});}
}
