import {boundedRequestText} from '@/lib/request-body';
import {auditStep} from '@/lib/repo-audit';
import {db} from '@/db/store';
import {env} from "cloudflare:workers";
import {pipelineStep,accountReviewRequest,runAssignedReview,blockReviews,workerStatus,workerJob,report,jobs,tick,recover} from "@/lib/jobs";
async function authorized(request:Request):Promise<'docker-isolated'|'windows-appcontainer'|null>{
 if(env.OMNI_WORKER_TOKEN&&env.OMNI_WINDOWS_WORKER_TOKEN&&env.OMNI_WORKER_TOKEN===env.OMNI_WINDOWS_WORKER_TOKEN)return null;
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return null;const enc=new TextEncoder(),a=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(token)));
 for(const [kind,expected] of [['docker-isolated',env.OMNI_WORKER_TOKEN],['windows-appcontainer',env.OMNI_WINDOWS_WORKER_TOKEN]] as const){if(!expected)continue;const b=new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(expected)));let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];if(mismatch===0)return kind;}
 return null;
}
export async function GET(request:Request){
 if(env.OMNI_WORKER_TOKEN&&env.OMNI_WINDOWS_WORKER_TOKEN&&env.OMNI_WORKER_TOKEN===env.OMNI_WINDOWS_WORKER_TOKEN)return Response.json({error:'Worker credentials must be distinct'},{status:503});
 const principal=await authorized(request);if(!principal)return Response.json({error:'Worker authorization required'},{status:401});
 try{
  const url=new URL(request.url),id=url.searchParams.get('id'),kind=url.searchParams.get('kind')||principal;
  if(!['docker-isolated','windows-appcontainer'].includes(kind))throw Error('Unknown worker executor');if(kind!==principal)return Response.json({error:'Worker executor scope denied'},{status:403});
  // The explicitly enrolled native snapshot worker never dispatches model/review/audit work.
  if(kind==='windows-appcontainer'){
   if(id)return Response.json(url.searchParams.get('status')==='1'?await workerStatus(id,kind):await workerJob(id,kind),{headers:{'Cache-Control':'no-store'}});
   const queued=(await jobs()).filter(j=>j.payload.workerKind===kind&&j.status==='awaiting review'&&j.result.checks?.passed&&!j.result.externalTests&&!j.result.nativeExecutionUnknown&&(!j.result.verificationOwner||j.result.verificationOwner.state==='settled')&&!(j.result.workerAssignment?.expiresAt>Date.now()));
   return Response.json({reviews:[],audits:[],runnable:[],jobs:queued.map(j=>({id:j.id}))},{headers:{'Cache-Control':'no-store'}});
  }
  const reviewable:any[]=[];
  if(!id){
   for(const root of await jobs())if((root.payload.workerKind||'docker-isolated')===kind&&root.payload.automaticRepair)await pipelineStep(root.id);
   for(const j of await jobs()){
    if((j.payload.workerKind||'docker-isolated')!==kind)continue;const plan=j.result.reviewPlan;
    if(j.status!=='awaiting review'||!plan||plan.control&&(plan.control.status!=='playing'||plan.control.deadline&&Date.now()>=plan.control.deadline)||j.result.reviewError||j.result.reviews.length>=plan.budget)continue;
    const task=plan.tasks.find((t:any)=>!j.result.reviews.some((r:any)=>r.index===t.index)&&!j.result.reviewClaims?.[t.index]);
    if(task){try{const req=await accountReviewRequest(j.id,task.index);if(req.brain.kind==='api')reviewable.push({id:j.id,index:task.index});}catch{}}
   }
  }
  const allJobs=await jobs();
  return Response.json(id?await workerJob(id):{reviews:reviewable,audits:(await db().prepare("SELECT id FROM records WHERE kind='repo_audit' AND status='active' ORDER BY created_at LIMIT 1").all()).results,jobs:allJobs.filter(j=>(j.payload.workerKind||'docker-isolated')===kind&&j.status==='awaiting review'&&j.result.checks?.passed&&!j.result.externalTests&&!j.result.nativeExecutionUnknown&&(!j.result.verificationOwner||j.result.verificationOwner.state==='settled')&&!(j.result.workerAssignment?.expiresAt>Date.now())).map(j=>({id:j.id})),runnable:allJobs.filter(j=>(j.payload.workerKind||'docker-isolated')===kind&&j.status==='queued'&&j.mode!=='account'&&(!j.payload.pipelineParentId||(allJobs.find(root=>root.id===j.payload.pipelineParentId)?.result.reviewPlan?.control?.status==='playing'))).map(j=>({id:j.id}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e:any){return Response.json({error:e.message},{status:400})}
}
export async function POST(request:Request){if(env.OMNI_WORKER_TOKEN&&env.OMNI_WINDOWS_WORKER_TOKEN&&env.OMNI_WORKER_TOKEN===env.OMNI_WINDOWS_WORKER_TOKEN)return Response.json({error:'Worker credentials must be distinct'},{status:503});const principal=await authorized(request);if(!principal)return Response.json({error:'Worker authorization required'},{status:401});try{const raw=await boundedRequestText(request,25000);if(raw.length>25000)throw new Error('Report too large');const p=JSON.parse(raw);if(principal==='windows-appcontainer'&&p.action!==undefined)return Response.json({error:'Native worker only accepts execution reports'},{status:403});if(p.action===undefined&&p.worker!==principal)return Response.json({error:'Worker executor scope denied'},{status:principal==='windows-appcontainer'||p.worker==='windows-appcontainer'?403:400});if(p.action==='review'){try{return Response.json({job:await runAssignedReview(p.id,p.index)})}catch(e:any){await blockReviews(p.id,e.message);throw e}}if(p.action==='auditStep')return Response.json(await auditStep(p.id));if(p.action==='tick')return Response.json({job:await tick(p.id)});if(p.action==='recover')return Response.json({jobs:await recover()});return Response.json({job:await report(p.id,p)})}catch(e:any){return Response.json({error:e.message},{status:400})}}
