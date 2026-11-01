import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';

// Wait for actual observed state, never assume a disk/network job has finished
// because a small sleep elapsed. No effect is retried by this read-only helper.
export async function waitFor(read,accept,{name='observed completion',timeoutMs=10000}={}){
 const deadline=performance.now()+timeoutMs;let value;
 do{
  value=await read();
  if(value&&typeof value==='object'&&['failed','recovery-required','cancelled'].includes(value.status))assert.fail(`${name}: ${value.status}: ${value.error||'operation did not complete'}`);
  if(accept(value))return value;
  await new Promise(resolve=>setTimeout(resolve,20));
 }while(performance.now()<deadline);
 assert.fail(`${name} not observed within ${timeoutMs}ms; last status=${value?.status??String(value)}`);
}
