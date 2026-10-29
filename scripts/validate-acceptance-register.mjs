import {readFile} from 'node:fs/promises';
const SHA=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
export function validateAcceptanceRegister(backlog,register){
 if(!Array.isArray(backlog?.tasks)||backlog.tasks.length!==174||!Array.isArray(register?.tasks)||register.tasks.length!==174)throw Error('174 parent invariant failed');
 const index=new Map(register.tasks.map(x=>[x.id,x]));
 if(index.size!==174)throw Error('duplicate or missing parent ID');
 let criteria=0,verifiedCriteria=0,ready=0;const errors=[];
 for(const task of backlog.tasks){
  const item=index.get(task.id);
  if(!item){errors.push(task.id+':missing');continue;}
  const expected=task.acceptance??[];
  if(item.acceptance?.length!==expected.length){errors.push(task.id+':criteria-count-drift');continue;}
  let all=true;
  for(let i=0;i<expected.length;i++){
   const c=item.acceptance[i];criteria++;
   if(c.requirement!==expected[i]||c.criterionId!==task.id+'/AC-'+String(i+1).padStart(2,'0')){errors.push(task.id+':criterion-text-drift');all=false;continue;}
   if(c.status==='VERIFIED'){
    const ok=SHA.test(c.sourceCommit??'')&&typeof c.testCommand==='string'&&c.testCommand.length>0&&Array.isArray(c.evidence)&&c.evidence.length>0&&typeof c.reviewedBy==='string'&&c.reviewedBy.length>0&&Number.isFinite(Date.parse(c.verifiedAt??''));
    if(!ok){errors.push(c.criterionId+':missing-proof');all=false;}else verifiedCriteria++;
   }else if(c.status!=='UNVERIFIED'&&c.status!=='BLOCKED'){errors.push(c.criterionId+':invalid-state');all=false;}
   else all=false;
  }
  if(item.overall==='CERTIFIED'&&!all)errors.push(task.id+':parent-false-green');
  if(all)ready++;
 }
 if(register.criteriaCount!==criteria)errors.push('criteria-count-invalid');
 return {valid:errors.length===0,totalParents:174,totalCriteria:criteria,verifiedCriteria,readyForCertification:ready,errors};
}
if(process.argv[1]?.endsWith('validate-acceptance-register.mjs')&&process.argv.length>=4){
 const backlog=JSON.parse(await readFile(process.argv[2],'utf8'));
 const register=JSON.parse(await readFile(process.argv[3],'utf8'));
 const result=validateAcceptanceRegister(backlog,register);console.log(JSON.stringify(result));if(!result.valid)process.exitCode=1;
}
