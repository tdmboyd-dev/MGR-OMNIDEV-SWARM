import {db,list,record} from '@/db/store';
import {fingerprint} from './control-plane';
import {planningSource} from './workspace-planning';
import {admittedWrite,sourceGuard,recordGuard,combineGuards,guardedInsert} from './workspace-storage';
import type {RecordItem} from './catalog';
type Node={id:string;type:string;label:string;projectId:string;sourceId:string;updatedAt:string;properties:any};
type Edge={source:string;target:string;relation:string;sourceId:string};
export async function intelligenceGraph(projectId=''){
 const rows=await list();if(projectId&&!rows.some(r=>r.kind==='project'&&r.id===projectId))throw new Error('Project not found');
 const nodes:Node[]=[{id:'workspace',type:'workspace',label:'Private workspace',projectId:'',sourceId:'workspace',updatedAt:'',properties:{scope:'Owner-private snapshot graph'}}];const edges:Edge[]=[];
 const selected=rows.filter(r=>!projectId||r.id===projectId||r.projectId===projectId);const ids=new Set(selected.map(r=>r.id));
 // Historical integration snapshots are not an authority for current project identity.
 // Resolve participants only from the current workspace so deletions cannot resurrect nodes.
 const projects=new Map(rows.filter(r=>r.kind==='project').map(r=>[r.id,r]));
 for(const r of selected){nodes.push({id:r.id,type:r.kind,label:r.title,projectId:r.projectId,sourceId:r.id,updatedAt:r.updatedAt,properties:{status:r.status}});edges.push({source:ids.has(r.projectId)?r.projectId:'workspace',target:r.id,relation:r.projectId?'contains':'owns',sourceId:r.id});
 if(r.kind==='project'){for(const source of r.data.integration?.sources||[]){const current=projects.get(source.id);if(!current)continue;if(!nodes.some(n=>n.id===current.id))nodes.push({id:current.id,type:'project',label:current.title,projectId:current.id,sourceId:current.id,updatedAt:current.updatedAt,properties:{snapshotDigest:source.digest}});edges.push({source:current.id,target:r.id,relation:'integration-participant',sourceId:r.id});}const map=new Map<string,string>();for(const n of r.data.analysis?.nodes||[]){const id=r.id+':'+n.id;map.set(n.id,id);nodes.push({id,type:n.type,label:n.label,projectId:r.id,sourceId:r.id,updatedAt:r.updatedAt,properties:{path:n.path,extraction:'snapshot heuristic'}});edges.push({source:r.id,target:id,relation:'contains',sourceId:r.id});}for(const e of r.data.analysis?.edges||[]){if(map.has(e.source)&&map.has(e.target))edges.push({source:map.get(e.source)!,target:map.get(e.target)!,relation:e.relation,sourceId:r.id});}}
 }
 return {nodes:[...new Map(nodes.map(n=>[n.id,n])).values()],edges,scope:'Current persisted snapshots and workspace records; not live runtime discovery',generatedAt:new Date().toISOString()};
}
function citationSource(source:any,projectId:string){
 if(!source||typeof source!=='object'||!projectId||source.projectId!==projectId)return null;
 return {projectId:source.projectId,revision:Number.isSafeInteger(source.revision)?source.revision:null,
  observedAt:typeof source.observedAt==='string'?source.observedAt:null,
  sourceDigest:typeof source.sourceDigest==='string'?source.sourceDigest:null,
  snapshotDigest:typeof source.snapshotDigest==='string'?source.snapshotDigest:null};
}
function searchCitation(row:RecordItem,records:Map<string,RecordItem>){
 const data=row.data;let lineage:any=null,source=data.source,observed=data.observedSource;
 if(row.kind==='decision')lineage={kind:'decision',decisionId:row.id,revision:Number.isSafeInteger(data.revision)?data.revision:1};
 else if(row.kind==='memory'&&data.type==='DecisionHistory'){
  lineage={kind:'decision-outcome',decisionId:data.decisionId,revision:data.next?.revision??null,previousRevision:data.previous?.revision??null};
  source=data.next?.source;observed=data.next?.observedSource;
 }else if(row.kind==='roadmap')lineage={kind:'future-plan',planId:row.id,planVersion:data.version??null,revision:data.revision??null,previousPlanId:data.previousPlanId??null,contractDigest:data.contractDigest??null};
 else if(row.kind==='memory'&&data.type==='FutureEvaluation'){
  const plan=records.get(data.planId),context=plan?.kind==='roadmap'&&plan.projectId===row.projectId?plan:undefined;
  lineage={kind:'future-evaluation',planId:data.planId,evaluationId:data.evaluationId,horizon:data.evaluation?.horizon??null,
   revision:data.nextRevision??null,planVersion:context?.data.version??null,plannedSourceDigest:data.evaluation?.plannedSourceDigest??null};
  source=context?.data.source;observed=data.evaluation?.observedSource;
 }
 return {recordId:row.id,updatedAt:row.updatedAt,projectId:row.projectId,lineage,
  source:citationSource(source,row.projectId),observedSource:citationSource(observed,row.projectId),
  provenance:'Source is the recorded decision/plan context; observedSource is the workspace snapshot at observation recording, not independent proof of the observation.'};
}
export async function searchIntelligence(query:string,projectId=''){
 if(typeof query!=='string'||!query.trim()||query.length>500)throw new Error('Search requires 1-500 characters');const terms=query.toLowerCase().match(/[\p{L}\p{N}_-]+/gu)||[];if(!terms.length)throw new Error('Search requires words');
 const all=await list();if(projectId&&!all.some(r=>r.kind==='project'&&r.id===projectId))throw new Error('Project not found');
 const rows=all.filter(r=>!projectId||r.id===projectId||r.projectId===projectId),byId=new Map(rows.map(r=>[r.id,r]));const hits=[];
 for(const r of rows){
  // A historical hit cites the revision whose words were searched, never a newer correction.
  const decision=r.kind==='decision'?r.data:r.kind==='memory'&&r.data.type==='DecisionHistory'?r.data.next:null;
  const content=r.kind==='project'?r.data.files.map((f:any)=>f.path+'\n'+f.content).join('\n')
   :decision?['reason','alternatives','risks','expectedOutcome','actualOutcome','lessons'].map(k=>typeof decision[k]==='string'?decision[k]:'').filter(Boolean).join('\n')
   :(r.data.content||JSON.stringify(r.data));
  const text=r.title+'\n'+content,lower=text.toLowerCase(),matched=terms.filter(t=>lower.includes(t));if(!matched.length)continue;
  const at=lower.indexOf(matched[0]);hits.push({id:r.id,kind:r.kind,title:r.title,projectId:r.projectId,score:matched.length/terms.length,excerpt:text.slice(Math.max(0,at-80),at+500),
   citation:searchCitation(r,byId),limitations:r.kind==='project'?'Stored source snapshot':decision?'Owner-recorded decision or outcome; cited context does not independently verify the observation.':'Persisted record; validate claims against source'});
 }
 hits.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));return {query,hits:hits.slice(0,30),total:hits.length,method:'Deterministic lexical retrieval with record citations; not semantic or causal proof'};
}
export async function listDecisions(projectId=''){
 const rows=await list();
 if(projectId&&!rows.some(r=>r.kind==='project'&&r.id===projectId))throw new Error('Project not found');
 const decisions=rows.filter(r=>r.kind==='decision'&&(!projectId||r.projectId===projectId)).map(r=>({
  ...r,data:{...r.data,revision:Number.isSafeInteger(r.data.revision)?r.data.revision:1},
  history:rows.filter(h=>h.kind==='memory'&&h.data.type==='DecisionHistory'&&h.data.decisionId===r.id&&h.projectId===r.projectId)
   .sort((a,b)=>(a.data.next?.revision||0)-(b.data.next?.revision||0)||a.id.localeCompare(b.id))
 }));
 return {decisions,scope:projectId?'Selected project decisions and their retained observations':'Owner workspace decisions and their retained observations',
  qualification:'Recorded choices and owner observations; outcomes are not independently verified.'};
}
export async function saveDecision(p:any){
 if(typeof p.title!=='string'||!p.title.trim()||p.title.length>200)throw new Error('Decision title required');
 for(const k of ['reason','alternatives','risks','expectedOutcome'])if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>5000)throw new Error('Decision requires bounded '+k);
 if(p.projectId!==undefined&&typeof p.projectId!=='string')throw new Error('Select a valid project');
 const rows=await list(),projectId=p.projectId||'',project=projectId?rows.find(r=>r.kind==='project'&&r.id===projectId):undefined;
 if(projectId&&!project)throw new Error('Project not found');
 const source=project?await planningSource(project,rows):null;
 if(source&&p.expectedSourceDigest!==source.sourceDigest)throw new Error('Project or findings changed; reload before saving');
 const r=record('decision',p.title.trim(),{reason:p.reason.trim(),alternatives:p.alternatives.trim(),risks:p.risks.trim(),expectedOutcome:p.expectedOutcome.trim(),
  actualOutcome:null,lessons:null,decidedBy:'workspace-owner',decidedAt:new Date().toISOString(),revision:1,source},projectId,'recorded');
 await admittedWrite(project?sourceGuard(project,rows):combineGuards(),guard=>[guardedInsert(r,guard)]);return r;
}
export async function decisionOutcome(p:any){
 const rows=await list(),decision=rows.find(r=>r.id===p.id&&r.kind==='decision');if(!decision)throw new Error('Decision not found');
 for(const k of ['actualOutcome','lessons'])if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>5000)throw new Error('Outcome requires bounded '+k);
 const old=decision.data,revision=Number.isSafeInteger(old.revision)?old.revision:1;
 if(!Number.isSafeInteger(p.expectedRevision)||p.expectedRevision!==revision)throw new Error('Decision changed; reload the current revision before saving');
 const project=decision.projectId?rows.find(r=>r.id===decision.projectId&&r.kind==='project'):undefined;
 if(decision.projectId&&!project)throw new Error('Decision project no longer exists');
 const observedSource=project?await planningSource(project,rows):null;
 const next={...old,actualOutcome:p.actualOutcome.trim(),lessons:p.lessons.trim(),revision:revision+1,mutationId:crypto.randomUUID(),observedSource,
  observedAt:new Date().toISOString(),verification:'Owner-recorded observation; not independent verification or release approval.'};
 const event=record('memory','Decision outcome revision',{type:'DecisionHistory',decisionId:decision.id,previous:{...old,revision},next,
  content:decision.title+' / revision '+next.revision+': '+next.actualOutcome+' Lesson: '+next.lessons},decision.projectId,'saved');
 await admittedWrite(combineGuards(recordGuard(decision),...(project?[sourceGuard(project,rows)]:[])),guard=>[
  db().prepare("UPDATE records SET status='evaluated',data=?,updated_at=? WHERE id=? AND "+guard.sql).bind(JSON.stringify(next),next.observedAt,decision.id,...guard.args),
  guardedInsert(event,guard)
 ]);return next;
}
const BACKUP_MAX_BYTES=10_000_000;
const BACKUP_ROW_MAX_BYTES=1_800_000;
const BACKUP_CHUNK_BYTES=256_000;
const backupBytes=(value:string)=>new TextEncoder().encode(value).byteLength;
// In Unicode mode this range matches lone surrogate code points, while a
// well-formed pair (including emoji) is one code point outside the range.
const backupText=(value:unknown)=>typeof value==='string'&&!/[\uD800-\uDFFF]/u.test(value);

export async function exportBackup(){
 // One SELECT observes records and jobs together. Return separate JSON rows so
 // a large archive does not exceed D1's 2 MB limit for a single aggregate value.
 // The extra row in each collection detects overflow instead of hiding it.
 const result=await db().prepare(`
  SELECT 'record' AS entity,json_object('id',id,'kind',kind,'title',title,'project_id',project_id,'status',status,'data',data,'created_at',created_at,'updated_at',updated_at) AS value
  FROM (SELECT * FROM records ORDER BY id LIMIT 10001)
  UNION ALL
  SELECT 'job' AS entity,json_object('id',id,'project_id',project_id,'objective',objective,'mode',mode,'status',status,'phase',phase,'payload',payload,'result',result,'attempts',attempts,'created_at',created_at,'updated_at',updated_at) AS value
  FROM (SELECT * FROM jobs ORDER BY id LIMIT 10001)
 `).all();
 const snapshot:{records:any[];jobs:any[]}={records:[],jobs:[]};
 let totalBytes=0;
 for(const row of result.results as {entity:string;value:string}[]){
  totalBytes+=backupBytes(row.value);
  if(totalBytes>BACKUP_MAX_BYTES)throw new Error('Backup exceeds the 10 MB archive limit');
  const collection=row.entity==='record'?snapshot.records:snapshot.jobs;
  collection.push(JSON.parse(row.value));
  if(collection.length>10000)throw new Error('Backup exceeds the 10,000 records or 10,000 jobs limit');
 }
 const backup={format:'omnidev-owner-snapshot',version:1,exportedAt:new Date().toISOString(),scope:'Workspace records and jobs. Excludes credentials, sessions, provider settings and external resources.',snapshot,digest:await fingerprint(snapshot)};
 await validateBackup(backup);
 return backup;
}
export async function validateBackup(p:any){
 if(!p||p.format!=='omnidev-owner-snapshot'||p.version!==1||!p.snapshot||!Array.isArray(p.snapshot.records)||!Array.isArray(p.snapshot.jobs)||p.snapshot.records.length>10000||p.snapshot.jobs.length>10000||backupBytes(JSON.stringify(p))>BACKUP_MAX_BYTES)throw new Error('Invalid or oversized backup');
 if(p.digest!==await fingerprint(p.snapshot))throw new Error('Backup integrity mismatch');
 const object=(value:string,label:string)=>{const parsed=JSON.parse(value);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error('Invalid '+label+' object');return parsed;};
 const identity=(value:unknown)=>typeof value==='string'&&backupText(value)&&value.trim().length>0&&value.length<=200;
 const records=new Map<string,any>();
 for(const r of p.snapshot.records){
  if(!r||!identity(r.id)||records.has(r.id))throw new Error('Duplicate or invalid record identity');
  for(const k of ['kind','title','project_id','status','data','created_at','updated_at'])if(!backupText(r[k]))throw new Error('Invalid record '+k+' text');
  if(backupBytes(JSON.stringify(r))+2>BACKUP_ROW_MAX_BYTES)throw new Error('Backup record exceeds the safe database row limit');
  object(r.data,'record data');records.set(r.id,r);
 }
 for(const r of records.values()){
  if(r.kind==='project'&&r.project_id)throw new Error('Invalid project parent reference');
  if(!r.project_id)continue;
  const parent=records.get(r.project_id);
  const auditChild=['repo_tree','repo_file'].includes(r.kind)&&parent?.kind==='repo_audit';
  if(!parent||(parent.kind!=='project'&&!auditChild))throw new Error('Invalid record project reference');
 }
 const jobs=new Set<string>();
 for(const j of p.snapshot.jobs){
  if(!j||!identity(j.id)||jobs.has(j.id)||records.get(j.project_id)?.kind!=='project')throw new Error('Invalid job project reference');
  jobs.add(j.id);
  for(const k of ['objective','mode','status','phase','payload','result','created_at','updated_at'])if(!backupText(j[k]))throw new Error('Invalid job '+k+' text');
  if(backupBytes(JSON.stringify(j))+2>BACKUP_ROW_MAX_BYTES)throw new Error('Backup job exceeds the safe database row limit');
  const attempts=typeof j.attempts==='number'?String(j.attempts):j.attempts;
  if(typeof attempts!=='string'||!/^\d+$/.test(attempts)||!Number.isSafeInteger(Number(attempts)))throw new Error('Invalid job retry attempts');
  const payload=object(j.payload,'job payload');object(j.result,'job result');
  if(payload.sourceProjectId&&records.get(payload.sourceProjectId)?.kind!=='project')throw new Error('Invalid job source project reference');
 }
 return {valid:true,records:records.size,jobs:jobs.size,digest:p.digest,scope:'Integrity, shape and project-reference validation only. Restore is available only into an empty workspace; not production disaster-recovery qualification.'};
}
function backupChunks(rows:any[]):string[]{
 const chunks:string[]=[];let current:string[]=[],bytes=2;
 for(const row of rows){
  const encoded=JSON.stringify(row),size=backupBytes(encoded);
  if(size+2>BACKUP_ROW_MAX_BYTES)throw new Error('Backup row exceeds the safe database row limit');
  if(current.length&&(current.length>=250||bytes+size+1>BACKUP_CHUNK_BYTES)){
   chunks.push('['+current.join(',')+']');current=[];bytes=2;
  }
  bytes+=size+(current.length?1:0);current.push(encoded);
 }
 if(current.length)chunks.push('['+current.join(',')+']');
 return chunks;
}

export async function restoreBackup(input:any){
 // Freeze caller-owned values before the first await; validate and insert the
 // same bytes even if a direct caller later changes its object.
 const encoded=JSON.stringify(input);
 if(!encoded||backupBytes(encoded)>BACKUP_MAX_BYTES)throw new Error('Invalid or oversized backup');
 const p=JSON.parse(encoded);await validateBackup(p);
 const recordChunks=backupChunks(p.snapshot.records),jobChunks=backupChunks(p.snapshot.jobs);
 const token=crypto.randomUUID(),now=new Date().toISOString();
 const guard="EXISTS (SELECT 1 FROM runtime_settings WHERE id='restore-lock' AND data=?)";
 const ops=[db().prepare("INSERT OR IGNORE INTO runtime_settings(id,data,updated_at) SELECT 'restore-lock',?,? WHERE NOT EXISTS (SELECT 1 FROM records) AND NOT EXISTS (SELECT 1 FROM jobs)").bind(token,now)];
 for(const chunk of recordChunks)ops.push(db().prepare(`
  INSERT INTO records(id,kind,title,project_id,status,data,created_at,updated_at)
  SELECT json_extract(value,'$.id'),json_extract(value,'$.kind'),json_extract(value,'$.title'),json_extract(value,'$.project_id'),json_extract(value,'$.status'),json_extract(value,'$.data'),json_extract(value,'$.created_at'),json_extract(value,'$.updated_at')
  FROM json_each(?) WHERE ${guard}
 `).bind(chunk,token));
 for(const chunk of jobChunks)ops.push(db().prepare(`
  INSERT INTO jobs(id,project_id,objective,mode,status,phase,payload,result,attempts,created_at,updated_at)
  SELECT json_extract(value,'$.id'),json_extract(value,'$.project_id'),json_extract(value,'$.objective'),json_extract(value,'$.mode'),'canceled',json_extract(value,'$.phase'),json_extract(value,'$.payload'),json_extract(value,'$.result'),CAST(json_extract(value,'$.attempts') AS TEXT),json_extract(value,'$.created_at'),json_extract(value,'$.updated_at')
  FROM json_each(?) WHERE ${guard}
 `).bind(chunk,token));
 // A missing row must fail inside the transaction. A deliberately NULL data
 // value violates the existing NOT NULL constraint and rolls back every chunk.
 ops.push(db().prepare(`INSERT INTO runtime_settings(id,data,updated_at)
  SELECT ?,NULL,? WHERE ${guard} AND
  ((SELECT COUNT(*) FROM records)<>? OR (SELECT COUNT(*) FROM jobs)<>?)
 `).bind('restore-integrity:'+token,now,token,p.snapshot.records.length,p.snapshot.jobs.length));
 ops.push(db().prepare("DELETE FROM runtime_settings WHERE id='restore-lock' AND data=?").bind(token));
 const result=await db().batch(ops);
 if(!result[0].meta.changes)throw new Error('Restore refuses to overwrite a nonempty workspace');
 return {restored:true,records:p.snapshot.records.length,jobs:p.snapshot.jobs.length,resumed:false,scope:'Active imported jobs canceled; credentials and authority must be reconnected'};
}
