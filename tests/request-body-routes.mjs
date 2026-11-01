import test from 'node:test';
import assert from 'node:assert/strict';
import {POST as workspace} from '../.test-runtime/route.mjs';
import {POST as intelligence} from '../.test-runtime/intelligence-route.mjs';

for(const [name,post,limit] of [['workspace',workspace,2_199_999],['intelligence',intelligence,10_065_536]]){
 test(`${name} refuses an oversized stream before touching storage and cancels the reader`,async()=>{
  let canceled=false,pulls=0;
  const body=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(Math.floor(limit/2)+1));},cancel(){canceled=true;}});
  const result=await post(new Request('https://owned-request.fixture.invalid/api',{method:'POST',body,duplex:'half'}));
  assert.equal(result.status,400);assert.equal(canceled,true);assert(pulls<5);
 });
 test(`${name} rejects malformed UTF-8 and cross-origin access before reading storage`,async()=>{
  const malformed=await post(new Request('https://owned-request.fixture.invalid/api',{method:'POST',body:new Uint8Array([255])}));assert.equal(malformed.status,400);
  let read=false;const request={url:'https://owned-request.fixture.invalid/api',headers:new Headers({origin:'https://other.fixture.invalid'}),get body(){read=true;throw Error('Origin refusal must happen before reading body');}};
  assert.equal((await post(request)).status,403);assert.equal(read,false);
 });
}
