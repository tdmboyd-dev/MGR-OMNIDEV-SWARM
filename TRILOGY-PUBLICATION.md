# Exact tested-candidate publication

## What the owner can do

The job detail screen now separates three steps: review the exact tested change,
approve that version, and create its GitHub draft. The original source commit,
tested candidate commit, target branch and changed paths appear before approval.
The older generic publisher continues to reject Trilogy jobs.

The existing scoped owner key authorizes this operation. It is sent only in the
authorization header, never in a URL, request body or browser storage. Closing
the screen, switching jobs, losing verified status, revoking an approval or
finishing a publication clears it. Publication creates a draft; it does not
merge a pull request or deploy an application.

## Source and permission checks

`lib/trilogy-publication.ts` reconstructs the Git tree and commit from the pinned
base and tested patches, using the same deterministic candidate identity as
Code Monster. It compares that identity with the signed test result before
uploading. Unchanged files, executable modes and existing symbolic links retain
their Git identity. Partial or truncated trees and unsupported edits are refused.

Approval binds the job, owner, project, repository, base, candidate, review,
receipt, command and current repository connection. Every write boundary
rechecks the saved approval, cancellation/stop state and remote base. The
database compares the complete saved job state before advancing an attempt.
Neither a concurrent click nor an older request may overwrite a newer attempt.

## Recovery behavior

| Situation | Result |
|---|---|
| Upload fails before a branch or draft is attempted | The existing attempt can retry its exact objects under current approval. |
| Branch creation response is lost | Read the exact branch before starting any still-unstarted draft operation. |
| Draft creation response is lost | Inspect the existing candidate's draft; do not repeat an uncertain draft write. |
| Approval expires or is revoked after dispatch | The scoped owner can reconcile existing GitHub facts without renewing write authority. |
| Canceled/expired/revoked approval never reached dispatch | Atomically retire that exact undispatched approval and release its matching reservation; no GitHub request is needed. |
| Source, proof, branch, base or saved identity changes | Refuse confirmation or retry rather than certify a different change. |
| Confirmation succeeds | Save the confirmed draft and release its work slot in one transaction. |

An undispatched cleanup returns `canceled-before-dispatch`, with
`reconciliation: "not-dispatched"` and `outcome: null`. The screen reports that
no draft was created. It never treats this response, an incomplete success
response, or a mere HTTP 200 as successful publication. Revoking an uncertain
attempt preserves the read-only recovery controls.

## API

The existing `/api/trilogy` owner boundary accepts these actions:

| Method | Action | Meaning |
|---|---|---|
| GET | `publication` | Read saved publication status for one authorized job. |
| POST | `publicationPreview` | Compute and show the exact currently verified candidate. |
| POST | `authorizePublication` | Approve the complete supplied preview if it still matches. |
| POST | `publish` | Create or safely resume the approved exact draft operation. |
| POST | `revokePublication` | Revoke the named publication approval. |
| POST | `reconcilePublication` | Read back a dispatched draft, or retire an invalid undispatched approval. |

Mutations reject cross-origin requests, unexpected authority fields and wrong
owner/project/repository scopes. Bridge, worker and viewer credentials do not
grant owner publication authority. Status responses omit tokens and signed
output bytes.

## Verification and limits

The publication suites execute actual local Git object construction and SQLite
state transitions. Their GitHub HTTP boundary is an explicitly labeled fixture.
The UI suite executes shipped component handlers with controlled response
timing; it is not browser evidence. The complete source regression and the
three-product run retain their exact source identities and raw outputs.

Live GitHub operation through the product, deployed identity, actual browser
accessibility/mobile journeys, independent signing custody and physical worker
isolation require separate evidence. Existing direct repository saves made by
the assistant are not proof that this in-product integration ran live.

The original 174 parent requirements, 441 acceptance clauses and 28 upgrades
remain unchanged. This implementation does not automatically certify a parent.
