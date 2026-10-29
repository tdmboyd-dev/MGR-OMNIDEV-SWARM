import test from 'node:test';import assert from 'node:assert/strict';import {auditHistoricalBacklog} from '../scripts/audit-174.mjs';
const tasks=Array.from({length:174},(_,i)=>({id:`ID-${i}`,status:'open',source_files:i%2===0?['src/x.ts']:[],implementation_state:i%3===0?'partial-tested-local':undefined,acceptance:['run test']}));
const upgrades=Array.from({length:28},(_,i)=>({id:`MGR-${i+1}`}));
test('preserves 174+28 without manufacturing completion',()=>{const a=auditHistoricalBacklog({tasks},{items:upgrades});assert.equal(a.historicalCount,174);assert.equal(a.upgradeCount,28);assert.equal(a.verifiedComplete,0);assert.equal(a.withSourceReferences,87);assert.deepEqual(a.recordedStatuses,{open:174});});
test('rejects lost or duplicated parent tasks',()=>{assert.throws(()=>auditHistoricalBacklog({tasks:tasks.slice(1)},{items:upgrades}));assert.throws(()=>auditHistoricalBacklog({tasks:[...tasks.slice(0,-1),tasks[0]]},{items:upgrades}));});
test('no historical status changes',()=>{const before=JSON.stringify(tasks);auditHistoricalBacklog({tasks},{items:upgrades});assert.equal(JSON.stringify(tasks),before);});
