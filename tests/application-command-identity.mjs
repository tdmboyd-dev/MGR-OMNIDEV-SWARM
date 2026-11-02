import test from 'node:test';
import assert from 'node:assert/strict';
import {applicationCommand,applicationDockerArgs} from '../worker/application-profile.mjs';
const image='node@sha256:'+'a'.repeat(64);
test('application assignment command is the exact argv launched in the constrained container',()=>{
 const args=applicationDockerArgs('/owned-source','omni-test',image),index=args.indexOf(image);
 assert.ok(index>0);assert.deepEqual(args.slice(index+1),[...applicationCommand]);
 assert.equal(applicationCommand[0],'sh');assert.equal(applicationCommand[1],'-ec');
 assert.match(applicationCommand[2],/npm ci --offline --ignore-scripts/);
 assert.match(applicationCommand[2],/\["typecheck","build","test"\]/);
});
test('application command cannot be mutated between assignment and execution',()=>{
 const before=JSON.stringify(applicationCommand);assert.throws(()=>applicationCommand.push('unapproved'));
 assert.equal(JSON.stringify(applicationCommand),before);
 const args=applicationDockerArgs('/owned-source','omni-test',image);args[args.length-1]='changed-local-copy';assert.equal(JSON.stringify(applicationCommand),before);
});

import {execute} from '../worker/runner.mjs';
const files=[{path:'package.json',content:JSON.stringify({scripts:{test:'node --test'}})},{path:'package-lock.json',content:'{}'}];
for(const [name,profile,command] of [
 ['obsolete application alias','node-application',['npm','run','omni:verify']],
 ['application argument boundaries','node-application',['sh -ec',applicationCommand[2]]],
 ['snapshot argument boundaries','snapshot',['node --test','tests/omni-snapshot.test.mjs']],
 ['application added argument','node-application',[...applicationCommand,'extra']],
 ['application non-string argument','node-application',[{toString:()=> 'sh'},...applicationCommand.slice(1)]]
])test(name+' is refused before any worker process starts',async()=>{
 await assert.rejects(()=>execute({profile,command,files}),/Command is outside worker allowlist/);
});
