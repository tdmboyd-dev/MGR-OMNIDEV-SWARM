# Trilogy job-link wave — October 29, 2026

## User-facing purpose

Give one OmniDev test assignment a consistent identity. A report for Job A must not be accepted as the test result for Job B, another project's source, different proposed files or a different test command. This is a first, locally testable part of the three-product handoff; it is **not** a live link to Code Monster or OmniSight.

## Source and contract

- `lib/trilogy-job-link.mjs`: `mgr.trilogy.job-link.v1` with `jobId`, `projectId`, `assignmentId`, `sourceDigest`, `candidateDigest`, `testManifestDigest` and content checksum `linkSha256`.
- `lib/jobs.ts`: issue the link with each new worker assignment, store it on the job, and reject reports where that exact source/candidate/command/job link is missing or changed.
- Prior already-issued assignments without the link remain eligible under their original receipt checks; they do not become Trio-linked retroactively. New work always includes the link.
- `tests/trilogy-job-link.test.mjs`: valid identity, cross-job/source/candidate/command mismatch, malformed/extra/edited field and no-false-approval checks.
- `tests/runtime.mjs`: actual worker-route round trip and negative reports for missing, forged, or mismatched links. Existing unauthorized worker and source drift refusals remain.
- `scripts/run-fixture-evidence.mjs`: adds a dedicated reviewed `trilogyLink` profile to full local verification.

## Trust boundary

The link is a **checksum and correlation record**, not a digital signature, independent worker attestation, owner approval, live connection or proof that any test executed. Existing worker token, assignment expiration, source/candidate checks and owner-controlled release remain required. Code Monster is still authoritative for Git candidate commits and signed test receipts; OmniSight must stay read-only.

## Verification and status

- Initial code-level checks: TypeScript successful; portable link tests pass; direct `tests/runtime.mjs` reports 83 passing checks with zero failures when child-process output capture is permitted.
- The first restricted-sandbox runtime attempt stopped at the known child-output-capture boundary; the same candidate source passed after the permitted runtime rerun. Do not report that as an app repair.
- Full clean-commit suite and remote source read-back are separate gates; record them in the latest HANDOFF after execution.
- Original 174 task statuses and 441 acceptance statements remain unchanged. No independently certified parent or live three-repository job is claimed.

## Next work

1. Convert a real Code Monster campaign/source/candidate/command receipt into this shared identity under an authenticated versioned bridge; test mismatched and stale Git references.
2. Add a scope-filtered, replay-safe OmniSight read-only job view that derives state from authoritative receipts, not model claims.
3. Qualify the existing Docker worker host, signer separation, cancellation/revocation, recovery and owner approval end-to-end.
4. Run one real multi-file campaign through all three products and independently verify the resulting candidate, rejected paths, browser screen and rollback.
