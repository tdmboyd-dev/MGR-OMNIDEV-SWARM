import assert from 'node:assert/strict';
import {after,test} from 'node:test';
import {sign} from 'node:crypto';
import {fixture,closeStore,jobs,environment,hash,canon,dbSnapshot,resultOf} from './trilogy-fixture.mjs';

const worker=await import('../.test-runtime/worker-route.mjs');
after(closeStore);

// Real worker route, SQLite storage and signatures with disposable fixture keys.
// These tests verify report transport/admission, not a physical Docker boundary.
async function reportFixture(output,{trilogy=true,passed=true}={}){
 const f=await fixture();let pending;
 if(trilogy){pending=await f.pending();assert.equal((await f.save({result:pending.result})).status,200);}
 const assigned=await jobs.workerJob(f.job.id);
 const report={id:f.job.id,passed,output,worker:'docker-isolated',imageDigest:'node@sha256:'+'a'.repeat(64),cleanup:{verifiedAbsent:true},assignment:assigned.assignment};
 if(trilogy){
  const signed=await f.verified(pending),{signature,...body}=signed.receipt;
  body.outputBytes=Buffer.byteLength(output);body.outputSha256=hash(output);
  report.trilogyReceipt={...body,signature:sign(null,Buffer.from(canon(body)),f.keys.privateKey).toString('base64')};
  report.trilogySignerId=environment.OMNI_TRILOGY_VERIFIER_ID;
 }
 return {...f,report};
}
async function post(f,body=JSON.stringify(f.report),extra={}){
 const request=new Request('https://omni.example/api/worker',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+f.tokens.worker},body,...(body instanceof ReadableStream?{duplex:'half'}:{}),...extra});
 const response=await worker.POST(request);return {status:response.status,data:await response.json()};
}

test('the worker route accepts the complete signed 20 KB output after JSON escaping',async()=>{
 const output='test "ok"\n'.repeat(2000),f=await reportFixture(output),raw=JSON.stringify(f.report);
 assert.equal(Buffer.byteLength(output),20000);assert.ok(Buffer.byteLength(raw)>25000);
 const response=await post(f,raw);assert.equal(response.status,200,response.data.error);
 const saved=resultOf(f.job.id).externalTests;
 assert.equal(saved.passed,true);assert.equal(saved.output,output);
 assert.equal(saved.trilogyProof.receipt.outputSha256,hash(output));
 assert.equal(saved.trilogyProof.outputBase64,Buffer.from(output).toString('base64'));
});

test('worst-case six-byte JSON escaping fits without increasing the decoded output allowance',async()=>{
 const output='\u0000'.repeat(20000),f=await reportFixture(output),raw=JSON.stringify(f.report);
 assert.equal(Buffer.byteLength(output),20000);assert.ok(Buffer.byteLength(raw)>120000);assert.ok(Buffer.byteLength(raw)<128000);
 const response=await post(f,raw);assert.equal(response.status,200,response.data.error);
 assert.equal(resultOf(f.job.id).externalTests.output,output);
});

test('chunk boundaries inside valid multi-byte UTF-8 preserve the exact signed output',async()=>{
 const output='🙂'.repeat(5000),f=await reportFixture(output),raw=Buffer.from(JSON.stringify(f.report));
 const first=raw.indexOf(Buffer.from('🙂'))+1;
 const stream=new ReadableStream({start(controller){controller.enqueue(raw.subarray(0,first));controller.enqueue(raw.subarray(first,first+2));controller.enqueue(raw.subarray(first+2));controller.close();}});
 const response=await post(f,stream);assert.equal(response.status,200,response.data.error);
 assert.equal(resultOf(f.job.id).externalTests.output,output);
 assert.equal(resultOf(f.job.id).externalTests.trilogyProof.receipt.outputBytes,20000);
});

test('signed decoded output over 20 KB is still refused even when its body fits',async()=>{
 for(const output of ['x'.repeat(20001),'é'.repeat(10001)]){
  const f=await reportFixture(output),before=dbSnapshot();
  assert.ok(Buffer.byteLength(JSON.stringify(f.report))<128000);
  const response=await post(f);assert.equal(response.status,400);assert.deepEqual(dbSnapshot(),before);
 }
});

test('the existing ordinary worker report remains compatible at its allowed output limit',async()=>{
 const output='test "ok"\n'.repeat(2000),f=await reportFixture(output,{trilogy:false});
 assert.ok(Buffer.byteLength(JSON.stringify(f.report))>25000);
 const response=await post(f);assert.equal(response.status,200,response.data.error);
 const saved=resultOf(f.job.id).externalTests;assert.equal(saved.output,output);assert.equal(saved.passed,true);assert.equal(saved.trilogyProof,undefined);
});

test('ordinary oversized decoded output is still refused before storage',async()=>{
 const f=await reportFixture('x'.repeat(20001),{trilogy:false}),before=dbSnapshot();
 const response=await post(f);assert.equal(response.status,400);assert.deepEqual(dbSnapshot(),before);
});

test('an oversized chunked body is canceled before the remaining body is read or stored',async()=>{
 const f=await reportFixture('pass\n'),before=dbSnapshot();let pulls=0,canceled=false;
 const stream=new ReadableStream({pull(controller){pulls++;if(pulls<=3)controller.enqueue(new Uint8Array(64000).fill(32));else controller.close();},cancel(){canceled=true;}},{highWaterMark:0});
 const response=await post(f,stream);assert.equal(response.status,400);assert.match(response.data.error,/Report too large/);
 assert.equal(canceled,true);assert.equal(pulls,3);assert.deepEqual(dbSnapshot(),before);
});

test('wire-body limits count UTF-8 bytes instead of JavaScript string characters',async()=>{
 const f=await reportFixture('pass\n'),before=dbSnapshot(),raw=JSON.stringify({...f.report,extra:'é'.repeat(65000)});
 assert.ok(raw.length<128000);assert.ok(Buffer.byteLength(raw)>128000);
 const response=await post(f,raw);assert.equal(response.status,400);assert.match(response.data.error,/Report too large/);assert.deepEqual(dbSnapshot(),before);
});

test('malformed UTF-8 cannot be silently replaced and saved as ordinary worker output',async()=>{
 const f=await reportFixture('sentinel',{trilogy:false}),before=dbSnapshot(),raw=Buffer.from(JSON.stringify(f.report)),at=raw.indexOf('sentinel');
 const invalid=Buffer.concat([raw.subarray(0,at),Buffer.from([0xc3,0x28]),raw.subarray(at+'sentinel'.length)]);
 const response=await post(f,invalid);assert.equal(response.status,400);assert.deepEqual(dbSnapshot(),before);
});

test('truncated JSON is refused without changing any job evidence',async()=>{
 const f=await reportFixture('pass\n'),before=dbSnapshot(),raw=JSON.stringify(f.report);
 const response=await post(f,raw.slice(0,-1));assert.equal(response.status,400);assert.deepEqual(dbSnapshot(),before);
});

test('a failed stream cannot leave a partially accepted execution report',async()=>{
 const f=await reportFixture('pass\n'),before=dbSnapshot();let pulls=0;
 const stream=new ReadableStream({pull(controller){if(!pulls++)controller.enqueue(Buffer.from('{"id":'));else controller.error(Error('fixture transport interruption'));}},{highWaterMark:0});
 const response=await post(f,stream);assert.equal(response.status,400);assert.deepEqual(dbSnapshot(),before);
});

test('unauthorized report requests are rejected without consuming their body',async()=>{
 const f=await reportFixture('pass\n'),before=dbSnapshot();let pulls=0;
 const stream=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(128001));controller.close();}},{highWaterMark:0});
 const response=await post(f,stream,{headers:{Authorization:'Bearer wrong-credential'}});
 assert.equal(response.status,401);assert.equal(pulls,0);assert.deepEqual(dbSnapshot(),before);
});

test('the larger transport envelope still refuses altered signed test output',async()=>{
 const f=await reportFixture('test "ok"\n'.repeat(2000)),before=dbSnapshot();
 f.report.output='test "NO"\n'.repeat(2000);
 const response=await post(f);assert.equal(response.status,400);assert.deepEqual(dbSnapshot(),before);
});
