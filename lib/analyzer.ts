export type SourceFile={path:string;content:string};
export function analyze(files:SourceFile[]) {
 const findings:any[]=[];const nodes:any[]=[];const edges:any[]=[];
 const add=(title:string,severity:string,category:string,file:string,evidence:string,remediation:string)=>findings.push({title,severity,category,file,evidence,remediation,status:"open",confidence:"heuristic"});
 const all=files.map(f=>f.content).join("\n"); const paths=files.map(f=>f.path);
 for(const f of files){
  nodes.push({id:f.path,label:f.path.split("/").pop(),type:"file",path:f.path});
  for(const m of f.content.matchAll(/(?:function|class)\s+(\w+)/g)){const id=f.path+"#"+m[1]+"@"+m.index;nodes.push({id,label:m[1],type:m[0].startsWith("class")?"class":"function",path:f.path});edges.push({source:f.path,target:id,relation:"defines"});}
  for(const m of f.content.matchAll(/(?:from\s*|require\s*\()(["'])([^"']+)\1/g)){
   const target=m[2];let id="dependency:"+target;
   if(target.startsWith(".")){const parts=(f.path.split("/").slice(0,-1).join("/")+"/"+target).split("/");const normalized:string[]=[];for(const part of parts){if(part==="..")normalized.pop();else if(part&&part!==".")normalized.push(part);}const base=normalized.join("/");const resolved=[base,base+".ts",base+".tsx",base+".js",base+".jsx",base+"/index.ts",base+"/index.tsx",base+"/index.js"].find(p=>paths.includes(p));id=resolved||"module:"+f.path+":"+target;if(!resolved&&!nodes.some(n=>n.id===id))nodes.push({id,label:target,type:"module",path:f.path});}
   else if(!nodes.some(n=>n.id===id))nodes.push({id,label:target,type:"dependency"});edges.push({source:f.path,target:id,relation:"imports"});
  }
  if(f.path.endsWith("package.json")){try{const pkg=JSON.parse(f.content);for(const [name,version] of Object.entries(pkg.dependencies||{})){const id="dependency:"+name;if(!nodes.some(n=>n.id===id))nodes.push({id,label:name,type:"dependency",version});edges.push({source:f.path,target:id,relation:"depends on"});}}catch{add("Invalid package manifest","medium","Code Quality",f.path,"package.json could not be parsed","Repair JSON syntax and run the package manager validation.");}}
  if(/(?:query|execute)\s*\([^\n;]*\+/.test(f.content))add("Possible SQL injection path","critical","Security",f.path,"SQL query is assembled with concatenation.","Use bound query parameters; validate and authorize inputs before database access.");
  if(/\beval\s*\(/.test(f.content))add("Dynamic code execution","high","Security",f.path,"eval() call found.","Replace eval with a validated parser or a fixed dispatch table.");
  if(/(?:api[_-]?key|password|secret)\s*[:=]\s*["'][^"']{8,}["']/i.test(f.content))add("Potential hardcoded credential","critical","Security",f.path,"Credential-like assignment found; value redacted.","Revoke the credential, remove it from history, and use a secret manager.");
  if(/<img\b[^>]*>/i.test(f.content)&&!/<img\b[^>]*\balt=/i.test(f.content))add("Image has no alternative text","medium","Accessibility",f.path,"An image element has no alt attribute.","Add meaningful alternative text or an empty alt attribute for a decorative image.");
  if(/(?:TODO|FIXME)/.test(f.content))add("Unfinished implementation marker","low","Code Quality",f.path,"TODO or FIXME marker found.","Resolve the marker, specify acceptance criteria, and verify the implementation.");
 }
 if(!paths.some(p=>/(?:test|spec)[./]|__tests__/i.test(p)))add("No tests in imported snapshot","high","Testing","Project snapshot","No test filenames were found in this snapshot.","Add unit tests for core behavior and integration tests for critical user journeys. Confirm the full repository before treating this as a project-wide gap.");
 if(!paths.some(p=>/readme|docs\//i.test(p)))add("Documentation missing from snapshot","medium","Documentation","Project snapshot","No README or docs directory found.","Document setup, architecture, recovery, and operational ownership.");
 if(!paths.some(p=>/github\/workflows|gitlab-ci|jenkins|azure-pipelines/i.test(p)))add("No delivery pipeline in snapshot","medium","DevOps","Project snapshot","No recognized CI configuration found.","Introduce a pipeline for checks, tests, artifacts, and reviewed releases.");
 if(!/logger|logging|telemetry|opentelemetry|sentry/i.test(all))add("No observability signals in snapshot","medium","Observability","Project snapshot","No recognized logging or telemetry integration found.","Instrument error rates, latency, trace IDs, and service health.");
 const score=(cat:string)=>Math.max(0,100-findings.filter(f=>f.category===cat).reduce((a,f)=>a+({critical:35,high:20,medium:12,low:5}[f.severity as string]||0),0));
 return {findings,nodes,edges,scores:{Security:score("Security"),Testing:score("Testing"),Accessibility:score("Accessibility"),Documentation:score("Documentation"),DevOps:score("DevOps"),Observability:score("Observability"),"Code Quality":score("Code Quality")},scope:"Rule-based snapshot analysis. Scores reflect only these checks; no vulnerability database, runtime execution, legal certification, or full project audit."};
}
export function simulate(input:{traffic:number;capacity:number;latency:number;cost:number;replicas:number}){
 const {traffic,capacity,latency,cost,replicas}=input;
 const utilization=traffic/(capacity*replicas);
 const predictedLatency=latency/(1-Math.min(utilization,0.99));
 return {utilization:Math.round(utilization*100),latency:Math.round(predictedLatency),cost:Math.round(cost*replicas*100)/100,status:utilization>=1?"Over capacity":utilization>.8?"At risk":"Within capacity",assumption:"Illustrative queueing model: homogeneous replicas, fixed per-replica capacity and cost, no cache or database bottlenecks. Not a measured production prediction."};
}
