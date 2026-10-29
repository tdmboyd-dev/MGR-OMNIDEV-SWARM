import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { acceptanceEvidenceDigest, assessParentAcceptance } from '../scripts/acceptance-promotion-gate.mjs';
import { canonicalAcceptancePayload } from '../scripts/verify-acceptance-receipt.mjs';

const sourceCommit = 'a'.repeat(40);
const signObject = (body, key) => sign(null, Buffer.from(canonicalAcceptancePayload(body)), key).toString('base64');

// Ephemeral test keys only. These do not qualify a live runner or authenticate a real owner.
function fixture({ sameKey = false, count = 2 } = {}) {
  const worker = generateKeyPairSync('ed25519');
  const owner = sameKey ? worker : generateKeyPairSync('ed25519');
  const requirements = ['real service works', 'revoked access is denied'].slice(0, count);
  const criteria = requirements.map((requirement, i) => ({
    criterionId: `Q/AC-${String(i + 1).padStart(2, '0')}`, requirement, status: 'VERIFIED', sourceCommit,
  }));
  const input = {
    backlog: { tasks: [{ id: 'Q', acceptance: requirements }] },
    register: { tasks: [{ id: 'Q', acceptance: criteria }] }, parentId: 'Q', sourceCommit,
    receipts: criteria.map(({ criterionId, requirement }) => {
      const body = { schema: 'mgr.acceptance.receipt.v1', criterionId, requirement, sourceCommit,
        commandSha256: 'b'.repeat(64), outputSha256: 'c'.repeat(64), exitCode: 0,
        truncated: false, timedOut: false, signerId: 'runner', environment: 'isolated', sourceCoverage: 'complete' };
      return { ...body, signature: signObject(body, worker.privateKey) };
    }),
    trustRegistry: [{ signerId: 'runner', status: 'active', qualification: 'independent-isolated-runner',
      publicKey: worker.publicKey, allowedSourceCommits: [sourceCommit] }],
    ownerPublicKey: owner.publicKey, expectedOwnerId: 'human',
  };
  const approve = (overrides = {}) => {
    const payload = { schema: 'mgr.acceptance.owner-approval.v2', parentId: input.parentId,
      sourceCommit: input.sourceCommit, decision: 'approve', ownerId: input.expectedOwnerId,
      evidenceSha256: acceptanceEvidenceDigest({ parentId: input.parentId, sourceCommit: input.sourceCommit,
        criteria: input.register.tasks[0].acceptance, receipts: input.receipts }), ...overrides };
    input.ownerApproval = { payload, signature: signObject(payload, owner.privateKey) };
  };
  const resignReceipt = index => {
    const { signature, ...body } = input.receipts[index];
    input.receipts[index] = { ...body, signature: signObject(body, worker.privateKey) };
  };
  approve();
  return { input, approve, resignReceipt, worker, owner };
}

test('all original criteria plus separately bound owner grant becomes eligible without mutation', () => {
  const { input } = fixture();
  const before = JSON.stringify(input);
  const result = assessParentAcceptance(input);
  assert.equal(result.eligible, true);
  assert.equal(result.criteriaVerified, 2);
  assert.equal(result.status, 'ELIGIBLE_FOR_FINAL_OWNER_CONTROLLED_PROMOTION');
  assert.equal(result.evidenceSha256, input.ownerApproval.payload.evidenceSha256);
  assert.equal(JSON.stringify(input), before);
});

test('missing signed receipts cannot approve parent', () => {
  const { input } = fixture(); input.receipts = [];
  assert.equal(assessParentAcceptance(input).reason, 'incomplete-receipts-or-trust-registry');
});

test('unverified or changed original criterion cannot be bypassed', () => {
  for (const patch of [{ status: 'UNVERIFIED' }, { requirement: 'easier requirement' }, { criterionId: 'OTHER/AC-01' }]) {
    const { input } = fixture(); Object.assign(input.register.tasks[0].acceptance[0], patch);
    assert.equal(assessParentAcceptance(input).reason, 'original-criterion-not-verified');
  }
});

test('register evidence must describe the current exact source revision', () => {
  for (const patch of [undefined, 'd'.repeat(40)]) {
    const { input } = fixture(); input.register.tasks[0].acceptance[0].sourceCommit = patch;
    assert.equal(assessParentAcceptance(input).reason, 'register-source-mismatch');
  }
});

test('unregistered, revoked, unqualified and out-of-scope signers are rejected', () => {
  for (const patch of [{ signerId: 'unknown' }, { status: 'revoked' }, { qualification: 'fixture' },
    { allowedSourceCommits: ['d'.repeat(40)] }, { allowedSourceCommits: sourceCommit }]) {
    const { input } = fixture(); Object.assign(input.trustRegistry[0], patch);
    assert.equal(assessParentAcceptance(input).reason, 'unqualified-runner');
  }
});

test('zero criteria never become a fully accepted parent', () => {
  const { input } = fixture({ count: 0 });
  assert.equal(assessParentAcceptance(input).reason, 'task-or-criterion-mismatch');
});

test('one signed receipt cannot be reused across duplicated or unrelated criterion identities', () => {
  const { input } = fixture();
  input.backlog.tasks[0].acceptance[1] = input.backlog.tasks[0].acceptance[0];
  input.register.tasks[0].acceptance[1] = { ...input.register.tasks[0].acceptance[0] };
  input.receipts[1] = { ...input.receipts[0], criterionId: 'UNUSED/AC-99' };
  assert.equal(assessParentAcceptance(input).reason, 'duplicate-or-invalid-criterion-receipt');
});

test('duplicate receipts and extra unrelated receipts fail closed', () => {
  const duplicate = fixture().input; duplicate.receipts[1] = { ...duplicate.receipts[0] };
  assert.equal(assessParentAcceptance(duplicate).reason, 'duplicate-or-invalid-criterion-receipt');
  const unrelated = fixture().input; unrelated.receipts[1].criterionId = 'OTHER/AC-99';
  assert.equal(assessParentAcceptance(unrelated).reason, 'original-criterion-not-verified');
  const extra = fixture().input; extra.receipts.push({ ...extra.receipts[0] });
  assert.equal(assessParentAcceptance(extra).reason, 'incomplete-receipts-or-trust-registry');
});

test('duplicate parent records cannot hide conflicting source-of-truth states', () => {
  for (const field of ['backlog', 'register']) {
    const { input } = fixture(); input[field].tasks.push({ ...input[field].tasks[0] });
    assert.equal(assessParentAcceptance(input).reason, 'duplicate-or-invalid-parent');
  }
});

test('duplicate trust identities cannot override a revoked key by array ordering', () => {
  const { input } = fixture(); input.trustRegistry.unshift({ ...input.trustRegistry[0], status: 'revoked' });
  assert.equal(assessParentAcceptance(input).reason, 'duplicate-or-invalid-trust-identity');
  input.trustRegistry.reverse();
  assert.equal(assessParentAcceptance(input).reason, 'duplicate-or-invalid-trust-identity');
});

test('missing, fixture, simulated and unknown environment labels cannot qualify', () => {
  for (const environment of [null, 'fixture', 'simulation', 'local', 'untrusted']) {
    const { input, resignReceipt, approve } = fixture();
    if (environment === null) delete input.receipts[0].environment;
    else input.receipts[0].environment = environment;
    resignReceipt(0); approve();
    assert.equal(assessParentAcceptance(input).reason, 'fixture-or-incomplete-source');
  }
});

test('partial source coverage cannot qualify even with valid signatures', () => {
  const { input, resignReceipt, approve } = fixture();
  input.receipts[0].sourceCoverage = 'partial'; resignReceipt(0); approve();
  assert.equal(assessParentAcceptance(input).reason, 'fixture-or-incomplete-source');
});

test('runner and owner cannot share a signing key even under different identities', () => {
  const { input } = fixture({ sameKey: true });
  assert.equal(assessParentAcceptance(input).reason, 'owner-runner-not-independent');
});

test('runner and owner cannot share an identity even under different keys', () => {
  const { input, approve } = fixture(); input.expectedOwnerId = 'runner'; approve();
  assert.equal(assessParentAcceptance(input).reason, 'owner-runner-not-independent');
});

test('a valid replacement receipt after owner review requires a new matching grant', () => {
  const { input, resignReceipt, approve } = fixture();
  input.receipts[0].outputSha256 = 'd'.repeat(64); resignReceipt(0);
  assert.equal(assessParentAcceptance(input).reason, 'missing-authenticated-owner-approval');
  approve();
  assert.equal(assessParentAcceptance(input).eligible, true);
});

test('owner identity must match trusted configuration, not merely a signed arbitrary name', () => {
  const { input, approve } = fixture(); approve({ ownerId: 'someone-else' });
  assert.equal(assessParentAcceptance(input).reason, 'missing-authenticated-owner-approval');
  delete input.expectedOwnerId;
  assert.equal(assessParentAcceptance(input).reason, 'missing-authenticated-owner-approval');
});

test('legacy or unbound owner grants cannot authorize current evidence', () => {
  for (const patch of [{ schema: 'mgr.acceptance.owner-approval.v1' }, { evidenceSha256: 'd'.repeat(64) },
    { decision: 'reject' }, { sourceCommit: 'd'.repeat(40) }, { parentId: 'OTHER' }]) {
    const { input, approve } = fixture(); approve(patch);
    assert.equal(assessParentAcceptance(input).reason, 'missing-authenticated-owner-approval');
  }
});

test('changing signed owner grant bytes is rejected', () => {
  const { input } = fixture(); input.ownerApproval.payload.ownerId = 'forged'; input.expectedOwnerId = 'forged';
  assert.equal(assessParentAcceptance(input).reason, 'missing-authenticated-owner-approval');
});

test('trusted execution digest expectations are enforced during parent assessment', () => {
  const { input } = fixture(); input.register.tasks[0].acceptance[0].commandSha256 = 'd'.repeat(64);
  assert.equal(assessParentAcceptance(input).reason, 'execution-binding-mismatch');
});

test('receipt order does not change the reviewed evidence set', () => {
  const { input } = fixture(); input.receipts.reverse();
  assert.equal(assessParentAcceptance(input).eligible, true);
});

test('malformed structured inputs produce denials, never exceptions or positive results', () => {
  for (const input of [null, undefined, false, [], {}, { backlog: { tasks: [null] } }]) {
    assert.equal(assessParentAcceptance(input).eligible, false);
  }
  for (const collection of ['receipts', 'trustRegistry']) {
    const { input } = fixture(); input[collection][0] = null;
    assert.equal(assessParentAcceptance(input).eligible, false);
  }
  const sparse = fixture().input; sparse.backlog.tasks = Array(1);
  assert.equal(assessParentAcceptance(sparse).eligible, false);
});
