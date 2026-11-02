/** Explicit single-owner loopback SQLite adapter for actual production routes.
 * This is not Cloudflare D1, an owner gateway deployment or a fake provider. */
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,realpathSync,existsSync,lstatSync,mkdirSync,openSync,writeFileSync,closeSync,unlinkSync,readdirSync} from 'node:fs';
import {resolve,dirname,basename,sep,join,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,timingSafeEqual} from 'node:crypto';
import {Readable} from 'node:stream';
import {localTrilogyPolicy} from './local-trilogy-policy.mjs';
import {EngineeringVerifications,canonical} from './engineering-verifications.mjs';
import {prepareNodeRuntime} from './prepare-node-runtime.mjs';
import {loadNativePolicy} from '../worker/windows-appcontainer.mjs';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),labRoot=resolve(repo,'../../wave3');
const hash=value=>createHash('sha256').update(value).digest('hex');
const same=(left,right)=>typeof left==='string'&&typeof right==='string'&&timingSafeEqual(Buffer.from(hash(left),'hex'),Buffer.from(hash(right),'hex'));
let started=false;
function direct(path){
 if(typeof path!=='string'||!isAbsolute(path)||path.startsWith('\\\\')||/[\x00-\x1f]/.test(path))throw Error('Explicit local state path required');
 path=resolve(path);for(let p=path;;p=dirname(p)){if(existsSync(p)&&(lstatSync(p).isSymbolicLink()||realpathSync(p)!==p))throw Error('Local state path identity denied');if(dirname(p)===p)break;}return path;
}
function regular(path,limit){const s=lstatSync(path);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>limit||realpathSync(path)!==path)throw Error('Local service file identity denied');return path;}
export async function startLocalWorkerApi(configInput,{verifyPrivateState,verifyReviewedSource}={}){
 if(started)throw Error('Use a fresh process for each local adapter instance');started=true;
 const configPath=typeof configInput==='string'?direct(configInput):null;
 if(configPath)regular(configPath,16384);
 const config=configPath?JSON.parse(readFileSync(configPath,'utf8')):JSON.parse(JSON.stringify(configInput)),owner=config.deployment==='owner';
 if(![undefined,'laboratory','owner'].includes(config.deployment)||!Number.isSafeInteger(config.port??0)||(config.port??0)<0||(config.port??0)>65535||![config.tenantId,config.actorId].every(x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{1,128}$/.test(x)))throw Error('Explicit fixed identity and local port required');
 if(typeof config.ownerToken!=='string'||config.ownerToken.length<32||typeof config.nativeWorkerToken!=='string'||config.nativeWorkerToken.length<32||same(config.ownerToken,config.nativeWorkerToken)||typeof config.tenantId!=='string'||!config.tenantId||typeof config.actorId!=='string'||!config.actorId)throw Error('Explicit distinct private credentials and fixed identity required');
 const trilogy=localTrilogyPolicy(config);
 let dbPath,stateRoot,ownerLock,ownerLockPath;
 if(owner){
  if(typeof verifyPrivateState!=='function')throw Error('Trusted owner private-state verification required');
  stateRoot=direct(config.stateRoot);if(!existsSync(stateRoot)||!lstatSync(stateRoot).isDirectory())throw Error('Protected owner state root required');
  await verifyPrivateState('directory',stateRoot);if(configPath)await verifyPrivateState('file',configPath);
  dbPath=direct(config.databasePath??join(stateRoot,'omnidev.sqlite'));if(dbPath!==join(stateRoot,'omnidev.sqlite'))throw Error('Owner database must remain in its exact protected root');
 }else{
  dbPath=direct(config.databasePath||'');stateRoot=[labRoot,resolve(repo,'../../wave4')].find(root=>dbPath.startsWith(root+sep));
  if(!stateRoot||!/^omni-native-lab-[a-f0-9-]{36}\.sqlite$/.test(basename(dbPath))||realpathSync(dirname(dbPath)).toLowerCase()!==realpathSync(stateRoot).toLowerCase())throw Error('Database must be a direct named laboratory file in wave3 or wave4');
 }
 direct(stateRoot);direct(dbPath);for(const suffix of ['','-wal','-shm'])if(existsSync(dbPath+suffix))regular(dbPath+suffix,128*1024*1024);
 if(owner&&existsSync(dbPath))await verifyPrivateState('file',dbPath);
 direct(stateRoot);direct(dbPath);
 if(config.engineeringToken){
  if(typeof config.engineeringToken!=='string'||config.engineeringToken.length<32||same(config.engineeringToken,config.ownerToken)||same(config.engineeringToken,config.nativeWorkerToken))throw Error('Engineering credential must be distinct');
  for(const key of ['nativePolicyPath','nativeWorkerRoot','nativeReceiptRoot'])config[key]=direct(config[key]);
  if(owner&&(config.nativePolicyPath!==join(stateRoot,'native-policy.json')||config.nativeWorkerRoot!==join(stateRoot,'native-attempts')||config.nativeReceiptRoot!==join(stateRoot,'worker-receipts')))throw Error('Native owner paths must remain in their exact protected root');
  direct(config.nativePolicyPath);regular(config.nativePolicyPath,16384);direct(config.nativeWorkerRoot);direct(config.nativeReceiptRoot);
  if(owner){await verifyPrivateState('file',config.nativePolicyPath);for(const directory of [config.nativeWorkerRoot,config.nativeReceiptRoot]){if(!existsSync(directory))mkdirSync(directory,{recursive:true});await verifyPrivateState('directory',directory);direct(directory);}}
  process.env.OMNI_NATIVE_WORKER_POLICY=config.nativePolicyPath;process.env.OMNI_NATIVE_WORKER_ROOT=config.nativeWorkerRoot;
  const native=await loadNativePolicy();if(JSON.stringify(canonical(native))!==JSON.stringify(canonical(config.workerPolicy)))throw Error('Configured native policy differs from its actual file');
 }
 const existed=existsSync(dbPath);if(existed&&lstatSync(dbPath).isSymbolicLink())throw Error('Database symlink denied');
 if(existed){const inspect=new DatabaseSync(dbPath,{readOnly:true});try{const identity=inspect.prepare('SELECT tenant_id,actor_id FROM omni_local_lab_identity WHERE id=1').get();if(identity?.tenant_id!==config.tenantId||identity?.actor_id!==config.actorId)throw Error('Existing database is not this explicit laboratory identity');if(inspect.prepare("SELECT 1 FROM records WHERE kind='native_policy_change' AND (status NOT IN ('committed','aborted') OR COALESCE(json_extract(data,'$.state'),'unconfirmed')<>status) LIMIT 1").get())throw Error('Original native policy change requires reconciliation');}finally{inspect.close();}}
 let sql,server,engineering,closing;try{
 if(owner){
  ownerLockPath=join(stateRoot,'owner-service.lock');
  if(existsSync(ownerLockPath)){regular(ownerLockPath,2048);const previous=JSON.parse(readFileSync(ownerLockPath,'utf8'));if(previous.version!==1||previous.stateRoot!==stateRoot||previous.tenantId!==config.tenantId||previous.actorId!==config.actorId||!Number.isSafeInteger(previous.pid)||previous.pid<1)throw Error('Local owner lock requires reconciliation');let absent=false;try{process.kill(previous.pid,0);}catch(e){if(e.code==='ESRCH')absent=true;}if(!absent)throw Error('Original local owner service is still present or unconfirmed');unlinkSync(ownerLockPath);}
  ownerLock=openSync(ownerLockPath,'wx',0o600);writeFileSync(ownerLock,JSON.stringify({version:1,pid:process.pid,stateRoot,tenantId:config.tenantId,actorId:config.actorId}));
 }
 sql=new DatabaseSync(dbPath);sql.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 if(!existed){sql.exec('BEGIN');try{for(const file of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(join(repo,file),'utf8'));sql.exec('CREATE TABLE omni_local_lab_identity(id INTEGER PRIMARY KEY CHECK(id=1),tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL); CREATE TABLE omni_local_http_audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,principal TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,status INTEGER NOT NULL);');sql.prepare('INSERT INTO omni_local_lab_identity VALUES(1,?,?)').run(config.tenantId,config.actorId);sql.exec('COMMIT');}catch(error){sql.exec('ROLLBACK');sql.close();throw error;}}
 class Statement{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Statement(this.query,args);}async first(){return sql.prepare(this.query).get(...this.args)??null;}async all(){return {results:sql.prepare(this.query).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}}
 const db={prepare:query=>new Statement(query),batch:async statements=>{sql.exec('BEGIN');try{const results=statements.map(s=>({meta:{changes:Number(sql.prepare(s.query).run(...s.args).changes)}}));sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 globalThis.__omniNodeLocalEnv={DB:db,OMNI_WINDOWS_WORKER_TOKEN:config.nativeWorkerToken,...(trilogy?{OMNI_TRILOGY_SCOPE:JSON.stringify(trilogy.scope),OMNI_TRILOGY_OWNER_TOKEN:trilogy.ownerToken,OMNI_TRILOGY_BRIDGE_TOKEN:trilogy.bridgeToken,OMNI_TRILOGY_READ_TOKEN:trilogy.readToken,OMNI_TRILOGY_READ_JOB_ID:trilogy.readJobId}:{}),...(config.workerPolicy?{OMNI_WINDOWS_WORKER_POLICY_JSON:JSON.stringify(config.workerPolicy)}:{})};
 const runtimeParent=direct(join(stateRoot,'node-runtimes'));if(!existsSync(runtimeParent))mkdirSync(runtimeParent);if(owner)await verifyPrivateState('directory',runtimeParent);
 const prepared=prepareNodeRuntime({root:repo,outputDir:runtimeParent,environmentGlobal:'__omniNodeLocalEnv',versioned:true}),output=prepared.outputDir;
 const workspace=await import(pathToFileURL(join(output,'route.mjs'))),runtime=await import(pathToFileURL(join(output,'runtime-route.mjs'))),worker=await import(pathToFileURL(join(output,'worker-route.mjs')));
 if(config.engineeringToken&&(typeof config.engineeringToken!=='string'||config.engineeringToken.length<32||same(config.engineeringToken,config.ownerToken)||same(config.engineeringToken,config.nativeWorkerToken)))throw Error('Engineering credential must be distinct');
 const trilogyRoute=trilogy?await import(pathToFileURL(join(output,'trilogy-route.mjs'))):null;
 const jobs=await import(pathToFileURL(join(output,'jobs.mjs')));engineering=config.engineeringToken?new EngineeringVerifications(sql,config,jobs,{verifyReviewedSource}):null;
 const allowedRuntime=new Set(['enqueue','submitAccountCandidate','cancel','apply','rollback']);let origin;
 let ready=false;server=createServer({maxHeaderSize:16384},async(req,res)=>{
  let principal='denied',status=500;const send=(code,message)=>{status=code;res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));};
  try{
   if(!ready)return send(503,'Startup reconciliation is in progress');
   const security=new Set(['authorization','host','origin','x-tenant-id','x-actor-id']),counts=new Map();for(let i=0;i<req.rawHeaders.length;i+=2){const name=req.rawHeaders[i].toLowerCase();if(security.has(name)){counts.set(name,(counts.get(name)||0)+1);if(counts.get(name)>1)return send(400,'Duplicate security header denied');}}
   if(req.headers.host!==new URL(origin).host)return send(403,'Local host binding denied');
   if(req.headers.origin&&req.headers.origin!==origin)return send(403,'Cross-origin request denied');
   const url=new URL(req.url,origin),credential=req.headers.authorization?.replace(/^Bearer /,'');
   if(url.pathname.startsWith('/v1/engineering/')){if(!engineering||!same(credential,config.engineeringToken))return send(401,'Engineering credential required');if(req.headers['x-tenant-id']!==config.tenantId||req.headers['x-actor-id']!==config.actorId)return send(403,'Configured engineering identity denied');principal='engineering';}
   else if(url.pathname==='/api/trilogy'){if(!trilogy)return send(404,'Route unavailable');const role=['owner','bridge','read'].find(role=>same(credential,trilogy[role+'Token']));if(!role)return send(401,'Trilogy credential required');principal='trilogy-'+role;}
   else if(url.pathname==='/api/worker'){if(!same(credential,config.nativeWorkerToken))return send(401,'Native worker credential required');principal='native-worker';}
   else{if(!same(credential,config.ownerToken))return send(401,'Owner credential required');if(req.headers['x-tenant-id']!==config.tenantId||req.headers['x-actor-id']!==config.actorId)return send(403,'Configured owner identity denied');principal='owner';}
   if(!['GET','POST'].includes(req.method))return send(405,'Method denied');
   let request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
   if(principal==='engineering'){
    const {boundedRequestText}=await import(pathToFileURL(join(output,'request-body.mjs')));let body;if(req.method==='POST')body=JSON.parse(await boundedRequestText(request,url.pathname==='/v1/engineering/reviewed-source-bind'?2210000:8192));
    const binding=url.pathname.match(/^\/v1\/engineering\/workspaces\/([a-f0-9-]{36})\/jobs\/([a-f0-9-]{36}|request-[a-f0-9]{64})\/binding$/),item=url.pathname.match(/^\/v1\/engineering\/verifications\/([^/]+)(?:\/(cancel|report))?$/);let value;
    const itemId=item?decodeURIComponent(item[1]):null;if(itemId!==null&&!/^[A-Za-z0-9_.:-]{1,128}$/.test(itemId))throw Error('Invalid exact request identity');
    const readIdentity=()=>{if(!body||Array.isArray(body)||Object.keys(body).join(',')!=='requestId'||typeof body.requestId!=='string'||!/^[A-Za-z0-9_.:-]{1,128}$/.test(body.requestId))throw Error('Invalid exact request identity');return body.requestId;};
    if(url.pathname==='/v1/engineering/reviewed-source-bind'&&req.method==='POST')value=await engineering.bindReviewedSource(body);
    else if(url.pathname==='/v1/engineering/reviewed-source'&&req.method==='POST')value=await engineering.reviewedSource(body);
    else if(binding&&req.method==='GET')value=await engineering.binding(binding[1],binding[2]);
    else if(url.pathname==='/v1/engineering/verifications'&&req.method==='POST')value=await engineering.admit(body);
    else if(url.pathname==='/v1/engineering/verification-status'&&req.method==='POST')value=await engineering.status(readIdentity());
    else if(url.pathname==='/v1/engineering/verification-report'&&req.method==='POST')value=await engineering.report(readIdentity());
    else if(url.pathname==='/v1/engineering/verification-cancel'&&req.method==='POST')value=await engineering.cancel(body);
    else if(item&&req.method==='GET'&&!item[2])value=await engineering.status(itemId);
    else if(item&&req.method==='GET'&&item[2]==='report')value=await engineering.report(itemId);
    else if(item&&req.method==='POST'&&item[2]==='cancel'&&body?.requestId===itemId)value=await engineering.cancel(body);
    else return send(404,'Engineering operation unavailable');
    status=200;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));return;
   }
   if(principal.startsWith('trilogy-')){
    if(req.method==='GET'&&!['','grant','execution'].includes(url.searchParams.get('action')??''))return send(403,'Local Trilogy publication is unavailable');
    if(req.method==='POST'){
     const {boundedRequestText}=await import(pathToFileURL(join(output,'request-body.mjs'))),raw=await boundedRequestText(request,256000),body=JSON.parse(raw);
     if(!['authorize','revoke','result'].includes(body?.action))return send(403,'Local Trilogy publication is unavailable');
     request=new Request(url,{method:'POST',headers:req.headers,body:raw});
    }
   }
   if(principal==='owner'&&req.method==='POST'){
    const {boundedRequestText}=await import(pathToFileURL(join(output,'request-body.mjs')));const raw=await boundedRequestText(request,url.pathname==='/api/workspace'?2199999:600000);const body=JSON.parse(raw);
    if(url.pathname==='/api/workspace'&&body?.action!=='import'&&!(trilogy&&body?.action==='github'&&[trilogy.scope.repositoryId,'https://github.com/'+trilogy.scope.repositoryId].includes(body.location)))return send(403,'Local workspace source operation is outside configured scope');
    if(url.pathname==='/api/runtime'){
     const boundedAccount=body?.mode==='account'&&body.automaticReview!==true&&body.automaticRepair!==true;
     const nativeAdmission=boundedAccount&&body.workerKind==='windows-appcontainer'&&body.testProfile==='snapshot';
     const trilogyAdmission=boundedAccount&&trilogy&&body.projectId===trilogy.scope.projectId&&body.workerKind==='docker-isolated'&&['snapshot','node-application'].includes(body.testProfile);
     if(!allowedRuntime.has(body?.action)||body?.action==='enqueue'&&!nativeAdmission&&!trilogyAdmission)return send(403,'Local runtime operation is outside configured scope');
    }
    request=new Request(url,{method:'POST',headers:req.headers,body:raw});
   }
   const route=url.pathname==='/api/workspace'?workspace:url.pathname==='/api/runtime'?runtime:url.pathname==='/api/worker'?worker:url.pathname==='/api/trilogy'?trilogyRoute:null;if(!route)return send(404,'Route unavailable');
   const response=await route[req.method](request);status=response.status;res.writeHead(status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){if(!res.headersSent)send([400,403,404,409,503].includes(error.statusCode)?error.statusCode:400,'Local adapter request rejected');else res.destroy();}
  finally{try{sql.prepare('INSERT INTO omni_local_http_audit(at,principal,method,path,status) VALUES(?,?,?,?,?)').run(new Date().toISOString(),principal,req.method,req.url?.split('?')[0]||'',status);}catch{}}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;server.keepAliveTimeout=1000;server.maxHeadersCount=64;
 await new Promise((resolveReady,reject)=>{server.once('error',reject);server.listen(config.port||0,'127.0.0.1',resolveReady);});origin='http://127.0.0.1:'+server.address().port;
 if(engineering)await engineering.recover();ready=true;
 function hostCustody(){
  if(!engineering)return false;
  for(const [root,pattern] of [[config.nativeWorkerRoot,/^(?:QUARANTINED\.json|omni-native-[a-f0-9-]{36}(?:\.|$))/],[config.nativeReceiptRoot,/^(?:poller\.lock|active-|pending-)/]]){
   if(!existsSync(root))continue;const entries=readdirSync(root);if(entries.length>1024||entries.some(name=>pattern.test(name)))return true;
  }return false;
 }
 return Object.freeze({origin,databasePath:dbPath,sourceFingerprint:prepared.sourceFingerprint,scope:owner?'Protected single-owner original SQLite/native job service; hosted, multiuser and signed-worker acceptance remain separate':'Explicit local laboratory adapter; hosted/owner acceptance remains separate',status:()=>({admissionOpen:ready,activeExecutions:engineering?.active.size??0,hostJournalCustodyHeld:hostCustody()}),close(){return closing??=(async()=>{ready=false;if(engineering)await engineering.close();if(hostCustody())throw Error('Native host journal custody is unconfirmed; original service retained');server.closeAllConnections();await new Promise(done=>server.close(done));sql.close();if(ownerLock!==undefined){closeSync(ownerLock);ownerLock=undefined;unlinkSync(ownerLockPath);}})().catch(error=>{closing=null;throw error;});}});
 }catch(error){try{if(engineering)await engineering.close();if(server){server.closeAllConnections();await new Promise(done=>server.close(done));}sql?.close();if(ownerLock!==undefined){closeSync(ownerLock);ownerLock=undefined;unlinkSync(ownerLockPath);}}catch{throw Error('Local service startup cleanup unconfirmed');}throw error;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const configPath=process.argv[2];if(!configPath)throw Error('Private configuration required');const app=await startLocalWorkerApi(configPath);console.log(JSON.stringify({origin:app.origin,scope:app.scope}));let stopping=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(stopping)return;stopping=true;void app.close().then(()=>{process.exitCode=0;}).catch(()=>{console.error('local-service-cleanup-unconfirmed');process.exitCode=1;stopping=false;});});}
 catch{console.error('local-service-start-unconfirmed');process.exitCode=1;}
}
