import { createHash } from 'node:crypto';
import {
  acceptancePublicKey, canonicalAcceptancePayload, checkAcceptanceSignature,
  isDenseArray, isPlainRecord, verifyAcceptanceReceipt,
} from './verify-acceptance-receipt.mjs';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const SHA256 = /^[a-f0-9]{64}$/;
const validId = value => typeof value === 'string' && ID.test(value);
const reject = (reason, criterionId) => ({ eligible: false, reason, ...(criterionId ? { criterionId } : {}) });

function uniqueRecords(records, field) {
  if (!isDenseArray(records) || records.some(record => !isPlainRecord(record) || typeof record[field] !== 'string')) return false;
  return new Set(records.map(record => record[field])).size === records.length;
}

function keyFingerprint(key) {
  return createHash('sha256').update(acceptancePublicKey(key).export({ type: 'spki', format: 'der' })).digest('hex');
}

/** Owner approval binds the exact original requirements and signed proof set. */
export function acceptanceEvidenceDigest({ parentId, sourceCommit, criteria, receipts }) {
  const payload = {
    schema: 'mgr.acceptance.evidence-set.v1', parentId, sourceCommit,
    criteria: criteria.map(({ criterionId, requirement }) => ({ criterionId, requirement })),
    receipts: [...receipts].sort((a, b) => a.criterionId < b.criterionId ? -1 : a.criterionId > b.criterionId ? 1 : 0),
  };
  return createHash('sha256').update(canonicalAcceptancePayload(payload)).digest('hex');
}

/** Read-only eligibility, never a status mutation or deployment.
 * trustRegistry, expectedOwnerId and ownerPublicKey MUST come from protected,
 * authenticated configuration, never from the job or receipt being assessed.
 * This code does not provision independent workers or authenticate a human itself.
 */
export function assessParentAcceptance(input = {}) {
  if (!isPlainRecord(input)) return reject('invalid-parent-or-register');
  const { backlog, register, parentId, receipts, trustRegistry, ownerApproval,
    ownerPublicKey, expectedOwnerId, sourceCommit } = input;
  if (!validId(parentId) || typeof sourceCommit !== 'string' || !COMMIT.test(sourceCommit)
    || !Array.isArray(backlog?.tasks) || !Array.isArray(register?.tasks)) return reject('invalid-parent-or-register');
  if (!uniqueRecords(backlog.tasks, 'id') || !uniqueRecords(register.tasks, 'id')
    || backlog.tasks.some(row => !validId(row.id)) || register.tasks.some(row => !validId(row.id))) {
    return reject('duplicate-or-invalid-parent');
  }
  const task = backlog.tasks.find(row => row.id === parentId);
  const row = register.tasks.find(item => item.id === parentId);
  if (!task || !row || !Array.isArray(task.acceptance) || !Array.isArray(row.acceptance)
    || task.acceptance.length === 0 || row.acceptance.length !== task.acceptance.length) {
    return reject('task-or-criterion-mismatch');
  }
  if (!Array.isArray(receipts) || receipts.length !== row.acceptance.length || !Array.isArray(trustRegistry)) {
    return reject('incomplete-receipts-or-trust-registry');
  }
  if (!uniqueRecords(row.acceptance, 'criterionId') || !uniqueRecords(receipts, 'criterionId')) {
    return reject('duplicate-or-invalid-criterion-receipt');
  }
  if (!uniqueRecords(trustRegistry, 'signerId') || trustRegistry.some(identity => !validId(identity.signerId))) {
    return reject('duplicate-or-invalid-trust-identity');
  }
  const receiptIndex = new Map(receipts.map(receipt => [receipt.criterionId, receipt]));
  const keys = new Map(trustRegistry.map(identity => [identity.signerId, identity]));
  const runnerKeyFingerprints = new Set();
  const runnerIds = new Set();
  for (let i = 0; i < row.acceptance.length; i++) {
    const criterion = row.acceptance[i];
    const expectedCriterionId = `${parentId}/AC-${String(i + 1).padStart(2, '0')}`;
    const receipt = receiptIndex.get(expectedCriterionId);
    if (typeof task.acceptance[i] !== 'string' || !task.acceptance[i].trim()
      || criterion.criterionId !== expectedCriterionId || criterion.requirement !== task.acceptance[i]
      || criterion.status !== 'VERIFIED' || !receipt) {
      return reject('original-criterion-not-verified', expectedCriterionId);
    }
    if (criterion.sourceCommit !== sourceCommit) return reject('register-source-mismatch', expectedCriterionId);
    const identity = keys.get(receipt.signerId);
    if (!identity || identity.status !== 'active' || identity.qualification !== 'independent-isolated-runner'
      || !Array.isArray(identity.allowedSourceCommits) || !identity.allowedSourceCommits.includes(sourceCommit)) {
      return reject('unqualified-runner', expectedCriterionId);
    }
    const result = verifyAcceptanceReceipt({
      criterion, receipt, publicKey: identity.publicKey, expectedCommit: sourceCommit,
      expectedSignerId: identity.signerId,
      ...(criterion.commandSha256 !== undefined ? { expectedCommandSha256: criterion.commandSha256 } : {}),
      ...(criterion.outputSha256 !== undefined ? { expectedOutputSha256: criterion.outputSha256 } : {}),
    });
    if (!result.ok) return reject(result.reason, expectedCriterionId);
    // Fail closed on omitted, unknown, fixture and simulated environment labels.
    if (receipt.environment !== 'isolated' || receipt.sourceCoverage !== 'complete') {
      return reject('fixture-or-incomplete-source', expectedCriterionId);
    }
    runnerKeyFingerprints.add(keyFingerprint(identity.publicKey));
    runnerIds.add(identity.signerId);
  }
  let evidenceSha256;
  try { evidenceSha256 = acceptanceEvidenceDigest({ parentId, sourceCommit, criteria: row.acceptance, receipts }); }
  catch { return reject('invalid-evidence-set'); }
  const approval = ownerApproval?.payload;
  if (!isPlainRecord(approval) || approval.schema !== 'mgr.acceptance.owner-approval.v2'
    || approval.parentId !== parentId || approval.sourceCommit !== sourceCommit || approval.decision !== 'approve'
    || !validId(expectedOwnerId) || approval.ownerId !== expectedOwnerId
    || typeof approval.evidenceSha256 !== 'string' || !SHA256.test(approval.evidenceSha256)
    || approval.evidenceSha256 !== evidenceSha256 || !ownerPublicKey
    || !checkAcceptanceSignature(approval, ownerApproval.signature, ownerPublicKey)) {
    return reject('missing-authenticated-owner-approval');
  }
  if (runnerIds.has(expectedOwnerId) || runnerKeyFingerprints.has(keyFingerprint(ownerPublicKey))) {
    return reject('owner-runner-not-independent');
  }
  return {
    eligible: true, status: 'ELIGIBLE_FOR_FINAL_OWNER_CONTROLLED_PROMOTION',
    parentId, criteriaVerified: row.acceptance.length, sourceCommit, evidenceSha256,
  };
}
