# OmniDev full verification workflow

Updated October 29, 2026. The original **174 parent IDs and 441 acceptance clauses** remain authoritative. Keep the separate 28 trilogy upgrades separate. Find the existing implementation before deciding it is absent; reproduce its original requirements and repair the actual failures.

## One reproducible command

From a clean, committed review checkout with the pinned dependencies installed:

```sh
pnpm install --frozen-lockfile
pnpm verify:full
```

`verify:full` runs `scripts/run-full-verification.mjs`. It prepares fresh runtime modules, type-checks, builds the actual application, executes every reviewed local profile, and validates the canonical acceptance register. Reports and exact output are saved under ignored `outputs/full-verification/`. Commit reviewed evidence after execution, then verify the remote branch.

Targeted repair checks may run on a working tree during development. Only the clean, pinned full run can support the consolidated source-bound regression claim. Do not fabricate commits or discard the failing baseline to obtain a green report.

## Execution integrity

- Fixed argument lists in `FIXTURE_PROFILES`; no arbitrary command or shell supplied by a job.
- Every project entrypoint is tracked by Git. Record the exact source commit, tree, command hash, lockfile hash, Node/platform, timestamps, exit/signal, output digest and byte count.
- Reject uncommitted tracked or untracked source. Check the same clean commit and tree again after every suite.
- Remove only the generated `.test-runtime` build directory before preparation; reject a symlink/file at that location. Recompile current source and hash all emitted modules. A missing, stale, changed or silently skipped preparation cannot qualify dependent suites.
- Compare compiled-module hashes before and after subsequent suites. Source stability does not establish generated-code stability by itself.
- Forward only an explicit environment allowlist to fixture processes; do not inherit provider credentials or Node preload hooks.
- Bound output and duration. On timeout/output overflow, terminate the process group and await process closure. Nonempty execution output is required, including preparation and TypeScript diagnostics.
- Preserve exact output bytes as logs and their SHA-256 digests. Save the report after every suite so interruption retains completed observations. Independent checks continue after a normal test failure; source drift blocks further execution.
- Count executed profiles separately from named assertions. Several existing suites import the runtime/platform suites; summing their printed totals inflates the unique-test count.

This is a reviewed **local regression runner**, not a sandbox for arbitrary untrusted repositories, a verified Docker host, or an independent signing service.

## Per-task process

1. **Locate:** Read original acceptance wording and identify the actual implementation, consumers and tests. Record committed source paths and hashes. A catalog entry or proposed interface is not a working adapter.
2. **Inspect:** Trace expected inputs, outputs, side effects, authorization, failure, concurrency and recovery. State which portions of the original requirement are already present.
3. **Reproduce:** Execute the original behavior. Preserve a failing baseline for defects. A generic passing suite does not cover an unrelated criterion.
4. **Repair:** Fix the cause in the existing system, retain recovery boundaries and add a meaningful behavioral regression. Do not add a duplicate scheduler or weaken worker capacity.
5. **Retest:** Execute positive, negative, concurrency/recovery and affected integration checks. Finish the full pinned regression on the candidate.
6. **Assess each criterion:** Store exact requirement, immutable tested commit, command, result, log/hash, observed behavior, reviewer and limits. Distinguish fully reproduced local requirements from partial fixture coverage, missing implementation and external activation blockers. A requirement explicitly permitting `unassessed` can be satisfied by a truthful tested unassessed state; do not silently replace a real-provider requirement with a fixture.
7. **Qualify external behavior:** If the original clause requires a provider, hosted authorization, browser/assistive interaction, a real isolated worker, deployment, or rollback, obtain that actual target's evidence. Do not infer success from configuration or publication.
8. **Independent release assessment:** Authenticate the protected runner identity and distinct owner; verify signed criteria and approval against the exact candidate and proof set. This remains a separate production gate and does not fabricate a live signer from local fixture keys.
9. **Synchronize and publish:** Update the original backlog/register together only to the level supported by evidence. Preserve history; commit/push the review branch and read the remote SHA back. No silent merge, release, or deployment.

## Three different evidence levels

| Level | What it proves | What it cannot prove |
|---|---|---|
| Source located | An actual path/blob exists at a pinned commit | Correctness or complete original scope |
| Executed local behavior | The named local requirement or partial behavior was reproduced, with preserved output | A live external service, hosting boundary, or independent runner |
| Qualified final acceptance | Every original clause and required environment is proven, with protected approval | Any unstated or untested capability |

The criterion register preserves historical proof. `validate-acceptance-register.mjs` checks structure, unique IDs, exact wording, meaningful provenance, synchronized statuses/counts and same-revision readiness. Its optional final argument selects a candidate revision. It does not authenticate test execution.

```sh
node scripts/validate-acceptance-register.mjs UNFINISHED-WORK/backlog.json UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json <candidate-sha>
```

Store bounded local results in the criterion's separate `localVerification` object with status, immutable source, exact commands, log hashes, observed behavior and remaining scope. A local `VERIFIED` result is not the original criterion's final acceptance status or an independent production attestation. Preserve historical proof and keep each parent uncertified until its required final gate is satisfied.

## Cryptographic gate contract

`verify-acceptance-receipt.mjs` verifies canonical Ed25519 receipts against the original criterion, source, command and output. It rejects malformed, incomplete, failed and substituted receipts. Trusted keys and expected identities come from protected configuration, never the job being assessed.

`acceptance-promotion-gate.mjs` is read-only eligibility. It requires nonempty original criteria, unique matching receipts, one current source revision, an active qualified independent runner, complete source coverage and an actual isolated environment. Duplicate trust identities cannot override revocation. A distinct authenticated owner must sign `mgr.acceptance.owner-approval.v2` containing `evidenceSha256 = acceptanceEvidenceDigest(...)` and the exact parent/source. The caller supplies the trusted `expectedOwnerId`; the same person/key cannot masquerade as both runner and owner. Earlier unbound owner grants intentionally fail closed.

The registry, live signing service and authenticated owner-action service are not provisioned by these pure validators. A fixture keypair is never enrolled merely because tests generated it.

## Current source discovery

The follow-up inspected every one of the 44 remaining unlinked parents and all 122 original clauses. Six additional partial/new mappings make **136/174** source-linked; **38** have no dedicated recorded implementation path. Thirty-four of those are catalog-only connectors; their registrations and unsupported-action boundary were exercised individually without making provider calls. The other four are business/legal/cleanup requirements with precisely recorded gaps or access blockers.

See `mgr-unlinked-deep-discovery-20261029.json` for each original ID. `mgr-core-acceptance-execution-20261029.json` preserves the actual before/after behavioral failures and scope. Neither report automatically closes parents.

Browser interaction is explicitly unresolved in this environment: both available browsers cannot reach the scratch preview. The actual React component is separately rendered and tested; static rendering does not prove keyboard focus, responsive interaction or assistive-technology journeys.

## Restart and evidence

Read `HANDOFF.md`, `AGENTS.md`, this workflow, the canonical backlog/register, and the latest full-verification report. Keep the failure logs, exact source commit and remote verification. Do not restart with another metadata-only sweep or overwrite older evidence to improve a percentage.

## Completed source checkpoint

The final October 29 run passed all **54/54 profiles** at `8aa5f615af380bea1676daf2459d365f2e4653ae`. Logs and receipt hashes are in `evidence/full-verification-20261029/run/`. The wave report is `mgr-full-verification-wave-20261029.md`; current source census is `mgr-136-committed-source-reconciliation-20261029.json`, and the remaining discovery list is `mgr-38-unlinked-source-gaps-20261029.json`. Seven local contracts are recorded separately from original final acceptance. Metadata-only evidence reconciliation after this source commit requires a conservation/provenance check and an explicit code-identity comparison.

## Latest scanner integration checkpoint — October 29, 2026

The current complete local run is **60/60 profiles** at `e6701655ecad5f1c9d3fd7944b7ecec4191b0955`, including TypeScript and production build. The prior 54- and 58-profile runs are historical checkpoints. `securityGapEvaluation` executes the bounded scanner corpus directly; `securityGapReconciliation` requires the existing fresh runtime preparation and exercises actual workspace/job consumers. Exact receipts are in `evidence/security-wave-20261029/run/report.json`; the report is `mgr-security-wave-20261029.md`.

The initial restricted attempt is preserved separately because Node child-process output was empty. Expanded local execution restored real capture and allowed the unchanged source to pass; accepting exit zero without output is still prohibited. No original parent was auto-promoted. Keep source-bound local results distinct from real provider, Docker, browser, hosted identity and independent release evidence.
