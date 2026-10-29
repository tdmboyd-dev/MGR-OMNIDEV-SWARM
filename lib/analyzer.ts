import {scanSnapshotSecurity} from './snapshot-security';
export type SourceFile={path:string;content:string};
function hasTestPath(path:string){
 const parts=path.split('/');
 if(parts.some(part=>/^(?:__tests__|tests?|specs?)$/i.test(part)))return true;
 const name=parts[parts.length-1]||'';
 return /^(?:test[_-].+|.+[._-](?:test|spec))\.[^/.]+$/i.test(name)
   ||/(?:Test|Tests)\.(?:java|kt|cs)$/.test(name);
}
/** Literal markup heuristic: quoted values and JSX expressions are not attributes.
 * This does not resolve spreads, execute components or judge alternative-text quality. */
function imageAttributes(content:string){
 const markup=content.replace(/<!--[\s\S]*?-->/g,''),start=/<img\b/gi,attributes:string[]=[];
 let match:RegExpExecArray|null;
 while((match=start.exec(markup))){
  let quote='',depth=0,names='',closed=false;
  for(let i=start.lastIndex;i<markup.length;i++){
   const c=markup[i];
   if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
   if(c==='"'||c==="'"||(depth>0&&c==='`')){quote=c;if(!depth)names+=' ';continue;}
   if(c==='{'){depth++;continue;}
   if(depth){if(c==='}')depth--;continue;}
   if(c==='>'){closed=true;start.lastIndex=i+1;break;}
   if(c==='<'){start.lastIndex=i;break;}
   names+=c;
  }
  if(closed)attributes.push(names);
 }
 return attributes;
}
export function analyze(files:SourceFile[]) {
 const findings:any[]=[];const nodes:any[]=[];const edges:any[]=[];const securityCoverage:any[]=[];
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
  const security=scanSnapshotSecurity(f);securityCoverage.push(security.coverage);
  for(const signal of security.signals){
   const evidence=`Line ${signal.line}: ${signal.evidence}`;
   if(signal.kind==='sql')add("Possible SQL injection path","critical","Security",f.path,evidence,"Confirm the query and input flow. Use bound parameters; validate and authorize inputs before database access.");
   if(signal.kind==='eval')add("Dynamic code execution","high","Security",f.path,evidence,"Review the actual binding and inputs. Replace unsafe eval with a validated parser or a fixed dispatch table.");
   if(signal.kind==='credential')add("Potential hardcoded credential","critical","Security",f.path,evidence,"Confirm whether this is an active credential. If active, revoke it, remove it from history, and use a secret manager.");
  }
  const missingAlt=imageAttributes(f.content).filter(attributes=>!/(?:^|\s)alt(?=\s|=|\/|$)/i.test(attributes));
  if(missingAlt.length)add("Image has no alternative text","medium","Accessibility",f.path,`${missingAlt.length} image element(s) have no explicit alt attribute in scanned markup. Dynamic attributes require review.`,"Inspect the rendered image; add meaningful alternative text or an empty alt attribute for a decorative image. Verify dynamic attributes in the actual UI.");
  if(/(?:TODO|FIXME)/.test(f.content))add("Unfinished implementation marker","low","Code Quality",f.path,"TODO or FIXME marker found.","Resolve the marker, specify acceptance criteria, and verify the implementation.");
 }
 if(!paths.some(hasTestPath))add("No tests in imported snapshot","high","Testing","Project snapshot","No recognized test filenames or test directories were found in this snapshot; file names alone do not establish executable coverage.","Add unit tests for core behavior and integration tests for critical user journeys. Confirm the full repository before treating this as a project-wide gap.");
 if(!paths.some(p=>/readme|docs\//i.test(p)))add("Documentation missing from snapshot","medium","Documentation","Project snapshot","No README or docs directory found.","Document setup, architecture, recovery, and operational ownership.");
 if(!paths.some(p=>/github\/workflows|gitlab-ci|jenkins|azure-pipelines/i.test(p)))add("No delivery pipeline in snapshot","medium","DevOps","Project snapshot","No recognized CI configuration found.","Introduce a pipeline for checks, tests, artifacts, and reviewed releases.");
 if(!/logger|logging|telemetry|opentelemetry|sentry/i.test(all))add("No observability signals in snapshot","medium","Observability","Project snapshot","No recognized logging or telemetry integration found.","Instrument error rates, latency, trace IDs, and service health.");
 const score=(cat:string)=>Math.max(0,100-findings.filter(f=>f.category===cat).reduce((a,f)=>a+({critical:35,high:20,medium:12,low:5}[f.severity as string]||0),0));
 return {findings,nodes,edges,securityAnalysis:{contract:'mgr.snapshot-security.v1',complete:false,files:securityCoverage},scores:{Security:score("Security"),Testing:score("Testing"),Accessibility:score("Accessibility"),Documentation:score("Documentation"),DevOps:score("DevOps"),Observability:score("Observability"),"Code Quality":score("Code Quality")},scope:"Rule-based snapshot analysis. Scores reflect only these checks; no vulnerability database, runtime execution, legal certification, or full project audit. Security coverage is partial and recorded per file."};
}
export function simulate(input:{traffic:number;capacity:number;latency:number;cost:number;replicas:number}){
 const {traffic,capacity,latency,cost,replicas}=input;
 const utilization=traffic/(capacity*replicas);
 const predictedLatency=latency/(1-Math.min(utilization,0.99));
 return {utilization:Math.round(utilization*100),latency:Math.round(predictedLatency),cost:Math.round(cost*replicas*100)/100,status:utilization>=1?"Over capacity":utilization>.8?"At risk":"Within capacity",assumption:"Illustrative queueing model: homogeneous replicas, fixed per-replica capacity and cost, no cache or database bottlenecks. Not a measured production prediction."};
}
