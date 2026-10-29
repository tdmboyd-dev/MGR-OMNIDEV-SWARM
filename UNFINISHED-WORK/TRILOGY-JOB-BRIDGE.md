# Scoped trilogy job bridge

Updated October 29, 2026. This connects the existing OmniDev job, Code Monster candidate and receipt ledger, and OmniSight read-only evidence view. It supports the existing **imported snapshot** test profile. It does not establish whole-application correctness, production identities, a qualified Docker host, automatic publication, or release permission.

## Product placement

**Imprint** belongs inside Code Monster. Its **Slot Machine** selector chooses compatible approved parts for a bounded proposal. They are background parts of the existing development workflow, not two new products or repositories. OmniDev owns the requested job, project selection, permission, budget and owner decision. OmniSight displays the evidence that actually exists.

A proposal assembly mechanism answers how a change can be built. Useful recommendations about what to change still require project findings, outside evidence where relevant, and measured outcomes. No confidence, novelty, revenue or speedup is inferred from successful assembly.

## One existing job through the three products

1. Import a GitHub snapshot. Resolve the branch once, then retrieve its inventory and every file by the exact commit/tree. Preserve that identity on the project.
2. Generate an existing native or model-backed OmniDev candidate. The candidate must await owner review, pass its static checks, and use the snapshot profile.
3. Prepare the matching Code Monster Imprint proposal. OmniDev compares its exact before/after file hashes, source commit and canonical plan hash with the existing job. An owner service action grants candidate-only permission for fifteen minutes.
4. Code Monster's `trilogy-sync` command checks that grant, regenerates the same plan, stages the candidate on its granted Git ref, preserves its ledger, and submits the pending evidence. It does not create a replacement worker engine or move the approved base branch.
5. The existing OmniDev worker checks the candidate Git parent/ref, every approved changed path, assigned bytes, regular-file modes, current key and permission. The existing Docker runner executes its fixed snapshot command. It signs observed successful output only after cleanup has been observed. Signing credentials stay outside the candidate checkout and container environment.
6. Code Monster retrieves the signed output, validates and admits the exact receipt into its existing ledger, then submits the verified evidence. Repeating the command resumes or replays the same work without a second execution or duplicated transition.
7. OmniSight retrieves only the configured owner/project/repository/job view. It keeps the event sequence, candidate and file bindings intact and clears stale data when the upstream permission fails. The read view omits raw source, raw test output and private proof material.
8. An existing explicit owner action may apply the verified candidate to the local OmniDev snapshot while the grant is current. The generic GitHub publisher rejects trilogy candidate-only jobs because that publisher would rewrite onto a newer remote base. An authorized publication path preserving the exact tested commit remains separate work. Nothing in this contract approves a merge, deployment or production release.

## Shared contracts

| Contract | Bound information |
|---|---|
| `mgr.trilogy.job.v1` | Job, owner, project, repository, exact base commit, canonical plan hash, candidate ref, fixed command identity and hash |
| `mgr.trilogy.job-result.v1` | Exact request/source binding, one candidate commit, approved changed-file hashes, append-only event references, observation time and bounded verification summary |
| `mgr.omnidev.trilogy-status.v1` | Current scoped permission, result revision, read-only result, and explicit unqualified host state |
| Receipt version 2 | Exact campaign/job/base/candidate/command, exit status, canonical execution times, output hash/byte count and a registered Ed25519 signature |

Only `candidate-pending-independent-verification` and `verified-pending-owner` are accepted result states. Both retain `requiresOwnerApproval: true`, `merged: false`, and `released: false`. Output is canonical base64 containing 1–20,000 bytes of valid UTF-8. It must have been produced after the candidate was staged and before both the grant and assignment expired.

Source, objective, payload, candidate or permission changes reject the operation. Atomic database predicates retain those exact versions and check expiry against the database clock, including a statement delayed in a queue. Failed races cannot append a success audit. Signature verification is followed by a fresh permission/key check before proof is exposed or applied.

## Deployment configuration

Configure secrets through the existing protected runtime, never in committed files. Each of the three service tokens must be distinct, 32–512 characters, and different from `OMNI_WORKER_TOKEN`.

| OmniDev setting | Purpose |
|---|---|
| `OMNI_TRILOGY_SCOPE` | JSON object with `ownerId`, `projectId`, and `repositoryId` for one configured scope |
| `OMNI_TRILOGY_OWNER_TOKEN` | Owner service access for authorize/revoke |
| `OMNI_TRILOGY_BRIDGE_TOKEN` | Code Monster access for current grant, execution proof, and result submission |
| `OMNI_TRILOGY_READ_TOKEN` | OmniSight status access only |
| `OMNI_TRILOGY_READ_JOB_ID` | The one job the reader may retrieve |
| `OMNI_TRILOGY_VERIFIER_ID` / `OMNI_TRILOGY_VERIFIER_PUBLIC_KEY` | Registered separate signer and Ed25519 public key |
| `OMNI_TRILOGY_VERIFIER_REVOKED` | `true` disables that signing identity |

The existing worker additionally needs `OMNI_TRILOGY_REPOSITORY_ID`, `OMNI_TRILOGY_REPOSITORY_ROOT`, and an absolute `OMNI_TRILOGY_VERIFIER_PRIVATE_KEY_FILE`, together with its existing pinned worker image and connection settings. The private key must be a regular private file outside the candidate Git checkout. On POSIX systems its permissions must exclude group/other access. Windows ACL qualification remains required for a real Windows signer. The mirror must contain the granted candidate ref and retain HEAD at the approved base. Repository and signing configuration are rechecked after execution.

Code Monster receives the bridge URL/token, the same scope and verifier registration, and a private state directory outside Git. Its HTTPS client permits literal loopback HTTP only for local verification, refuses redirects, and bounds response size/time. OmniSight receives only its scoped reader configuration. Consult each companion repository's current bridge documentation for its exact launch arguments. These settings are a single-scope service boundary; deployed multi-user identity, consent and key custody still require implementation and qualification.

## API surface

`/api/trilogy` uses bearer authentication and `Cache-Control: no-store`.

| Request | Role | Effect |
|---|---|---|
| `POST { action: "authorize", jobId, plan }` | Owner | Validate the existing candidate and record a candidate-only grant |
| `POST { action: "revoke", jobId }` | Owner | Revoke the current grant and append its audit |
| `POST { action: "result", jobId, result, receipt?, outputBase64? }` | Bridge | Accept a matching stage or signed verification transition |
| `GET ?action=grant&jobId=...` | Bridge | Read the current grant and fixed command |
| `GET ?action=execution&jobId=...` | Bridge | Read current exact signed execution proof when available |
| `GET ?jobId=...` | Reader | Read the configured scoped status |

Cross-origin writes, unknown authority fields, ambiguous query parameters, malformed UTF-8 and request bodies over 256,000 bytes are rejected. Missing or misconfigured credentials do not silently enable the feature.

## Verification and original requirements

The existing full runner now includes `runtimeProjectScope`, `trilogyJobs`, `trilogyWorker`, and `githubSnapshotPinning` among its 64 profiles. All compiled tests require fresh preparation. The source checkpoint and actual full-run outcome are recorded separately after execution; this document does not predict a pass.

The focused runtime tests execute real component callbacks with controlled network replies. The GitHub tests use explicit provider fixtures. Worker tests include actual Git/signatures/Node commands and a simulated Docker CLI. The three-project integration uses actual local HTTP, Git candidates, SQLite and execution, with disposable fixture keys. None of these can certify a physical Docker boundary, real browser journey, deployed account, or independent production signer.

Relevant original clauses remain in the 441-clause register: `RUN-03/AC-01` (concurrent effects), `DEV-01/AC-02` (unsupported/stale edits), `QA-02/AC-01–02` (meaningful behavior failures and honest snapshot scope), `UX-01/AC-01–02` and `UX-03/AC-01` (clear implemented actions and failure states). This is bounded additional evidence; full original parent acceptance is not inferred from these suites.

Live host qualification, complete application tests, permission-scoped multi-agent campaigns, actual browser/accessibility journeys, exact-commit publication, deployed identity and independent release approval remain explicit next work. Continue to reuse `worker/runner.mjs` and `worker/fleet.mjs`.
