import {specialists,specialistRole} from './specialists';
export function reviewPlan(files:{path:string;content:string}[],objective:string,suggestions:any[]=[],budget=12,scope:any={}){
 const signal=(objective+'\n'+files.map(f=>f.path+'\n'+f.content.slice(0,2000)).join('\n')).toLowerCase();
 const names=new Set(['Security','Architecture','Code Quality','Testing','Documentation']);
 const rules:[RegExp,string[]][]=[[/react|next|tsx|vue|svelte|frontend/,['Frontend','UX Design','Accessibility']], [/express|fastapi|backend|api\/|graphql/,['Backend','Integration Engineering']], [/docker|kubernetes|workflow|terraform|\.tf\b/,['DevOps','Infrastructure','Reliability']], [/sql|prisma|mongoose|database|redis/,['Databases']], [/package-lock|pnpm-lock|yarn.lock|requirements|cargo.lock/,['Dependency Intelligence']], [/llm|embedding|openai|anthropic|rag/,['LLM Engineering','AI Development']], [/unity|unreal|blender|\.blend|maya/,['3D Development','Game Development']], [/performance|slow|latency|bottleneck/,['Performance','Observability']], [/scale|capacity|million/,['Scalability']], [/payment|billing|revenue|stripe/,['Revenue Optimization','Compliance']], [/oauth|webhook|integrat|two repos/,['Integration Engineering']], [/mobile|android|ios|react.native/,['Mobile Development']]];
 for(const [pattern,areas] of rules)if(pattern.test(signal))areas.forEach(n=>names.add(n));
 const unknown:string[]=[];
 for(const suggestion of suggestions){const s=specialists.find(s=>s.name.toLowerCase()===String(suggestion.domain).toLowerCase());if(s)names.add(s.name);else if(suggestion.domain)unknown.push(String(suggestion.domain).slice(0,150));}
 const batches:any[][]=[];let batch:any[]=[],size=0;
 for(const f of files){for(let start=0;start<Math.max(1,f.content.length);start+=12000){const end=Math.min(start+12000,f.content.length);const unit={path:f.path,start,end};if(size+(end-start)>24000&&batch.length){batches.push(batch);batch=[];size=0;}batch.push(unit);size+=end-start;}}if(batch.length)batches.push(batch);
 const tasks:any[]=[];for(const name of names){const s=specialists.find(s=>s.name===name)!;for(let i=0;i<batches.length;i++)tasks.push({index:tasks.length,domain:s.name,role:s.id,parent:'Omni Core',task:`Inspect source batch ${i+1}/${batches.length}: ${s.checks.join('; ')}. Report concrete paths/evidence and proposed remediation. Prefix each genuinely missing capability finding with CAPABILITY GAP: and describe the required tool or specialist; do not claim runtime execution.`,files:batches[i]});}
 return {version:1,automatic:true,budget:Math.max(1,Math.min(48,Math.floor(budget)||12)),tasks,unknown,scope:{...scope,sourceFiles:files.length,sourceCharacters:files.reduce((n,f)=>n+f.content.length,0),sourcePaths:files.map(f=>f.path)},status:tasks.length?'pending':'blocked',completed:0,remaining:tasks.length};
}
export function combinedReport(result:any){const plan=result.reviewPlan;if(!plan)return null;const reviews=result.reviews||[];const completed=new Set(reviews.map((r:any)=>r.index));const pending=plan.tasks.filter((t:any)=>!completed.has(t.index));const rejected=reviews.filter((r:any)=>!r.approved);const control=plan.control;return {control,status:pending.length&&control?.status==='paused'?'paused':pending.length&&control?.status==='stopped'?'stopped':pending.length&&control?.deadline&&Date.now()>=control.deadline?'timer-ended':pending.length?reviews.length>=plan.budget?'budget-paused':'incomplete':rejected.length?'changes-required':'reviewed',completed:completed.size,total:plan.tasks.length,remaining:pending.length,budget:plan.budget,scope:plan.scope,findings:reviews.flatMap((r:any)=>r.findings.map((finding:string)=>({domain:r.domain,index:r.index,finding}))),pending:pending.map((t:any)=>({index:t.index,domain:t.domain,files:t.files.map((f:any)=>f.path)})),runtime:result.externalTests?result.externalTests.passed?'worker report passed':'worker report failed':'not run',verification:'Source review is model-generated evidence, not proof of runtime behavior or perfect files'};}

// Model requests are data. Omni Core grants only existing source-review capabilities.
export function expandSwarm(plan:any,parent:any,findings:string[]){
 const tasks=[...plan.tasks],spawnEvents=[...(plan.spawnEvents||[])];
 for(const finding of findings){const match=/^SPAWN:\s*([^|]+)\|\s*(.+)$/i.exec(finding);if(!match)continue;
 const specialist=specialists.find(s=>s.name.toLowerCase()===match[1].trim().toLowerCase());
 const depth=(parent.depth||0)+1,reason=match[2].trim().slice(0,500);
 const duplicate=specialist&&tasks.some(t=>t.role===specialist.id&&JSON.stringify(t.files)===JSON.stringify(parent.files));
 const blocked=!specialist?'unknown capability':duplicate?'already assigned':depth>4?'nesting safety limit':tasks.length>=10000?'task safety limit':null;
 spawnEvents.push({parentIndex:parent.index,domain:specialist?.name||match[1].trim(),reason,status:blocked?'not spawned':'spawned',detail:blocked,at:new Date().toISOString()});
 if(blocked)continue;
 tasks.push({index:tasks.length,domain:specialist!.name,role:specialist!.id,parent:parent.domain,parentIndex:parent.index,depth,reason,files:parent.files,task:`Investigate this evidence-backed specialist referral: ${reason}. Checks: ${specialist!.checks.join('; ')}. Cite paths and evidence. Request needed existing expertise with SPAWN: Exact specialist name | concrete reason. Never claim runtime execution or grant permissions.`});
 }
 return {...plan,tasks,spawnEvents,budget:plan.control?.mode==='all'||plan.control?.mode==='timer'?tasks.length:plan.budget};
}

export function fairReviewTasks(tasks:any[]){
 const groups=new Map<string,any[]>();for(const task of tasks){const key=task.domain||task.role||'general';if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(task);}
 const ordered:any[]=[];while([...groups.values()].some(q=>q.length)){for(const queue of groups.values())if(queue.length)ordered.push(queue.shift());}return ordered;
}
