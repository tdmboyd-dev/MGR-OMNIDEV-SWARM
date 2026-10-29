import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {after,beforeEach,test} from 'node:test';

const environment={DB:null,OMNI_VAULT_KEY:''};globalThis.__omniEnv=environment;
const nativeFetch=globalThis.fetch;let sqlite;
function openStore(){
 sqlite?.close();sqlite=new DatabaseSync(':memory:');
 for(const path of ['drizzle/0000_orange_phalanx.sql','drizzle/0001_modern_hammerhead.sql'])sqlite.exec(readFileSync(path,'utf8'));
 class Stmt{constructor(sql,args=[]){this.sql=sql;this.args=args;}bind(...args){return new Stmt(this.sql,args);}async first(){return sqlite.prepare(this.sql).get(...this.args)||null;}async run(){return {meta:{changes:Number(sqlite.prepare(this.sql).run(...this.args).changes)}};}}
 environment.DB={prepare:sql=>new Stmt(sql)};environment.OMNI_VAULT_KEY=randomBytes(32).toString('base64');globalThis.fetch=nativeFetch;
}
openStore();const providers=await import('../.test-runtime/providers.mjs');beforeEach(openStore);after(()=>{sqlite.close();globalThis.fetch=nativeFetch;});
const first={provider:'openai',model:'test-model',apiKey:'fixture-original-provider-key'};
const second={provider:'openai',model:'replacement-model',apiKey:'fixture-replacement-provider-key'};
function deferredResponse(){
 let entered,release;const started=new Promise(resolve=>entered=resolve),response=new Promise(resolve=>release=resolve);
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/chat/completions');assert.equal(options.redirect,'manual');assert.ok(options.headers.Authorization);entered();await response;return Response.json({choices:[{message:{content:'{"status":"ready"}'}}],usage:{total_tokens:1}});};
 return {started,release};
}

test('AUTH-04 unchanged provider configuration gains a bounded verification timestamp',async()=>{
 await providers.saveProvider(first);const pending=deferredResponse(),verification=providers.verifyProvider();await pending.started;pending.release();
 const result=await verification;assert.ok(result.verifiedAt);assert.equal(result.provider,'openai');assert.equal(result.model,'test-model');
 assert.equal(JSON.stringify(result).includes(first.apiKey),false);assert.equal(sqlite.prepare("SELECT data FROM runtime_settings WHERE id='provider'").get().data.includes(first.apiKey),false);
});

test('AUTH-04 an old request cannot verify newly replaced credentials or model configuration',async()=>{
 await providers.saveProvider(first);const pending=deferredResponse(),verification=providers.verifyProvider();await pending.started;
 await providers.saveProvider(second);const replacement=await providers.settings();pending.release();
 await assert.rejects(()=>verification,/changed|disconnected/i);
 assert.deepEqual(await providers.settings(),replacement);assert.equal((await providers.providerStatus()).verifiedAt,null);
});

test('AUTH-04 disconnect during verification cannot recreate or mark a deleted connection',async()=>{
 await providers.saveProvider(first);const pending=deferredResponse(),verification=providers.verifyProvider();await pending.started;
 await providers.disconnectProvider();pending.release();await assert.rejects(()=>verification,/changed|disconnected/i);
 assert.equal(await providers.settings(),null);assert.equal((await providers.providerStatus()).configured,false);
});

test('AUTH-04 a replacement followed by identical credentials still requires fresh verification',async()=>{
 await providers.saveProvider(first);const pending=deferredResponse(),verification=providers.verifyProvider();await pending.started;
 await providers.saveProvider(second);await providers.saveProvider(first);const replacement=await providers.settings();pending.release();
 await assert.rejects(()=>verification,/changed|disconnected/i);assert.deepEqual(await providers.settings(),replacement);assert.equal(replacement.verifiedAt,null);
});

test('AUTH-04 two concurrent verification completions cannot overwrite the accepted connection state',async()=>{
 await providers.saveProvider(first);const pending=deferredResponse(),checks=[providers.verifyProvider(),providers.verifyProvider()];await pending.started;pending.release();
 const outcomes=await Promise.allSettled(checks);assert.equal(outcomes.filter(item=>item.status==='fulfilled').length,1);assert.equal(outcomes.filter(item=>item.status==='rejected').length,1);assert.ok((await providers.providerStatus()).verifiedAt);
});

test('AUTH-04 named provider verification reports its own connection rather than the legacy provider',async()=>{
 await providers.saveProvider({...first,brainId:'selected-provider'});const pending=deferredResponse(),verification=providers.verifyProvider('selected-provider');await pending.started;pending.release();
 const result=await verification;assert.equal(result.configured,true);assert.equal(result.model,first.model);assert.ok(result.verifiedAt);assert.equal(await providers.settings(),null);
});

test('DATA-03 missing or rotated vault keys fail without issuing provider requests and can be reauthorized',async()=>{
 await providers.saveProvider(first);let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({choices:[{message:{content:'{"status":"ready"}'}}]});};
 const originalKey=environment.OMNI_VAULT_KEY;environment.OMNI_VAULT_KEY='';await assert.rejects(()=>providers.verifyProvider(),/vault is not configured/);assert.equal(calls,0);
 environment.OMNI_VAULT_KEY=randomBytes(32).toString('base64');await assert.rejects(()=>providers.verifyProvider());assert.equal(calls,0);
 await providers.disconnectProvider();await providers.saveProvider(second);assert.ok((await providers.verifyProvider()).verifiedAt);assert.equal(calls,1);assert.equal(JSON.stringify(await providers.providerStatus()).includes(second.apiKey),false);environment.OMNI_VAULT_KEY=originalKey;
});
