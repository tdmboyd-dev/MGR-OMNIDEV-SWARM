/** Explicit single-owner loopback SQLite adapter for actual production routes.
 * This is not Cloudflare D1, an owner gateway deployment or a fake provider. */
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,realpathSync,existsSync,lstatSync} from 'node:fs';
import {resolve,dirname,basename,sep,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,timingSafeEqual} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Readable} from 'node:stream';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),labRoot=resolve(repo,'../../wave3');
const hash=value=>createHash('sha256').update(value).digest('hex');
const same=(left,right)=>typeof left==='string'&&typeof right==='string'&&timingSafeEqual(Buffer.from(hash(left),'hex'),Buffer.from(hash(right),'hex'));
let started=false;
export async function startLocalWorkerApi(configPath){
 if(started)throw Error('Use a fresh process for each local adapter instance');started=true;
 const config=JSON.parse(readFileSync(configPath,'utf8'));
 if(typeof config.ownerToken!=='string'||config.ownerToken.length<32||typeof config.nativeWorkerToken!=='string'||config.nativeWorkerToken.length<32||same(config.ownerToken,config.nativeWorkerToken)||typeof config.tenantId!=='string'||!config.tenantId||typeof config.actorId!=='string'||!config.actorId)throw Error('Explicit distinct private credentials and fixed identity required');
 const dbPath=resolve(config.databasePath||'');
 if(!dbPath.startsWith(labRoot+sep)||!/^omni-native-lab-[a-f0-9-]{36}\.sqlite$/.test(basename(dbPath))||realpathSync(dirname(dbPath)).toLowerCase()!==realpathSync(labRoot).toLowerCase())throw Error('Database must be a direct named laboratory file in wave3');
 const existed=existsSync(dbPath);if(existed&&lstatSync(dbPath).isSymbolicLink())throw Error('Database symlink denied');
 if(existed){const inspect=new DatabaseSync(dbPath,{readOnly:true});try{const identity=inspect.prepare('SELECT tenant_id,actor_id FROM omni_local_lab_identity WHERE id=1').get();if(identity?.tenant_id!==config.tenantId||identity?.actor_id!==config.actorId)throw Error('Existing database is not this explicit laboratory identity');}finally{inspect.close();}}
 const sql=new DatabaseSync(dbPath);sql.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 if(!existed){sql.exec('BEGIN');try{for(const file of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sql.exec(readFileSync(join(repo,file),'utf8'));sql.exec('CREATE TABLE omni_local_lab_identity(id INTEGER PRIMARY KEY CHECK(id=1),tenant_id TEXT NOT NULL,actor_id TEXT NOT NULL); CREATE TABLE omni_local_http_audit(id INTEGER PRIMARY KEY,at TEXT NOT NULL,principal TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,status INTEGER NOT NULL);');sql.prepare('INSERT INTO omni_local_lab_identity VALUES(1,?,?)').run(config.tenantId,config.actorId);sql.exec('COMMIT');}catch(error){sql.exec('ROLLBACK');sql.close();throw error;}}
 class Statement{constructor(query,args=[]){this.query=query;this.args=args;}bind(...args){return new Statement(this.query,args);}async first(){return sql.prepare(this.query).get(...this.args)??null;}async all(){return {results:sql.prepare(this.query).all(...this.args)};}async run(){return {meta:{changes:Number(sql.prepare(this.query).run(...this.args).changes)}};}}
 const db={prepare:query=>new Statement(query),batch:async statements=>{sql.exec('BEGIN');try{const results=statements.map(s=>({meta:{changes:Number(sql.prepare(s.query).run(...s.args).changes)}}));sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 globalThis.__omniNodeLocalEnv={DB:db,OMNI_WINDOWS_WORKER_TOKEN:config.nativeWorkerToken,...(config.workerPolicy?{OMNI_WINDOWS_WORKER_POLICY_JSON:JSON.stringify(config.workerPolicy)}:{})};
 const output=join(repo,'.local-worker-runtime');execFileSync(process.execPath,['tests/prepare.mjs'],{cwd:repo,env:{...process.env,OMNI_PREPARE_OUTPUT:output,OMNI_PREPARE_ENV_GLOBAL:'__omniNodeLocalEnv'},stdio:'pipe',windowsHide:true});
 const workspace=await import(pathToFileURL(join(output,'route.mjs'))),runtime=await import(pathToFileURL(join(output,'runtime-route.mjs'))),worker=await import(pathToFileURL(join(output,'worker-route.mjs')));
 const allowedRuntime=new Set(['enqueue','submitAccountCandidate','cancel','apply','rollback']);let origin;
 const server=createServer(async(req,res)=>{
  let principal='denied',status=500;const send=(code,message)=>{status=code;res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:message}));};
  try{
   if(req.headers.host!==new URL(origin).host)return send(403,'Local host binding denied');
   if(req.headers.origin&&req.headers.origin!==origin)return send(403,'Cross-origin request denied');
   const url=new URL(req.url,origin),credential=req.headers.authorization?.replace(/^Bearer /,'');
   if(url.pathname==='/api/worker'){if(!same(credential,config.nativeWorkerToken))return send(401,'Native worker credential required');principal='native-worker';}
   else{if(!same(credential,config.ownerToken))return send(401,'Owner credential required');if(req.headers['x-tenant-id']!==config.tenantId||req.headers['x-actor-id']!==config.actorId)return send(403,'Configured owner identity denied');principal='owner';}
   if(!['GET','POST'].includes(req.method))return send(405,'Method denied');
   let request=new Request(url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
   if(principal==='owner'&&req.method==='POST'){
    const {boundedRequestText}=await import(pathToFileURL(join(output,'request-body.mjs')));const raw=await boundedRequestText(request,url.pathname==='/api/workspace'?2200000:600000);const body=JSON.parse(raw);
    if(url.pathname==='/api/workspace'&&body?.action!=='import')return send(403,'Laboratory workspace allows source import only');
    if(url.pathname==='/api/runtime'&&(!allowedRuntime.has(body?.action)||body.action==='enqueue'&&(body.mode!=='account'||body.workerKind!=='windows-appcontainer'||body.testProfile!=='snapshot'||body.automaticReview===true||body.automaticRepair===true)))return send(403,'Laboratory allows explicit native snapshot jobs without model dispatch');
    request=new Request(url,{method:'POST',headers:req.headers,body:raw});
   }
   const route=url.pathname==='/api/workspace'?workspace:url.pathname==='/api/runtime'?runtime:url.pathname==='/api/worker'?worker:null;if(!route)return send(404,'Route unavailable');
   const response=await route[req.method](request);status=response.status;res.writeHead(status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{if(!res.headersSent)send(400,'Local adapter request rejected');else res.destroy();}
  finally{try{sql.prepare('INSERT INTO omni_local_http_audit(at,principal,method,path,status) VALUES(?,?,?,?,?)').run(new Date().toISOString(),principal,req.method,req.url?.split('?')[0]||'',status);}catch{}}
 });
 server.requestTimeout=30000;server.headersTimeout=10000;server.keepAliveTimeout=1000;server.maxHeadersCount=64;
 await new Promise((resolveReady,reject)=>{server.once('error',reject);server.listen(config.port||0,'127.0.0.1',resolveReady);});origin='http://127.0.0.1:'+server.address().port;
 return {origin,databasePath:dbPath,scope:'Explicit single-owner local SQLite adapter; production route logic, not Cloudflare D1 or deployed gateway',close:async()=>{await new Promise(done=>server.close(done));sql.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const configPath=process.argv[2];if(!configPath)throw Error('Pass private laboratory configuration path');const app=await startLocalWorkerApi(configPath);console.log(JSON.stringify({origin:app.origin,databasePath:app.databasePath,scope:app.scope}));let stopping=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(stopping)return;stopping=true;await app.close();process.exit(0);});}
