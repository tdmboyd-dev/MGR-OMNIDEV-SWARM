import assert from 'node:assert/strict';
import {reviewPlan,expandSwarm} from '../.test-runtime/review-planner.mjs';
let plan=reviewPlan([{path:'readme.md',content:'hello'}],'review',[],100);plan.control={mode:'all'};const parent=plan.tasks[0];
plan=expandSwarm(plan,parent,['SPAWN: Performance | readme.md documents unmeasured latency']);assert.equal(plan.tasks.at(-1).domain,'Performance');assert.equal(plan.tasks.at(-1).parentIndex,parent.index);assert.equal(plan.budget,plan.tasks.length);
const n=plan.tasks.length;plan=expandSwarm(plan,parent,['SPAWN: Performance | duplicate','SPAWN: Unknown | tool missing']);assert.equal(plan.tasks.length,n);assert.equal(plan.spawnEvents.at(-1).detail,'unknown capability');
plan=expandSwarm(plan,{...parent,depth:4},['SPAWN: Cloud | evidence']);assert.equal(plan.spawnEvents.at(-1).detail,'nesting safety limit');
plan.control={mode:'calls'};plan.budget=2;plan=expandSwarm(plan,parent,['SPAWN: Cloud | configuration evidence']);assert.equal(plan.budget,2);assert.equal(plan.tasks.at(-1).domain,'Cloud');console.log('Swarm spawn, deduplication, unknown capability, depth and budget tests passed');
