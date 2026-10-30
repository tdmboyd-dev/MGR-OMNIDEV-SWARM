import {TrilogyError,acceptTrilogyResult,authorizeTrilogy,revokeTrilogy,trilogyAccess,trilogyExecution,trilogyGrant,trilogyStatus} from '@/lib/trilogy-jobs';
import {previewTrilogyPublication,trilogyPublicationStatus,authorizeTrilogyPublication,revokeTrilogyPublication,publishTrilogyCandidate,reconcileTrilogyPublication} from '@/lib/trilogy-publication';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const failure=(error:unknown)=>Response.json({error:error instanceof TrilogyError?error.message:'Trilogy request rejected'},{status:error instanceof TrilogyError?error.status:400,headers});
async function readInput(request:Request){
 const reader=request.body?.getReader();if(!reader)throw new TrilogyError('Trilogy input required');
 const parts:Uint8Array[]=[];let size=0;
 try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>256000){await reader.cancel();throw new TrilogyError('Trilogy input exceeds limit',413);}parts.push(next.value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function GET(request:Request){try{
 const url=new URL(request.url),action=url.searchParams.get('action'),jobId=url.searchParams.get('jobId')||'';
 if([...url.searchParams.keys()].some(k=>!['action','jobId'].includes(k))||url.searchParams.getAll('jobId').length!==1||url.searchParams.getAll('action').length>1)throw new TrilogyError('Invalid trilogy query');
 if(action==='grant')return Response.json(await trilogyGrant(jobId,await trilogyAccess(request,'bridge')),{headers});
 if(action==='execution')return Response.json(await trilogyExecution(jobId,await trilogyAccess(request,'bridge')),{headers});
 if(action==='publication')return Response.json(await trilogyPublicationStatus(jobId,await trilogyAccess(request,'owner')),{headers});
 if(action)throw new TrilogyError('Unknown trilogy read');
 return Response.json(await trilogyStatus(jobId,await trilogyAccess(request,'reader')),{headers});
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)throw new TrilogyError('Cross-origin trilogy request refused',403);
 const p=await readInput(request);
 if(!p||typeof p!=='object'||Array.isArray(p))throw new TrilogyError('Invalid trilogy input');
 const keys=p.action==='authorize'?['action','jobId','plan']:['revoke','publicationPreview','reconcilePublication'].includes(p.action)?['action','jobId']:p.action==='result'?['action','jobId','result','receipt','outputBase64']:p.action==='authorizePublication'?['action','jobId','expectedPreview']:['publish','revokePublication'].includes(p.action)?['action','jobId','authorizationId']:[];
 if(!keys.length||Object.keys(p).some(k=>!keys.includes(k)))throw new TrilogyError('Unexpected trilogy action or authority fields');
 if(p.action==='authorize')return Response.json(await authorizeTrilogy(p.jobId,p.plan,await trilogyAccess(request,'owner')),{headers});
 if(p.action==='revoke')return Response.json(await revokeTrilogy(p.jobId,await trilogyAccess(request,'owner')),{headers});
 if(p.action==='publicationPreview')return Response.json(await previewTrilogyPublication(p.jobId,await trilogyAccess(request,'owner')),{headers});
 if(p.action==='authorizePublication')return Response.json(await authorizeTrilogyPublication(p.jobId,p.expectedPreview,await trilogyAccess(request,'owner')),{headers});
 if(p.action==='revokePublication')return Response.json(await revokeTrilogyPublication(p.jobId,p.authorizationId,await trilogyAccess(request,'owner')),{headers});
 if(p.action==='publish')return Response.json(await publishTrilogyCandidate(p.jobId,p.authorizationId,await trilogyAccess(request,'owner')),{headers});
 if(p.action==='reconcilePublication')return Response.json(await reconcileTrilogyPublication(p.jobId,await trilogyAccess(request,'owner')),{headers});
 return Response.json(await acceptTrilogyResult(p.jobId,p.result,p.receipt,p.outputBase64,await trilogyAccess(request,'bridge')),{headers});
}catch(error){return failure(error);}}
