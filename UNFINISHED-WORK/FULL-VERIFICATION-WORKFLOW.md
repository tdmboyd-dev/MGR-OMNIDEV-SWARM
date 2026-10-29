# MGR OmniDev — Full verification and closure workflow (2026-10-29)

## Governing rule
The original 174 task parents and 441 acceptance criteria remain authoritative. **A source file, catalog registration, passing fixture, LLM assertion, generated artifact or Git commit does not by itself prove a requirement has passed.**

## The end-to-end process
1. **Discover:** Find actual implementation in committed Git objects; record path, immutable source commit, content SHA and relevant API/symbol. Mark links as verified location or provisional hypothesis. Unknown remains unknown.
2. **Inspect:** Read the source and architecture. Check scope, identity/tenancy, secrets, error paths, costs, permission and license risks. Define necessary repairs and acceptance fixtures.
3. **Repair:** Stage candidate in a fenced and reviewable branch, preserve base/source hashes, and refuse unapproved risk. Use an isolated worker where external code executes. No silent merge/deployment.
4. **Execute tests:** Run every *original acceptance criterion* on the exact pinned candidate. Include positive behavior, rejection, retry, recovery and resource limits. Record command argv, output digest, exit code, timeout/truncation, platform and coverage. Distinguish mocks from live targets. Re-run on repair.
5. **External validation:** For requirements involving providers, UI, Docker, deployment or OAuth, obtain the actual authorized target's success/failure and revocation receipts; no simulated connected state.
6. **Independent attestation:** A qualified, registered and revocable independent test runner signs the exact criterion wording, source revision, command fingerprint and output fingerprint. `scripts/verify-acceptance-receipt.mjs` verifies cryptographic binding. Its test suite passes **4/4**. Cryptographic validity alone does not establish that the signer is trusted or actually ran the claimed command.
7. **Human gate:** `scripts/acceptance-promotion-gate.mjs` checks every original criterion is verified by an independently qualified signer at the same source commit, source coverage is complete, no fixture is used as live proof, and a separate human owner's Ed25519 approval matches the task/revision. Focused gate tests **4/4 pass**. This only returns *eligibility*, never changes GitHub, parent status or production infrastructure itself.
8. **Promote and verify:** After authenticated owner authorization, update the canonical `UNFINISHED-WORK/backlog.json` and 174-criterion evidence register together; open/review PR; run CI, read back remote commit, attach deployment checks where required. Only then label task `completed_verified`. Recovery/rollback must preserve the original audit trail.
9. **Monitor:** If the implementation is later superseded or fails, append a new evidence event; don't overwrite old proof or silently resurrect an invalid completion.

## What is built versus missing
- Built: structural 174-task validator (441 criteria), 80-task batch selection, limited fixture execution with source hashes, Git provider/worker fixtures, real Git multi-file candidate proof in Code Monster, Ed25519 receipt verifier, independent-signer plus human-approval eligibility gate.
- Tested in this wave: **11/11 focused tests passed** (4 cryptographic receipt, 4 owner promotion, 3 connector-maturity), plus TypeScript noEmit passed.
- Not yet deployed/qualified: protected independent runner signing-key registry, ten live isolated workers, real provider and hosted tenant attestations, owner approval service integration, Linux CI of platform-skipped Code Monster tests, automatic promotion flow.
- Never commit private signing keys or service tokens to GitHub.

## Current original-task reality
- 174 historical parent requirements; **126 open**, **48 implemented_unverified**, **1 of 441 acceptance clauses individually source-verified**, **zero parents fully closed** under strict criteria.
- **130/174 source-linked**; 108 have previous pinned Git-object census, 22 newer source links are explicitly provisional/partial. **44 remain unlinked**; original descriptions are in `UNFINISHED-WORK/mgr-44-unlinked-source-gaps-20261029.json`.
- The 39 connector names in `lib/catalog.ts` consist of **34 catalog-only** and **five partially supported snapshot/adapter pathways**, per `lib/connector-qualification.ts`. No provider connections are automatically certified.
- Existing original 516-file Sites-to-GitHub import hashes match; no high-confidence secret pattern found across 9.2 MB, but the scan is not exhaustive.

## Verification commands
```sh
node scripts/validate-acceptance-register.mjs UNFINISHED-WORK/backlog.json UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json
node --test tests/verify-acceptance-receipt.test.mjs tests/acceptance-promotion-gate.test.mjs tests/connector-qualification.test.mjs
node --test tests/reconcile-implementation.test.mjs
```
On Windows, run from the repository checkout or provide absolute test paths. Explicitly disclose fixture-only runs and platform skips.

**Restart authority:** read root `HANDOFF.md`, `AGENTS.md`, this workflow, original `backlog.json`, and the evidence scorecard. Do not re-generate a separate task ledger or mutate `main` without full release authorization.
