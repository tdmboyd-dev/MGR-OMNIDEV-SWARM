import test from 'node:test';import assert from 'node:assert/strict';import {validateAcceptanceRegister} from '../scripts/validate-acceptance-register.mjs';
const data=()=>{const tasks=Array.from({length:174},(_,i)=>({id:'T-'+i,acceptance:['first criterion','second criterion']}));return {backlog:{tasks},register:{criteriaCount:348,tasks:tasks.map(t=>({id:t.id,overall:'NOT_CERTIFIED',acceptance:t.acceptance.map((requirement,i)=>({criterionId:t.id+'/AC-'+String(i+1).padStart(2,'0'),requirement,status:'UNVERIFIED'}))}))}}};
test('174 task records and 348 criteria pass preservation without false certifications',()=>{const d=data();const r=validateAcceptanceRegister(d.backlog,d.register);assert.equal(r.valid,true);assert.equal(r.verifiedCriteria,0);assert.equal(r.readyForCertification,0);});
test('rejects parent marked certified with unverified criterion',()=>{const d=data();d.register.tasks[0].overall='CERTIFIED';assert.ok(validateAcceptanceRegister(d.backlog,d.register).errors.some(x=>x.includes('parent-false-green')));});
test('rejects forged VERIFIED with missing source/test/reviewer receipt',()=>{const d=data();d.register.tasks[0].acceptance[0].status='VERIFIED';assert.equal(validateAcceptanceRegister(d.backlog,d.register).valid,false);});
test('full provenance per criterion makes parent eligible, not automatically approved',()=>{const d=data();const task=d.register.tasks[0];for(const c of task.acceptance){Object.assign(c,{status:'VERIFIED',sourceCommit:'a'.repeat(40),testCommand:'node --test tests/x.test.mjs',evidence:[{kind:'test',sha256:'f'.repeat(64)}],reviewedBy:'reviewer',verifiedAt:'2026-10-29T00:00:00Z'});}const out=validateAcceptanceRegister(d.backlog,d.register);assert.equal(out.valid,true);assert.equal(out.readyForCertification,1);assert.equal(task.overall,'NOT_CERTIFIED');});
test('exact acceptance text cannot be silently rewritten',()=>{const d=data();d.register.tasks[0].acceptance[0].requirement='something easier';assert.equal(validateAcceptanceRegister(d.backlog,d.register).valid,false);});

function proven(d, sourceCommit = 'a'.repeat(40)) {
 for (const c of d.register.tasks[0].acceptance) Object.assign(c, {
  status: 'VERIFIED', sourceCommit, testCommand: 'node tests/real-contract.mjs',
  evidence: [{ kind: 'test-output', path: 'evidence/real-contract.json', sha256: 'f'.repeat(64) }],
  reviewedBy: 'reviewer', verifiedAt: '2026-10-29T00:00:00.000Z',
 });
 return d;
}

test('duplicate original or registered parent identities are rejected', () => {
 for (const field of ['backlog', 'register']) {
  const d = data(); d[field].tasks[173] = structuredClone(d[field].tasks[0]);
  assert.throws(() => validateAcceptanceRegister(d.backlog, d.register), /duplicate or missing parent ID/);
 }
});

test('empty original requirements cannot make 174 parents ready', () => {
 const d = data();
 for (const row of [...d.backlog.tasks, ...d.register.tasks]) row.acceptance = [];
 d.register.criteriaCount = 0;
 const result = validateAcceptanceRegister(d.backlog, d.register);
 assert.equal(result.valid, false); assert.equal(result.readyForCertification, 0);
 assert.equal(result.errors.filter(error => error.endsWith('invalid-original-criteria')).length, 174);
});

test('unknown parent IDs cannot silently replace required original parents', () => {
 const d = data(); d.register.tasks[173].id = 'UNKNOWN';
 const result = validateAcceptanceRegister(d.backlog, d.register);
 assert.ok(result.errors.includes('UNKNOWN:unknown-parent'));
 assert.ok(result.errors.includes('T-173:missing'));
 assert.equal(result.totalCriteria, 348);
});

test('sparse or malformed parent and criterion records fail closed', () => {
 for (const value of [Array(174), Array.from({ length: 174 }, () => null)]) {
  const d = data(); d.backlog.tasks = value;
  assert.throws(() => validateAcceptanceRegister(d.backlog, d.register));
 }
 for (const value of [null, {}, [], Array(2)]) {
  const d = data(); d.register.tasks[0].acceptance = value;
  assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
 }
 const d = data(); d.register.tasks[0].acceptance[0] = null;
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
});

test('duplicate criterion identities cannot reuse the same original requirement', () => {
 const d = data(); d.register.tasks[0].acceptance[1] = structuredClone(d.register.tasks[0].acceptance[0]);
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
});

test('blank or meaningless provenance cannot be counted as verified', () => {
 for (const patch of [{ testCommand: ' ' }, { reviewedBy: '\n' }, { evidence: [{}] }, { evidence: [null] },
  { evidence: ['unsupported'] }, { evidence: [{ kind: 'test', path: ' ' }] },
  { evidence: [{ kind: 'test', sha256: 'bad' }] }, { sourceCommit: 'invalid' },
  { verifiedAt: '1' }, { verifiedAt: '2026-02-31T00:00:00Z' }]) {
  const d = proven(data()); Object.assign(d.register.tasks[0].acceptance[0], patch);
  const result = validateAcceptanceRegister(d.backlog, d.register);
  assert.equal(result.valid, false); assert.equal(result.verifiedCriteria, 1); assert.equal(result.readyForCertification, 0);
 }
});

test('historic verified proof remains intact when candidate source changes', () => {
 const d = proven(data()); const before = JSON.stringify(d);
 const result = validateAcceptanceRegister(d.backlog, d.register, { expectedSourceCommit: 'b'.repeat(40) });
 assert.equal(result.valid, true); assert.equal(result.verifiedCriteria, 2);
 assert.equal(result.currentVerifiedCriteria, 0); assert.equal(result.readyForCertification, 0);
 assert.deepEqual(result.staleCriteria, ['T-0/AC-01', 'T-0/AC-02']);
 assert.equal(JSON.stringify(d), before);
});

test('matching candidate revision has structural readiness but no automatic certification', () => {
 const d = proven(data());
 const result = validateAcceptanceRegister(d.backlog, d.register, { expectedSourceCommit: 'a'.repeat(40) });
 assert.equal(result.valid, true); assert.equal(result.currentVerifiedCriteria, 2);
 assert.equal(result.readyForCertification, 1); assert.equal(result.certifiedTasks, 0);
 assert.match(result.qualification, /not-execution-certification/);
 assert.equal(d.register.tasks[0].overall, 'NOT_CERTIFIED');
});

test('source readiness is unknown without an explicitly requested current revision', () => {
 const d = proven(data()); const result = validateAcceptanceRegister(d.backlog, d.register);
 assert.equal(result.currentVerifiedCriteria, null); assert.equal(result.expectedSourceCommit, null);
});

test('proof from different source revisions cannot make a parent ready', () => {
 const d = proven(data()); d.register.tasks[0].acceptance[1].sourceCommit = 'b'.repeat(40);
 const result = validateAcceptanceRegister(d.backlog, d.register);
 assert.equal(result.valid, true); assert.equal(result.verifiedCriteria, 2); assert.equal(result.readyForCertification, 0);
 assert.deepEqual(result.mixedSourceParents, ['T-0']);
 d.register.tasks[0].overall = 'CERTIFIED';
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
});

test('false aggregate counts and unsupported parent states are rejected', () => {
 for (const patch of [{ certifiedTasks: 174 }, { historicalCount: 1 }, { criteriaCount: 1 },
  { verifiedCriteria: 348 }, { readyForCertification: 174 }, { schema: 'unknown-schema' }]) {
  const d = data(); Object.assign(d.register, patch);
  assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
 }
 const d = data(); d.register.tasks[0].overall = 'MADE_UP_STATE';
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
});

test('completed canonical parent and certified register must remain synchronized', () => {
 const d = proven(data()); d.backlog.tasks[0].status = 'completed_verified';
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
 d.register.tasks[0].overall = 'CERTIFIED'; d.register.certifiedTasks = 1;
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, true);
 d.backlog.tasks[0].status = 'open';
 assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
});

test('the original verified status and completed_verified alias both require complete certified proof', () => {
 for (const status of ['verified', 'completed_verified']) {
  const d = data(); d.backlog.tasks[0].status = status;
  assert.ok(validateAcceptanceRegister(d.backlog, d.register).errors.includes('T-0:backlog-false-green'));
  proven(d);
  assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, false);
  d.register.tasks[0].overall = 'CERTIFIED'; d.register.certifiedTasks = 1;
  assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, true);
 }
});

test('documented incomplete states remain valid and unsupported supplied backlog states are rejected', () => {
 for (const status of ['open', 'in_progress', 'blocked', 'implemented_unverified', 'deferred']) {
  const d = data(); d.backlog.tasks[0].status = status;
  assert.equal(validateAcceptanceRegister(d.backlog, d.register).valid, true);
 }
 for (const status of ['done', 'closed', 'VERIFIED', '', null, 1]) {
  const d = data(); d.backlog.tasks[0].status = status;
  assert.ok(validateAcceptanceRegister(d.backlog, d.register).errors.includes('T-0:invalid-backlog-state'));
 }
 assert.equal(validateAcceptanceRegister(data().backlog, data().register).valid, true);
});

test('recorded status drift is visible rather than silently changing historical source', () => {
 const d = data(); d.backlog.tasks[0].status = 'implemented_unverified'; d.register.tasks[0].recordedStatus = 'open';
 assert.ok(validateAcceptanceRegister(d.backlog, d.register).errors.includes('T-0:recorded-status-drift'));
});

test('invalid current source selectors cannot be used for certification', () => {
 const d = data();
 assert.throws(() => validateAcceptanceRegister(d.backlog, d.register, { expectedSourceCommit: 'not-a-commit' }), /invalid expected/);
});

test('the original 174-task 441-criterion register and REL-02 historical evidence are preserved', async () => {
 const { readFile } = await import('node:fs/promises');
 const backlog = JSON.parse(await readFile(new URL('../UNFINISHED-WORK/backlog.json', import.meta.url), 'utf8'));
 const register = JSON.parse(await readFile(new URL('../UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json', import.meta.url), 'utf8'));
 const before = JSON.stringify(register);
 const result = validateAcceptanceRegister(backlog, register);
 assert.equal(result.valid, true); assert.equal(result.totalParents, 174); assert.equal(result.totalCriteria, 441);
 const importProof = register.tasks.find(row => row.id === 'REL-02').acceptance[0];
 assert.equal(importProof.status, 'VERIFIED'); assert.equal(importProof.sourceCommit, '26e230d052c45c1f42cb731ff095679497af045a');
 assert.ok(result.verifiedCriteria >= 1); assert.equal(JSON.stringify(register), before);
});
