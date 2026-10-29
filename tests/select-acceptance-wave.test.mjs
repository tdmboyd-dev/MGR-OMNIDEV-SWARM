import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAcceptanceWave} from '../scripts/select-acceptance-wave.mjs';
const tasks=Array.from({length:174},(_,i)=>({id:'T'+i,priority:i<30?'P0':'P1',status:'open',acceptance:['check']}));
const register={tasks:tasks.map(t=>({id:t.id,acceptance:[{criterionId:t.id+'/AC-01',requirement:'check',status:'UNVERIFIED'}]}))};
test('select 30 P0 plus 50 extra without acceptance',()=>{
 const w=selectAcceptanceWave({tasks},register);
 assert.equal(w.parents,80);assert.equal(w.criteria,80);assert.equal(w.complete,0);
});
test('duplicate evidence fails',()=>{
 const bad={tasks:[...register.tasks.slice(0,173),register.tasks[0]]};
 assert.throws(()=>selectAcceptanceWave({tasks},bad));
});
test('priority drift fails',()=>{
 const changed=[{...tasks[0],priority:'P1'},...tasks.slice(1)];
 assert.throws(()=>selectAcceptanceWave({tasks:changed},register));
});
