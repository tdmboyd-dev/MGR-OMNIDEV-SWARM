import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdtemp,writeFile,readdir,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {basename,dirname,join,resolve} from 'node:path';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {randomBytes,createHash} from 'node:crypto';
import {nativeLauncherDigest,nativeRuntimeDigest} from '../worker/windows-appcontainer.mjs';
import {runOnce} from '../worker/windows-worker.mjs';

if(process.platform!=='win32'||!process.env.OMNI_NATIVE_QUALIFICATION_RECEIPT)throw Error('Actual Windows qualification receipt required');
const qualification=JSON.parse(await readFile(process.env.OMNI_NATIVE_QUALIFICATION_RECEIPT,'utf8'));
const {qualificationDigest,...unsigned}=qualification;
// The current qualifier includes three churn trials and their cleanup checks.
if(qualificationDigest!==createHash('sha256').update(JSON.stringify(unsigned)).digest('hex')||!Array.isArray(qualification.checks)||![23,29].includes(qualification.checks.length)||qualification.launcherSha256!==await nativeLauncherDigest()||qualification.runtimeSha256!==await nativeRuntimeDigest())throw Error('Qualification source/runtime mismatch');
const fixtureParent=await realpath(tmpdir());
const directory=await mkdtemp(join(fixtureParent,'omni-native-flow-')),sql=new DatabaseSync(join(directory,'lab.sqlite'));
for(const file of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(await readFile(file,'utf8'));
class Statement{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Statement(this.query,args);}async first(){return sql.prepare(this.query).get(...this.args)??null;}async all(){return {results:sql.prepare(this.query).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}}
const token=randomBytes(32).toString('hex');
globalThis.__omniEnv={OMNI_WINDOWS_WORKER_TOKEN:token,DB:{prepare:q=>new Statement(q),batch:async statements=>{sql.exec('BEGIN');try{const result=statements.map(s=>({meta:{changes:Number(sql.prepare(s.query).run(...s.args).changes)}}));sql.exec('COMMIT');return result;}catch(error){sql.exec('ROLLBACK');throw error;}}}};
const workspace=await import('../.test-runtime/route.mjs'),jobs=await import('../.test-runtime/jobs.mjs'),worker=await import('../.test-runtime/worker-route.mjs');
const files=[{path:'src/value.mjs',content:'export const value=1;\n'},{path:'tests/omni-snapshot.test.mjs',content:"import test from 'node:test';import assert from 'node:assert/strict';import {value} from '../src/value.mjs';test('approved fixture behavior',()=>assert.equal(value,2));\n"}];
let server;const checks=[];
try{
 const imported=await workspace.POST(new Request('https://owned.example/api/workspace',{method:'POST',headers:{Origin:'https://owned.example'},body:JSON.stringify({action:'import',title:'Owned native workflow fixture',files})}));assert.equal(imported.status,200);const {projectId}=await imported.json();
 const queued=await jobs.enqueue({projectId,objective:'Prove approved local snapshot behavior',mode:'account',workerKind:'windows-appcontainer',testProfile:'snapshot'});
 const request=await jobs.accountRequest(queued.id);
 await jobs.submitAccountCandidate(queued.id,{jobId:queued.id,sourceDigest:request.sourceDigest,candidate:{summary:'Owned fixture candidate',patches:[{path:'src/value.mjs',before:files[0].content,after:'export const value=2;\n'}],experts:[]}});
 const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
 const candidate=files.map(f=>f.path==='src/value.mjs'?{...f,content:'export const value=2;\n'}:f);
 const command=['node','--preserve-symlinks','--preserve-symlinks-main','--test','--test-isolation=none','tests/omni-snapshot.test.mjs'];
 const policy={version:1,enabled:true,hostId:qualification.hostId,launcherSha256:qualification.launcherSha256,runtimeSha256:qualification.runtimeSha256,qualificationDigest,scope:'approved-mgr-snapshot',allowedSourceDigests:[sha(files)],allowedCandidateDigests:[sha(candidate)],allowedTestManifestDigests:[sha(command)]};
 globalThis.__omniEnv.OMNI_WINDOWS_WORKER_POLICY_JSON=JSON.stringify(policy);
 const policyPath=join(directory,'policy.json');await writeFile(policyPath,JSON.stringify(policy),{mode:0o600});
 await assert.rejects(jobs.decide(queued.id,'apply'),/accepted passing/);checks.push('native apply refused before accepted worker proof');
 server=createServer(async(req,res)=>{
  try{if(!req.url?.startsWith('/api/worker')){res.writeHead(404);res.end();return;}
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const request=new Request('http://127.0.0.1'+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
   const response=await (req.method==='POST'?worker.POST(request):worker.GET(request));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500);res.end('{}');}
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const configPath=join(directory,'private.json'),config={siteUrl:`http://127.0.0.1:${server.address().port}`,nativeWorkerToken:token,nativePolicyPath:policyPath,nativeReceiptRoot:join(directory,'receipts'),nativeWorkerRoot:join(directory,'attempts'),tenantId:'fixture-tenant',actorId:'fixture-owner'};
 await writeFile(configPath,JSON.stringify(config),{mode:0o600});
 const result=await runOnce(configPath);assert.equal(result.claimed,1);assert.equal(result.passed,true);checks.push('actual localhost native queue executes approved oracle inside AppContainer');
 const saved=await jobs.workerStatus(queued.id,'windows-appcontainer');assert.equal(saved.result.nativeExecutionUnknown,false);assert.equal(saved.result.externalTests.nativeReceipt.cleanup.workspaceAbsent,true);assert.equal(saved.result.externalTests.nativeReceipt.native.tokenIsAppContainer,true);checks.push('actual authenticated report persists boundary and cleanup proof');
 const delivered=(await readdir(config.nativeReceiptRoot)).find(n=>n.startsWith('delivered-'));assert.ok(delivered);
 const {rename}=await import('node:fs/promises');await rename(join(config.nativeReceiptRoot,delivered),join(config.nativeReceiptRoot,delivered.replace('delivered-','pending-')));
 const recovered=await runOnce(configPath);assert.equal(recovered.claimed,0);assert.deepEqual(recovered.delivered,[queued.id]);checks.push('stored accepted receipt reconciles without executing again');
 await jobs.decide(queued.id,'apply');assert.equal((await jobs.workerStatus(queued.id,'windows-appcontainer')).status,'applied');checks.push('accepted passing receipt permits existing owner snapshot apply');
 await jobs.decide(queued.id,'rollback');assert.equal((await jobs.workerStatus(queued.id,'windows-appcontainer')).status,'rolled back');checks.push('existing rollback restores laboratory snapshot');
 const output={at:new Date().toISOString(),passed:checks.length,checks,qualificationDigest,scope:'Actual Windows AppContainer and existing job/SQLite/HTTP/report/owner paths on owned fixture source. No model, external repo, production signer, Docker or broad application-worker qualification.'};
 const target=resolve(process.env.OMNI_NATIVE_FLOW_RECEIPT||'../../native-current-workflow-20261101.json');await writeFile(target,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
}finally{
 if(server){server.closeAllConnections();await new Promise(done=>server.close(done));}
 sql.close();
 delete process.env.OMNI_NATIVE_WORKER_POLICY;
 delete process.env.OMNI_NATIVE_WORKER_ROOT;
 const actual=await realpath(directory);
 if(actual!==directory||dirname(actual)!==fixtureParent||!basename(actual).startsWith('omni-native-flow-'))throw Error('Native workflow fixture path changed; retained');
 await rm(actual,{recursive:true,force:true});
}
