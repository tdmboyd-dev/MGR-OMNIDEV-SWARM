import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDenseArray, isPlainRecord } from './verify-acceptance-receipt.mjs';

const SHA = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
// Preserve the original README vocabulary and the later completion alias.
const BACKLOG_STATES = new Set(['open', 'in_progress', 'blocked', 'implemented_unverified', 'verified', 'deferred', 'completed_verified']);
const COMPLETE_STATES = new Set(['verified', 'completed_verified']);
const nonblank = value => typeof value === 'string' && value.trim().length > 0;
const commit = value => typeof value === 'string' && SHA.test(value);

function validTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19);
}

function validEvidence(evidence) {
  return isDenseArray(evidence) && evidence.length > 0 && evidence.every(item => {
    if (!isPlainRecord(item) || !nonblank(item.kind)) return false;
    if (item.sha256 !== undefined && (typeof item.sha256 !== 'string' || !SHA256.test(item.sha256))) return false;
    if (item.sourceRevision !== undefined && !commit(item.sourceRevision)) return false;
    return ['path', 'url', 'uri'].some(key => nonblank(item[key]))
      || (typeof item.sha256 === 'string' && SHA256.test(item.sha256)) || commit(item.sourceRevision);
  });
}

function parentIndex(tasks, label) {
  if (!isDenseArray(tasks) || tasks.length !== 174) throw Error('174 parent invariant failed');
  if (tasks.some(task => !isPlainRecord(task) || typeof task.id !== 'string' || !ID.test(task.id))) {
    throw Error(label + ': invalid parent record or ID');
  }
  const index = new Map(tasks.map(task => [task.id, task]));
  if (index.size !== 174) throw Error(label + ': duplicate or missing parent ID');
  return index;
}

/** Structural provenance validation only; signatures and actual execution are separate gates.
 * Historical verified proof remains in the register. An optional current revision
 * restricts readiness without rewriting or discarding that historical proof.
 */
export function validateAcceptanceRegister(backlog, register, { expectedSourceCommit } = {}) {
  if (!isPlainRecord(backlog) || !isPlainRecord(register)) throw Error('174 parent invariant failed');
  if (expectedSourceCommit !== undefined && !commit(expectedSourceCommit)) throw Error('invalid expected source commit');
  const original = parentIndex(backlog.tasks, 'backlog');
  const index = parentIndex(register.tasks, 'register');
  const errors = [];
  if (register.schema !== undefined && register.schema !== 'mgr.task-acceptance-evidence.v1') errors.push('unsupported-register-schema');
  let criteria = 0, verifiedCriteria = 0, currentVerifiedCriteria = 0, ready = 0, certifiedTasks = 0;
  const staleCriteria = [], mixedSourceParents = [];
  for (const id of index.keys()) if (!original.has(id)) errors.push(id + ':unknown-parent');
  for (const task of backlog.tasks) {
    const completed = COMPLETE_STATES.has(task.status);
    if (task.status !== undefined && !BACKLOG_STATES.has(task.status)) errors.push(task.id + ':invalid-backlog-state');
    const item = index.get(task.id);
    if (!isDenseArray(task.acceptance) || task.acceptance.length === 0
      || task.acceptance.some(requirement => !nonblank(requirement))) {
      errors.push(task.id + ':invalid-original-criteria');
      if (item?.overall === 'CERTIFIED') { certifiedTasks++; errors.push(task.id + ':parent-false-green'); }
      continue;
    }
    criteria += task.acceptance.length;
    if (!item) { errors.push(task.id + ':missing'); continue; }
    if (item.overall === 'CERTIFIED') certifiedTasks++;
    else if (item.overall !== 'NOT_CERTIFIED') errors.push(task.id + ':invalid-parent-state');
    if (item.recordedStatus !== undefined && task.status !== undefined && item.recordedStatus !== task.status) {
      errors.push(task.id + ':recorded-status-drift');
    }
    const expected = task.acceptance;
    if (!isDenseArray(item.acceptance) || item.acceptance.length !== expected.length) {
      errors.push(task.id + ':criteria-count-drift');
      if (item.overall === 'CERTIFIED' || completed) errors.push(task.id + ':parent-false-green');
      continue;
    }
    let all = true;
    const sourceCommits = new Set();
    for (let i = 0; i < expected.length; i++) {
      const c = item.acceptance[i];
      const criterionId = task.id + '/AC-' + String(i + 1).padStart(2, '0');
      if (!isPlainRecord(c) || c.requirement !== expected[i] || c.criterionId !== criterionId) {
        errors.push(criterionId + ':criterion-text-drift'); all = false; continue;
      }
      if (c.status === 'VERIFIED') {
        const proof = commit(c.sourceCommit) && nonblank(c.testCommand) && validEvidence(c.evidence)
          && nonblank(c.reviewedBy) && validTimestamp(c.verifiedAt);
        if (!proof) { errors.push(c.criterionId + ':missing-proof'); all = false; }
        else {
          verifiedCriteria++; sourceCommits.add(c.sourceCommit);
          if (expectedSourceCommit === undefined || c.sourceCommit === expectedSourceCommit) currentVerifiedCriteria++;
          else { staleCriteria.push(c.criterionId); all = false; }
        }
      } else {
        if (c.status !== 'UNVERIFIED' && c.status !== 'BLOCKED') errors.push(c.criterionId + ':invalid-state');
        all = false;
      }
    }
    if (sourceCommits.size > 1) { mixedSourceParents.push(task.id); all = false; }
    if (item.overall === 'CERTIFIED' && !all) errors.push(task.id + ':parent-false-green');
    if (completed && (!all || item.overall !== 'CERTIFIED')) errors.push(task.id + ':backlog-false-green');
    if (item.overall === 'CERTIFIED' && task.status !== undefined && !completed) {
      errors.push(task.id + ':parent-status-not-synchronized');
    }
    if (all) ready++;
  }
  if (register.criteriaCount !== criteria) errors.push('criteria-count-invalid');
  for (const [value, expected, label] of [
    [backlog.task_count, 174, 'backlog-parent-count'], [register.historicalCount, 174, 'historical-parent-count'],
    [register.certifiedTasks, certifiedTasks, 'certified-task-count'], [register.verifiedCriteria, verifiedCriteria, 'verified-criterion-count'],
    [register.readyForCertification, ready, 'ready-parent-count'],
  ]) if (value !== undefined && (!Number.isSafeInteger(value) || value !== expected)) errors.push(label + '-invalid');
  return {
    valid: errors.length === 0, qualification: 'structural-provenance-only-not-execution-certification',
    totalParents: 174, totalCriteria: criteria, verifiedCriteria,
    currentVerifiedCriteria: expectedSourceCommit === undefined ? null : currentVerifiedCriteria,
    certifiedTasks, readyForCertification: ready, expectedSourceCommit: expectedSourceCommit ?? null,
    staleCriteria, mixedSourceParents, errors,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href && process.argv.length >= 4) {
  const backlog = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const register = JSON.parse(await readFile(process.argv[3], 'utf8'));
  const result = validateAcceptanceRegister(backlog, register,
    process.argv[4] ? { expectedSourceCommit: process.argv[4] } : {});
  console.log(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
