import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {inspectBacklogReferences} from '../scripts/reconcile-source-refs.mjs';
const data=()=>({tasks:Array.from({length:174},(_,i)=>({id:'TASK-'+i,status:'open',acceptance:['test'],source_files:[]}))});
test('all historical IDs are conserved with sourced references',async()=>{
 const d=mkdtempSync(join(tmpdir(),'mgr-refs-'));try{
 mkdirSync(join(d,'src'));writeFileSync(join(d,'src','exists.ts'),'export const x=1;');
 const b=data();b.tasks[0].source_files=['src/exists.ts','src/missing.ts'];
 const r=await inspectBacklogReferences(d,b);
 assert.equal(r.totalParents,174);assert.equal(r.parentsWithRefs,1);assert.deepEqual(r.counts,{'present-file':1,'missing-file':1});assert.equal(r.tasks[0].fullAcceptanceCertified,false);
 }finally{rmSync(d,{recursive:true,force:true});}
});
test('path traversal is denied and never read',async()=>{const d=mkdtempSync(join(tmpdir(),'mgr-refs-'));try{const b=data();b.tasks[0].source_files=['../secret'];const r=await inspectBacklogReferences(d,b);assert.equal(r.counts['unsafe-reference'],1);}finally{rmSync(d,{recursive:true,force:true});}});
test('duplicate task IDs fail closed',async()=>{const b=data();b.tasks[1].id=b.tasks[0].id;await assert.rejects(inspectBacklogReferences('.',b),/duplicate/);});
