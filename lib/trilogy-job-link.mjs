// Portable identity contract for a single OmniDev execution assignment.
// This digest binds identifiers; it is NOT an execution signature or approval.
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const HEX = /^[a-f0-9]{64}$/;
const FIELDS = ['jobId', 'projectId', 'assignmentId', 'sourceDigest', 'candidateDigest', 'testManifestDigest'];
const KEYS = ['contract', ...FIELDS, 'linkSha256'];

const payloadFor = fields => ({
  contract: 'mgr.trilogy.job-link.v1',
  jobId: fields.jobId,
  projectId: fields.projectId,
  assignmentId: fields.assignmentId,
  sourceDigest: fields.sourceDigest,
  candidateDigest: fields.candidateDigest,
  testManifestDigest: fields.testManifestDigest,
});

async function sha256(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function validFields(fields) {
  return fields && typeof fields === 'object' && !Array.isArray(fields)
    && ['jobId', 'projectId', 'assignmentId'].every(key => typeof fields[key] === 'string' && ID.test(fields[key]))
    && ['sourceDigest', 'candidateDigest', 'testManifestDigest'].every(key => typeof fields[key] === 'string' && HEX.test(fields[key]));
}

export async function createTrilogyJobLink(fields) {
  if (!validFields(fields)) throw new TypeError('Invalid source-bound Trilogy assignment identity');
  const body = payloadFor(fields);
  return {...body, linkSha256: await sha256(body)};
}

export async function verifyTrilogyJobLink(link, expected) {
  if (!link || typeof link !== 'object' || Array.isArray(link)
    || Object.keys(link).sort().join(',') !== KEYS.slice().sort().join(',')
    || link.contract !== 'mgr.trilogy.job-link.v1' || !validFields(link)
    || typeof link.linkSha256 !== 'string' || !HEX.test(link.linkSha256)) {
    return {ok: false, reason: 'invalid-job-link'};
  }
  if (!validFields(expected) || FIELDS.some(key => link[key] !== expected[key])) {
    return {ok: false, reason: 'job-link-identity-mismatch'};
  }
  if (await sha256(payloadFor(link)) !== link.linkSha256) {
    return {ok: false, reason: 'job-link-digest-mismatch'};
  }
  return {ok: true, qualification: 'identity-correlated-only-not-signed-or-executed'};
}
