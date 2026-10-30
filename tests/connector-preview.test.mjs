import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewBinding} from '../scripts/connector-preview/host-binding.mjs';
import {driverMessageSchema} from '../scripts/connector-preview/protocol.mjs';

const request=body=>new Request('http://preview.invalid/invoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const call=argumentsValue=>({connectorId:'fixture',actionName:'read',arguments:argumentsValue});
function fixture(options={}){
 const calls=[];
 const binding=createPreviewBinding({tools:[{connectorId:'fixture',actionName:'read',readOnly:true,invoke:async args=>{calls.push(args);return {content:[{type:'text',text:'actual fixture read'}],structuredContent:{observed:args}};}}],...options});
 return {binding,calls};
}

test('actual preview binding preserves JSON record arguments after the schema-library migration',async()=>{
 const {binding,calls}=fixture();
 try{
  const args={query:'source',limit:2,nested:{enabled:true},empty:null};
  const result=await(await binding.fetch(request(call(args)))).json();
  assert.equal(result.status,'success');assert.deepEqual(calls,[args]);assert.deepEqual(result.result.structuredContent,{observed:args});
 }finally{binding.close();}
});

test('array arguments and extra authority fields cannot dispatch the preview tool',async()=>{
 const {binding,calls}=fixture();
 try{
  for(const body of [call([]),{...call({}),accountId:'other-account'},{...call({}),approved:true},{...call({}),nativeToolName:'arbitrary-write'}]){
   assert.equal((await(await binding.fetch(request(body))).json()).status,'invalid_request');
  }
  assert.equal(calls.length,0);
 }finally{binding.close();}
});

test('the fixed host call budget and closed binding prevent further dispatch',async()=>{
 const {binding,calls}=fixture({maxCalls:1});
 try{
  assert.equal((await(await binding.fetch(request(call({first:true})))).json()).status,'success');
  assert.equal((await(await binding.fetch(request(call({second:true})))).json()).status,'tool_not_allowed');
  binding.close();
  assert.equal((await(await binding.fetch(request(call({third:true})))).json()).status,'binding_unavailable');
  assert.equal(calls.length,1);
 }finally{binding.close();}
});

test('preview grants remain read-only and driver result records retain their payload',()=>{
 assert.throws(()=>createPreviewBinding({tools:[{connectorId:'fixture',actionName:'write',readOnly:false,invoke:async()=>({})}]}),/resolved read actions/);
 const response={jsonrpc:'2.0',id:'11111111-1111-4111-8111-111111111111',result:{content:[{type:'text',text:'observed'}],structuredContent:{count:1}}};
 assert.deepEqual(driverMessageSchema.parse(response),response);
 assert.equal(driverMessageSchema.safeParse({...response,result:[]}).success,false);
});
