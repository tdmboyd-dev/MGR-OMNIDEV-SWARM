import assert from 'node:assert/strict';
import {reviewPlan,combinedReport} from '../.test-runtime/review-planner.mjs';
const files=[{path:'src/frontend/page.tsx',content:'react\n'.repeat(10001)},{path:'.github/workflows/ci.yml',content:'docker build\n'},{path:'package-lock.json',content:'{}'}];
const plan=reviewPlan(files,'Find all bugs and security risks',[{domain:'Security'},{domain:'Space Robotics'}],12);
assert.ok(plan.tasks.length>2);assert.ok(plan.tasks.some(t=>t.domain==='Accessibility'));assert.ok(plan.tasks.some(t=>t.domain==='DevOps'));assert.deepEqual(plan.unknown,['Space Robotics']);
for(const domain of new Set(plan.tasks.map(t=>t.domain))){for(const file of files){const slices=plan.tasks.filter(t=>t.domain===domain).flatMap(t=>t.files).filter(f=>f.path===file.path).sort((a,b)=>a.start-b.start);let position=0;for(const slice of slices){assert.equal(slice.start,position);position=slice.end;}assert.equal(position,file.content.length);}}
const partial=combinedReport({reviewPlan:plan,reviews:plan.tasks.slice(0,12).map(t=>({index:t.index,domain:t.domain,approved:true,findings:[]}))});assert.equal(partial.status,'budget-paused');assert.ok(partial.remaining>0);
const full=combinedReport({reviewPlan:plan,reviews:plan.tasks.map(t=>({index:t.index,domain:t.domain,approved:true,findings:[]}))});assert.equal(full.status,'reviewed');assert.equal(full.runtime,'not run');
console.log('PASS deterministic relevant specialist selection, exact source-segment coverage, unknown-specialty detection and honest budget/runtime statuses');
