import test from 'node:test';import assert from 'node:assert/strict';import {boundedPool,workerCapacity} from '../worker/fleet.mjs';
test('10 slots accepted when adequate resources',()=>assert.equal(workerCapacity({cpuCount:32,memoryBytes:32*1024**3,requested:10}).slots,10));
test('insufficient host resources refuse additional slots',()=>assert.equal(workerCapacity({cpuCount:4,memoryBytes:4*1024**3,requested:10}).slots,1));
test('fleet processes 10 jobs with bounded concurrency',async()=>{let active=0,max=0;const r=await boundedPool(Array.from({length:25},(_,i)=>i),10,async x=>{active++;max=Math.max(max,active);await new Promise(f=>setTimeout(f,1));active--;return x});assert.equal(r.length,25);assert.equal(max,10);assert.ok(r.every(x=>x.status==='fulfilled'));});
test('bad slot requests rejected',async()=>{assert.throws(()=>workerCapacity({requested:11}));await assert.rejects(boundedPool([],11,async()=>0))});
test('unsafe cleanup quarantines host',async()=>await assert.rejects(boundedPool([1,2],2,async()=>{throw Error('cleanup is unverified')}),/quarantined/));
