/**
 * Validate the saved board before executing its renderer. This checks structure
 * and internally consistent totals, not provenance or independent acceptance.
 * The generator's committed-source and evidence-hash checks remain authoritative.
 */
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(text);
const nonnegative = value => Number.isSafeInteger(value) && value >= 0;
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const unique = values => new Set(values).size === values.length;
const counts = values => {
  const result = new Map();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return Object.fromEntries(result);
};
const sameCounts = (actual, expected) => object(actual)
  && Object.keys(actual).length === Object.keys(expected).length
  && Object.entries(expected).every(([key, value]) => Object.hasOwn(actual, key)
    && nonnegative(actual[key]) && actual[key] === value);
// These fields are consumed directly by the generated evidence renderer. A
// resolved reference alone is insufficient: a non-string path makes its label
// construction throw and prevents the rest of the board from rendering.
const evidenceReference = value => object(value)
  && (!Object.hasOwn(value, 'path') || text(value.path))
  && ['kind', 'reason', 'linkStatus'].every(key =>
    !Object.hasOwn(value, key) || typeof value[key] === 'string');

export function isCompleteProgressData(data) {
  try {
    if (!object(data) || data.schema !== 'mgr.owner-progress-view.v1' || data.derivedOnly !== true
      || !Array.isArray(data.tasks) || data.tasks.length !== 174
      || !Array.isArray(data.upgrades) || data.upgrades.length !== 28
      || !Array.isArray(data.completed) || !object(data.evidence)
      || !object(data.sourceFiles) || !object(data.publishedLinks)
      || !text(data.evidenceAsOf) || !Number.isFinite(Date.parse(data.evidenceAsOf))
      || !object(data.sourceSnapshot)
      || ![data.sourceSnapshot.commit, data.sourceSnapshot.tree, data.sourceSnapshot.publicRef].every(sha)
      || !object(data.summaries)) return false;

    const references = value => strings(value) && value.every(id =>
      Object.hasOwn(data.evidence, id) && evidenceReference(data.evidence[id]));
    const taskIds = data.tasks.map(task => task?.id);
    if (!taskIds.every(text) || !unique(taskIds)) return false;
    const knownTasks = new Set(taskIds);
    if (!data.completed.every(item => object(item) && text(item.title) && text(item.observed)
      && strings(item.remaining) && references(item.evidenceIds)
      && strings(item.taskIds) && item.taskIds.every(id => knownTasks.has(id)))) return false;

    const allClauses = [];
    const referencedSources = new Set();
    for (const task of data.tasks) {
      if (!object(task) || ![task.title, task.priority, task.recordedStatus, task.finalAcceptance].every(text)
        || !strings(task.pendingActions) || !strings(task.originalWork) || !strings(task.priorPendingActions)
        || !strings(task.dependencies) || !strings(task.sourcePaths) || !unique(task.sourcePaths)
        || !references(task.evidenceIds) || !references(task.taskUpdateEvidenceIds)
        || !Array.isArray(task.completedHere) || !unique(task.completedHere)
        || !task.completedHere.every(index => nonnegative(index) && index < data.completed.length
          && data.completed[index].taskIds.includes(task.id))
        || !Array.isArray(task.additionalAuditRequirements)
        || !task.additionalAuditRequirements.every(item => object(item)
          && [item.id, item.title, item.resolution_and_acceptance].every(text))
        || !Array.isArray(task.acceptance) || task.acceptance.length === 0
        || typeof task.sourcePresent !== 'boolean') return false;
      if (task.sourcePaths.some(file => !Object.hasOwn(data.sourceFiles, file))) return false;
      for (const file of task.sourcePaths) {
        const source = data.sourceFiles[file];
        if (!object(source) || source.path !== file || typeof source.present !== 'boolean'
          || source.present && (!sha(source.gitBlob) || !/^[a-f0-9]{64}$/.test(source.sha256 ?? ''))) return false;
        referencedSources.add(file);
      }
      if (task.sourcePresent !== (task.sourcePaths.length > 0
        && task.sourcePaths.every(file => data.sourceFiles[file].present))) return false;
      for (const clause of task.acceptance) {
        if (!object(clause) || ![clause.id, clause.requirement, clause.finalStatus, clause.localStatus].every(text)
          || !clause.id.startsWith(task.id + '/')
          || !references(clause.finalEvidenceIds) || !references(clause.localEvidenceIds)
          || !Array.isArray(clause.additionalEvidence)
          || !clause.additionalEvidence.every(item => object(item) && text(item.observed)
            && references(item.evidenceIds))) return false;
        allClauses.push(clause);
      }
      if (task.finalAcceptance === 'CERTIFIED'
        && task.acceptance.some(clause => clause.finalStatus !== 'VERIFIED' || clause.finalEvidenceIds.length === 0)) return false;
    }
    if (allClauses.length !== 441 || !unique(allClauses.map(clause => clause.id))) return false;
    if (!data.upgrades.every(item => object(item)
      && [item.id, item.title, item.priority, item.status, item.acceptance].every(text)
      && strings(item.dependencies) && (item.evidence === undefined || strings(item.evidence))
      && !knownTasks.has(item.id)) || !unique(data.upgrades.map(item => item.id))) return false;
    if (Object.keys(data.sourceFiles).length !== referencedSources.size) return false;

    const summary = data.summaries;
    const linked = data.tasks.filter(task => task.sourcePresent).length;
    const missing = [...referencedSources].filter(file => !data.sourceFiles[file].present);
    if (summary.originalParents !== 174 || summary.acceptanceClauses !== 441 || summary.separateUpgrades !== 28
      || summary.linkedToCommittedSource !== linked || summary.withoutCommittedSourceLink !== 174 - linked
      || summary.sourceReferences !== data.tasks.reduce((sum, task) => sum + task.sourcePaths.length, 0)
      || summary.uniqueSourcePaths !== referencedSources.size
      || !strings(summary.missingSourceReferences) || !unique(summary.missingSourceReferences)
      || summary.missingSourceReferences.length !== missing.length
      || !summary.missingSourceReferences.every(file => missing.includes(file))
      || summary.fullyAcceptedParents !== data.tasks.filter(task => task.finalAcceptance === 'CERTIFIED').length
      || !sameCounts(summary.recordedParentStates, counts(data.tasks.map(task => task.recordedStatus)))
      || !sameCounts(summary.finalClauseStates, counts(allClauses.map(clause => clause.finalStatus)))
      || !sameCounts(summary.localClauseStates, counts(allClauses.map(clause => clause.localStatus)))
      || !sameCounts(summary.recordedUpgradeStates, counts(data.upgrades.map(item => item.status)))) return false;

    const verification = data.verification;
    return object(verification)
      && [verification.passedProfiles, verification.failedProfiles, verification.blockedProfiles,
        verification.totalProfiles].every(nonnegative)
      && verification.totalProfiles > 0
      && verification.passedProfiles + verification.failedProfiles + verification.blockedProfiles === verification.totalProfiles
      && sha(verification.sourceCommit) && text(verification.report) && text(verification.scope);
  } catch { return false; }
}

export function isCompleteProgressBoard(html) {
  if (typeof html !== 'string' || html.length > 4000000
    || !/^\s*<!doctype html>/i.test(html) || !/<\/html>\s*$/i.test(html)) return false;
  const blocks = [...html.matchAll(/<script id="progress-data" type="application\/json">([\s\S]*?)<\/script>/g)];
  const markdown = [...html.matchAll(/<script id="progress-markdown" type="application\/json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1 || markdown.length !== 1) return false;
  try {
    return text(JSON.parse(markdown[0][1])) && isCompleteProgressData(JSON.parse(blocks[0][1]));
  } catch { return false; }
}
