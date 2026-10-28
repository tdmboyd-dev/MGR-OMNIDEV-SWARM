import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedRequestText} from '../.test-runtime/request-body.mjs';
test('stream bytes are bounded before full string allocation and oversized stream is canceled',async()=>{
 let canceled=false,pulls=0;const stream=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(4));},cancel(){canceled=true;}});
 await assert.rejects(boundedRequestText(new Request('https://omni.example',{method:'POST',body:stream,duplex:'half'}),6),/byte limit/);assert.equal(canceled,true);assert.ok(pulls<5);
});
test('untrusted Content-Length cannot bypass actual stream byte limit and early oversized hint avoids consuming body',async()=>{
 await assert.rejects(boundedRequestText(new Request('https://omni.example',{method:'POST',headers:{'Content-Length':'1'},body:'😀😀'}),7),/byte limit/);
 let pulled=false;const fake={headers:new Headers({'Content-Length':'999'}),get body(){pulled=true;throw new Error('should not access stream');}};await assert.rejects(boundedRequestText(fake,8),/byte limit/);assert.equal(pulled,false);
});
test('split UTF8 codepoints decode exactly, malformed UTF8 is denied and byte boundary is inclusive',async()=>{
 const bytes=new TextEncoder().encode('a😀');let index=0;const stream=new ReadableStream({pull(controller){if(index===bytes.length)return controller.close();controller.enqueue(bytes.slice(index,index+1));index++;}});assert.equal(await boundedRequestText(new Request('https://omni.example',{method:'POST',body:stream,duplex:'half'}),5),'a😀');
 await assert.rejects(boundedRequestText(new Request('https://omni.example',{method:'POST',body:new Uint8Array([255])}),1),/encoded data|encoding/);
});
