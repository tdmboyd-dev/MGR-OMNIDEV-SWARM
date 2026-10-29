import {readFile,writeFile,stat} from 'node:fs/promises';import {resolve,relative} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(x).digest('hex');
const safe=p=>typeof p==='string'&&p&&!p.startsWith('/')&&!p.includes('\\')&&!p.split('/').some(x=>!x||x==='.'||x==='..');
export async function reconcileExistingImplementation({root,backlog,limit=100}){
 if(!Array.isArray(backlog?.tasks)||backlog.tasks.length!==174||limit<50||limit>174)throw new TypeError('canonical backlog and batch size 50..174 required');
 const base=resolve(root);const sha=execFileSync('git',['-C',base,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const selected=backlog.tasks.filter(x=>Array.isArray(x.source_files)&&x.source_files.length).slice(0,limit);
 const rows=[];for(const task of selected){
  const paths=[];for(const p of task.source_files){
   if(!safe(p)){paths.push({path:p,exists:false,reason:'unsafe-reference'});continue;}
   const target=resolve(base,p);if(relative(base,target).startsWith('..')){paths.push({path:p,exists:false,reason:'escape'});continue;}
   try{const s=await stat(target);if(!s.isFile()){paths.push({path:p,exists:false,reason:'not-file'});continue;}const bytes=await readFile(target);paths.push({path:p,exists:true,size:bytes.length,sha256:digest(bytes)});}
   catch(e){paths.push({path:p,exists:false,reason:e.code??'unknown'});}
  }
  const linkedTests=(task.evidence??[]).filter(x=>/^tests\/.+\.mjs$/.test(x));
  rows.push({id:task.id,title:task.title,priority:task.priority,recordedStatus:task.status,implementation:'SOURCE_PRESENT_NOT_ACCEPTED',sourcePaths:paths,linkedTests,acceptanceCount:task.acceptance?.length??0,next:'Reproduce every acceptance criterion; source presence cannot close parent.'});
 }
 return {schema:'mgr.omnidev.source-implementation-reconciliation.v1',sourceCommit:sha,reviewed:rows.length,sourcePaths:rows.reduce((a,r)=>a+r.sourcePaths.length,0),presentPaths:rows.flatMap(x=>x.sourcePaths).filter(x=>x.exists).length,fullyAccepted:0,rows};
}
if(process.argv[1]?.endsWith('reconcile-implementation.mjs')&&process.argv.length>=5){
 const b=JSON.parse(await readFile(process.argv[3],'utf8')),r=await reconcileExistingImplementation({root:process.argv[2],backlog:b,limit:Number(process.argv[5]??100)});
 await writeFile(process.argv[4],JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({sourceCommit:r.sourceCommit,reviewed:r.reviewed,sourcePaths:r.sourcePaths,present:r.presentPaths}));
}
