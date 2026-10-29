import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { canonicalAcceptancePayload, verifyAcceptanceReceipt } from '../scripts/verify-acceptance-receipt.mjs';

const keys = generateKeyPairSync('ed25519');
const criterion = { criterionId: 'QA-01/AC-01', requirement: 'Authorized hosted journey passes' };
const sourceCommit = 'a'.repeat(40);
const signed = (patch = {}, key = keys.privateKey) => {
  const body = {
    schema: 'mgr.acceptance.receipt.v1', criterionId: criterion.criterionId,
    requirement: criterion.requirement, sourceCommit, commandSha256: 'b'.repeat(64),
    outputSha256: 'c'.repeat(64), exitCode: 0, truncated: false, timedOut: false,
    signerId: 'isolated-test-runner', ...patch,
  };
  return { ...body, signature: sign(null, Buffer.from(canonicalAcceptancePayload(body)), key).toString('base64') };
};
const check = (receipt = signed(), overrides = {}) => verifyAcceptanceReceipt({
  criterion, receipt, publicKey: keys.publicKey, expectedCommit: sourceCommit, ...overrides,
});

test('valid receipt proves cryptographic integrity without claiming independent execution', () => {
  assert.equal(check().ok, true);
  assert.match(check().reason, /needs-independent-runner/);
});

test('legacy flat v1 serialization remains compatible with Ed25519 receipts', () => {
  const { signature, ...body } = signed();
  const previousBytes = JSON.stringify(Object.fromEntries(Object.entries(body).sort(([a], [b]) => a.localeCompare(b))));
  assert.equal(check({ ...body, signature: sign(null, Buffer.from(previousBytes), keys.privateKey).toString('base64') }).ok, true);
});

test('public PEM, KeyObject and SPKI bytes all verify the same receipt', () => {
  const receipt = signed();
  for (const publicKey of [keys.publicKey, keys.publicKey.export({ type: 'spki', format: 'pem' }),
    { key: keys.publicKey.export({ type: 'spki', format: 'der' }), format: 'der', type: 'spki' }]) {
    assert.equal(check(receipt, { publicKey }).ok, true);
  }
});

test('changed original requirement, criterion ID and commit fail', () => {
  for (const patch of [{ requirement: 'easier' }, { criterionId: 'OTHER/AC-01' }, { sourceCommit: 'd'.repeat(40) }]) {
    assert.equal(check(signed(patch)).ok, false);
  }
  assert.equal(check(signed(), { expectedCommit: 'd'.repeat(40) }).ok, false);
});

test('failed, incomplete and truncated execution cannot pass', () => {
  for (const patch of [{ exitCode: 1 }, { exitCode: '0' }, { truncated: true }, { timedOut: true },
    { commandSha256: 'fake' }, { outputSha256: '' }, { truncated: null }]) {
    assert.equal(check(signed(patch)).ok, false);
  }
});

test('tampering with any signed execution field rejects the receipt', () => {
  const receipt = signed();
  receipt.outputSha256 = 'd'.repeat(64);
  assert.equal(check(receipt).ok, false);
});

test('wrong key and non-Ed25519 signing keys are refused', () => {
  assert.equal(check(signed(), { publicKey: generateKeyPairSync('ed25519').publicKey }).ok, false);
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
  assert.equal(check(signed(), { publicKey: rsa.publicKey }).reason, 'unqualified-key');
});

test('noncanonical base64, malformed and oversized signatures are rejected', () => {
  const receipt = signed();
  for (const signature of [receipt.signature + '\n', receipt.signature.slice(0, -2), '!!!!',
    receipt.signature + receipt.signature, Buffer.from(receipt.signature, 'base64').toString('hex')]) {
    assert.equal(check({ ...receipt, signature }).ok, false);
  }
});

test('trusted expected signer and execution digests must match exactly', () => {
  const expectation = { expectedSignerId: 'isolated-test-runner', expectedCommandSha256: 'b'.repeat(64), expectedOutputSha256: 'c'.repeat(64) };
  assert.equal(check(signed(), expectation).ok, true);
  for (const patch of [{ expectedSignerId: 'different-runner' }, { expectedCommandSha256: 'd'.repeat(64) },
    { expectedOutputSha256: 'e'.repeat(64) }, { expectedCommandSha256: 'invalid' }]) {
    assert.equal(check(signed(), { ...expectation, ...patch }).reason, 'execution-binding-mismatch');
  }
});

test('malformed records and blank requirements fail closed without throwing', () => {
  for (const input of [null, undefined, false, [], {}, { criterion: {}, receipt: {} }]) {
    assert.equal(verifyAcceptanceReceipt(input).ok, false);
  }
  assert.equal(check(signed({ requirement: '' }), { criterion: { ...criterion, requirement: '' } }).ok, false);
  assert.equal(check(signed({ signerId: ' ' })).ok, false);
});

test('nested JSON signing is canonical and rejects lossy values or getters', () => {
  assert.equal(canonicalAcceptancePayload({ z: { b: 2, a: 1 }, a: ['x'] }), '{"a":["x"],"z":{"a":1,"b":2}}');
  for (const value of [{ x: undefined }, { x: NaN }, { x: Infinity }, { x: 1n }, { x: new Date() }, Array(2)]) {
    assert.throws(() => canonicalAcceptancePayload(value));
  }
  let read = false;
  const value = Object.defineProperty({}, 'x', { enumerable: true, get() { read = true; return 1; } });
  assert.throws(() => canonicalAcceptancePayload(value));
  assert.equal(read, false);
  const circular = {}; circular.circular = circular;
  assert.throws(() => canonicalAcceptancePayload(circular));
  const decorated = Array(2); decorated[0] = 'a'; decorated.extra = 'ignored';
  assert.throws(() => canonicalAcceptancePayload(decorated));
  const accessorArray = [];
  Object.defineProperty(accessorArray, '0', { enumerable: true, get() { read = true; return 'a'; } });
  assert.throws(() => canonicalAcceptancePayload(accessorArray));
  assert.equal(read, false);
});

test('SHA-256 Git commit identity is supported and malformed lengths are refused', () => {
  const sha256Commit = 'a'.repeat(64);
  assert.equal(check(signed({ sourceCommit: sha256Commit }), { expectedCommit: sha256Commit }).ok, true);
  for (const expectedCommit of ['', 'a'.repeat(39), 'a'.repeat(41), 'A'.repeat(40), 1]) {
    assert.equal(check(signed(), { expectedCommit }).ok, false);
  }
});
