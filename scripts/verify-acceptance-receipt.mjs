import { createPublicKey, verify } from 'node:crypto';

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const CRITERION_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\/AC-\d{2,}$/;

export function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null)
    && Reflect.ownKeys(value).every(key => typeof key === 'string'
      && Object.getOwnPropertyDescriptor(value, key)?.enumerable
      && 'value' in Object.getOwnPropertyDescriptor(value, key));
}

export function isDenseArray(value) {
  return Array.isArray(value) && Reflect.ownKeys(value).length === value.length + 1
    && Array.from({ length: value.length }, (_, index) => Object.getOwnPropertyDescriptor(value, String(index)))
      .every(descriptor => descriptor?.enumerable && 'value' in descriptor);
}

/** Stable JSON bytes shared by signers and verifiers. Reject lossy JSON values. */
export function canonicalAcceptancePayload(value) {
  const active = new Set();
  function normalize(item, depth) {
    if (depth > 32) throw new TypeError('Acceptance payload is too deeply nested');
    if (item === null || typeof item === 'string' || typeof item === 'boolean') return item;
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (typeof item !== 'object' || active.has(item)) throw new TypeError('Acceptance payload must be acyclic JSON');
    active.add(item);
    try {
      if (Array.isArray(item)) {
        if (!isDenseArray(item)) throw new TypeError('Sparse, accessor or decorated arrays are unsupported');
        return item.map(entry => normalize(entry, depth + 1));
      }
      if (!isPlainRecord(item)) throw new TypeError('Acceptance payload must contain plain JSON records');
      return Object.fromEntries(Object.keys(item).sort().map(key => [key, normalize(item[key], depth + 1)]));
    } finally {
      active.delete(item);
    }
  }
  return JSON.stringify(normalize(value, 0));
}

export function acceptancePublicKey(key) {
  const publicKey = key?.type === 'public' ? key : createPublicKey(key);
  if (publicKey.type !== 'public' || publicKey.asymmetricKeyType !== 'ed25519') throw new TypeError('Ed25519 public key required');
  return publicKey;
}

export function checkAcceptanceSignature(payload, signature, key) {
  try {
    if (typeof signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) return false;
    const bytes = Buffer.from(signature, 'base64');
    if (bytes.length !== 64 || bytes.toString('base64') !== signature) return false;
    return verify(null, Buffer.from(canonicalAcceptancePayload(payload)), acceptancePublicKey(key), bytes);
  } catch {
    return false;
  }
}

/** Cryptographic integrity only. Trust registration and actual execution are external facts. */
export function verifyAcceptanceReceipt(input = {}) {
  if (!isPlainRecord(input)) return { ok: false, reason: 'missing-trust-input' };
  const { criterion, receipt, publicKey, expectedCommit, expectedSignerId,
    expectedCommandSha256, expectedOutputSha256 } = input;
  if (!isPlainRecord(criterion) || !isPlainRecord(receipt) || !publicKey
    || typeof expectedCommit !== 'string' || !COMMIT.test(expectedCommit)) {
    return { ok: false, reason: 'missing-trust-input' };
  }
  if (typeof criterion.criterionId !== 'string' || !CRITERION_ID.test(criterion.criterionId)
    || typeof criterion.requirement !== 'string' || !criterion.requirement.trim()
    || receipt.schema !== 'mgr.acceptance.receipt.v1'
    || receipt.criterionId !== criterion.criterionId || receipt.requirement !== criterion.requirement
    || receipt.sourceCommit !== expectedCommit) {
    return { ok: false, reason: 'criterion-or-source-mismatch' };
  }
  if (typeof receipt.outputSha256 !== 'string' || !SHA256.test(receipt.outputSha256)
    || typeof receipt.commandSha256 !== 'string' || !SHA256.test(receipt.commandSha256)
    || receipt.exitCode !== 0 || receipt.truncated !== false || receipt.timedOut !== false) {
    return { ok: false, reason: 'failed-or-incomplete-execution' };
  }
  if (typeof receipt.signerId !== 'string' || !ID.test(receipt.signerId) || typeof receipt.signature !== 'string') {
    return { ok: false, reason: 'missing-signer' };
  }
  if ((expectedSignerId !== undefined && (typeof expectedSignerId !== 'string'
    || !ID.test(expectedSignerId) || receipt.signerId !== expectedSignerId))
    || (expectedCommandSha256 !== undefined && (typeof expectedCommandSha256 !== 'string'
      || !SHA256.test(expectedCommandSha256) || receipt.commandSha256 !== expectedCommandSha256))
    || (expectedOutputSha256 !== undefined && (typeof expectedOutputSha256 !== 'string'
      || !SHA256.test(expectedOutputSha256) || receipt.outputSha256 !== expectedOutputSha256))) {
    return { ok: false, reason: 'execution-binding-mismatch' };
  }
  try { acceptancePublicKey(publicKey); } catch { return { ok: false, reason: 'unqualified-key' }; }
  const { signature, ...body } = receipt;
  const ok = checkAcceptanceSignature(body, signature, publicKey);
  return { ok, reason: ok ? 'cryptographic-receipt-valid-needs-independent-runner' : 'signature-rejected' };
}
