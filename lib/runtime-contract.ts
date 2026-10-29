import {analyze,type SourceFile} from "./analyzer";
export type Patch={path:string;before:string|null;after:string};
export type Candidate={summary:string;patches:Patch[];experts:{domain:string;task:string;parent:string|null}[];tests:any[];scope:string};
export function safePath(path:unknown):path is string{return typeof path==="string"&&path.length>0&&path.length<250&&!path.includes("\\")&&!path.startsWith("/")&&!path.split("/").some(x=>x===".."||x==="."||!x)&&!/(^|\/)(\.git|\.env[^/]*|id_rsa|id_ed25519)(\/|$)/.test(path)}
export function candidate(input:any,files:SourceFile[]):Candidate{
 if(!input||typeof input.summary!=="string")throw new Error("Agent response has an invalid candidate contract: the explanation must be text");
 if(input.summary.length>4000)throw new Error("Agent response has an invalid candidate contract: the explanation exceeds 4000 characters");
 if(!Array.isArray(input.patches))throw new Error("Agent response has an invalid candidate contract: the proposed file changes list is missing");
 if(input.patches.length>12)throw new Error("Agent response has an invalid candidate contract: more than 12 file changes require separate proposals");
 const paths=new Set();let size=0;
 for(const patch of input.patches){if(!safePath(patch.path)||paths.has(patch.path)||typeof patch.after!=="string"||patch.after.length>100000)throw new Error("Invalid, duplicate, or unsafe patch path");paths.add(patch.path);const original=files.find(f=>f.path===patch.path)?.content??null;if(patch.before!==original)throw new Error("Patch baseline does not match the snapshot");if(/(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})/.test(patch.after)||/(?:password|api[_-]?key|secret)\s*[:=]\s*["'][^"']{8,}["']/i.test(patch.after))throw new Error("Candidate contains a potential credential");size+=patch.after.length;}
 if(size>500000)throw new Error("Candidate exceeds patch budget");
 const experts=Array.isArray(input.experts)?input.experts.slice(0,8).filter((e:any)=>typeof e.domain==="string"&&e.domain.length<=100&&typeof e.task==="string"&&e.task.length<=1000).map((e:any)=>({domain:e.domain,task:e.task,parent:typeof e.parent==="string"?e.parent.slice(0,100):null})):[];
 return {summary:input.summary,patches:input.patches,experts,tests:[],scope:"Candidate only. No repository or production system changed."};
}
export function applyPatches(files:SourceFile[],patches:Patch[]){const next=files.map(f=>({...f}));for(const patch of patches){const old=next.find(f=>f.path===patch.path);if((old?.content??null)!==patch.before)throw new Error("Snapshot changed; regenerate the candidate before applying it");if(old)old.content=patch.after;else next.push({path:patch.path,content:patch.after});}return next;}
export function staticTests(original:SourceFile[],c:Candidate){
 const changed=applyPatches(original,c.patches),changedPaths=new Set(c.patches.map(p=>p.path));const tests:any[]=[];
 for(const f of changed.filter(f=>changedPaths.has(f.path))){
  if(f.path.endsWith('.json')){try{JSON.parse(f.content);tests.push({name:`JSON validity: ${f.path}`,status:"passed"})}catch{tests.push({name:`JSON validity: ${f.path}`,status:"failed"})}}
 }
 const a=analyze(changed),b=analyze(original);
 const unavailable=a.securityAnalysis.files.filter(f=>f.status!=='inspected-heuristic');
 const changedUnavailable=unavailable.filter(f=>changedPaths.has(f.path));
 tests.push({name:"Bounded security-rule inspection for changed files",status:changedUnavailable.length?"failed":"passed",detail:changedUnavailable.length?`Could not inspect: ${changedUnavailable.map(f=>f.path).join(', ')}`:"Changed files completed the available heuristic checks; this is not full security verification."});
 const high=a.findings.filter(f=>["critical","high"].includes(f.severity)).length,before=b.findings.filter(f=>["critical","high"].includes(f.severity)).length;
 const incomplete=unavailable.length>0||b.securityAnalysis.files.some(f=>f.status!=='inspected-heuristic');
 tests.push({name:"No increase in high / critical heuristic findings",status:high>before?"failed":incomplete?"not run":"passed",detail:`${before} before, ${high} after`+(incomplete?"; at least one file was not inspected, so this is not a complete comparison.":"")});
 tests.push({name:"Patch baseline matches stored snapshot",status:"passed"});
 tests.push({name:"Runtime / integration tests",status:"not run",detail:"Requires an isolated execution worker. Static checks are not runtime verification."});
 return {tests,before:b.findings.length,after:a.findings.length,passed:tests.every(t=>t.status!=="failed"),analysis:a};
}
export function nativeCandidate(files:SourceFile[],name:string,objective:string):Candidate{
 const patches:Patch[]=[];if(!files.some(f=>/(^|\/)readme\.md$/i.test(f.path)))patches.push({path:"README.md",before:null,after:`# ${name.replace(/[\r\n]/g,' ')}\n\n## Imported source map\n\n${files.map(f=>'- '+f.path).join('\n')}\n\n## Development objective\n\n${objective}\n\n## Verification and operations\n\nThis document was generated from a snapshot. Validate setup commands against package manifests before running them. Record environment requirements, architectural owners, rollback steps, and critical user-flow tests before release.\n`});
 if(!files.some(f=>f.path==="tests/omni-snapshot.test.mjs"))patches.push({path:"tests/omni-snapshot.test.mjs",before:null,after:`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport {readFileSync,existsSync} from 'node:fs';\nconst paths=${JSON.stringify(files.map(f=>f.path))};\ntest('Imported source files exist',()=>{for(const path of paths)assert.ok(existsSync(path),path);});\n${files.some(f=>f.path==='package.json')?"test('Package manifest parses and names the project',()=>{const p=JSON.parse(readFileSync('package.json','utf8'));assert.equal(typeof p.name,'string');});\n":""}`});
 return {summary:patches.length?"Generate missing project documentation and executable snapshot-integrity tests.":"No supported deterministic repair is needed. Use an AI provider for source-level changes.",patches,experts:[{domain:"Documentation",task:"Document observed source structure",parent:null},{domain:"Testing",task:"Add snapshot integrity tests",parent:null}],tests:[],scope:"Deterministic maintenance agent; not an LLM. Tests verify snapshot integrity, not application behavior."};
}
