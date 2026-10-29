import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrilogyJobLink,verifyTrilogyJobLink} from '../lib/trilogy-job-link.mjs';

const identity = () => ({
  jobId:'request-job-17', projectId:'project-123', assignmentId:'assignment-999',
  sourceDigest:'a'.repeat(64),candidateDigest:'b'.repeat(64),testManifestDigest:'c'.repeat(64),
});

test('one assignment links a specific job, project, source, candidate and command', async () => {
  const fields=identity(),link=await createTrilogyJobLink(fields);
  assert.equal(link.contract,'mgr.trilogy.job-link.v1');
  assert.equal(link.linkSha256.length,64);
  assert.deepEqual(await verifyTrilogyJobLink(JSON.parse(JSON.stringify(link)),fields),
    {ok:true,qualification:'identity-correlated-only-not-signed-or-executed'});
});

test('another job, project, assignment, source, candidate or command cannot claim the link', async () => {
  const fields=identity(),link=await createTrilogyJobLink(fields);
  for(const [key,replacement] of Object.entries({jobId:'other-job',projectId:'other-project',assignmentId:'other-assignment',
    sourceDigest:'d'.repeat(64),candidateDigest:'e'.repeat(64),testManifestDigest:'f'.repeat(64)})){
    assert.equal((await verifyTrilogyJobLink(link,{...fields,[key]:replacement})).reason,'job-link-identity-mismatch',key);
  }
});

test('edited, truncated, extended or malformed links fail closed', async () => {
  const fields=identity(),link=await createTrilogyJobLink(fields);
  assert.equal((await verifyTrilogyJobLink({...link,linkSha256:'0'.repeat(64)},fields)).reason,'job-link-digest-mismatch');
  for(const bad of [{...link,contract:'other'}, {...link,extra:'surprise'}, {...link,sourceDigest:'invalid'},
    {...link,jobId:'wrong'}, {...link,linkSha256:null}, [], null]){
    assert.equal((await verifyTrilogyJobLink(bad,fields)).ok,false);
  }
  await assert.rejects(createTrilogyJobLink({...fields,assignmentId:'../bad'}),/Invalid source-bound/);
});

test('a checksum never implies signed, independently executed, or owner-approved', async () => {
  const fields=identity(),link=await createTrilogyJobLink(fields);
  assert.equal(Object.hasOwn(link,'signature'),false);
  assert.equal(Object.hasOwn(link,'approved'),false);
  assert.equal(Object.hasOwn(link,'verified'),false);
});
