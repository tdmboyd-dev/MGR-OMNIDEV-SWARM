# P0 + 50 acceptance wave — executed evidence and blockers

**Recorded:** October 29, 2026. This is **not** a 100%-complete release report.

**Scope:** 30 P0 parents plus 50 additional parents, 80 distinct historical IDs / 192 original acceptance criteria. All remain individually uncertified after this wave. The canonical backlog is 173 open, one implemented_unverified; no bulk status mutation.

## Executed checks

- The allowlisted fixture runner completed 12/12 profiles with zero-exit on pinned clean source commit `76a5d17b40d64d2574703bb0bec4a11769f6c7e3`. Profiles: `parallel`, `automatic`, `jobs`, `project`, `pipeline`, `review`, `generation`, `acceptance`, `runtime`, `integration`, `supervisor`, `cleanup`.
- Each result records argv, output digest, bounded byte count and explicit `local-fixture-only-not-parent-acceptance` qualification. No fixture receipt is an independently signed or hosted production attestation.
- Additional direct tests after restoring the public Ed25519 verification key: `tests/engine-update.mjs` and `tests/generation-timeout.mjs` both passed on Windows; `tests/engine-public-key-provenance.test.mjs` passed 3/3.
- Source packaging repair: global `*.pem` ignore had excluded the public engine verification PEM. Restored only `companion/engine/public-key.pem` from the checked-in signed release payload; private keys remain ignored. Release signature validates with that key, but independent trust-root provenance remains a separate release gate.

## All 30 P0 parents — current evidence disposition

| Task | Acceptance clauses | Evidence route(s) | Certification |
|---|---:|---|---|
| AUTH-01 | 2 | provider-access | NOT CERTIFIED |
| AUTH-02 | 3 | provider-access | NOT CERTIFIED |
| RUN-01 | 2 | isolated-host, provider-access | NOT CERTIFIED |
| RUN-02 | 2 | provider-access, local-runtime | NOT CERTIFIED |
| RUN-03 | 2 | local-runtime | NOT CERTIFIED |
| DEV-02 | 2 | local-runtime | NOT CERTIFIED |
| DATA-03 | 2 | manual-evidence, provider-access | NOT CERTIFIED |
| SEC-02 | 2 | provider-access, manual-evidence | NOT CERTIFIED |
| SEC-03 | 2 | manual-evidence, release-security | NOT CERTIFIED |
| QA-01 | 2 | browser-qa, provider-access | NOT CERTIFIED |
| QA-02 | 2 | local-runtime, manual-evidence | NOT CERTIFIED |
| OPS-01 | 2 | provider-access, manual-evidence | NOT CERTIFIED |
| OPS-02 | 2 | local-runtime, manual-evidence | NOT CERTIFIED |
| OPS-03 | 2 | provider-access, release-security | NOT CERTIFIED |
| UX-01 | 2 | local-runtime, browser-qa | NOT CERTIFIED |
| UX-02 | 2 | browser-qa | NOT CERTIFIED |
| INT-01 | 2 | integration-verification, provider-access | NOT CERTIFIED |
| AUD-02 | 2 | manual-evidence | NOT CERTIFIED |
| AUD-04 | 3 | isolated-host, manual-evidence, provider-access | NOT CERTIFIED |
| AUD-07 | 2 | release-security, manual-evidence | NOT CERTIFIED |
| AUD-12 | 3 | release-security, manual-evidence, local-runtime | NOT CERTIFIED |
| AUD-24 | 2 | release-security, manual-evidence | NOT CERTIFIED |
| AUD-25 | 2 | release-security, manual-evidence | NOT CERTIFIED |
| AUD-26 | 2 | isolated-host, manual-evidence | NOT CERTIFIED |
| V2-01 | 2 | release-security, manual-evidence | NOT CERTIFIED |
| V2-02 | 2 | release-security, manual-evidence | NOT CERTIFIED |
| V2-03 | 2 | local-runtime, manual-evidence | NOT CERTIFIED |
| V2-07 | 2 | manual-evidence | NOT CERTIFIED |
| V2-08 | 2 | local-runtime, manual-evidence | NOT CERTIFIED |
| V2-16 | 2 | local-runtime, manual-evidence | NOT CERTIFIED |

## Additional 50 parent IDs

AUTH-03, AUTH-04, DEV-01, DEV-03, GRAPH-01, GRAPH-02, GAP-01, DATA-01, DATA-02, SEC-01, QA-03, OPS-04, TWIN-01, TWIN-02, FUT-01, BIZ-01, BIZ-02, EXEC-01, UX-03, LEGAL-01, REL-01, REL-02, REL-03, CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-06, CONN-07, CONN-08, CONN-09, CONN-10, CONN-11, CONN-12, CONN-13, CONN-14, CONN-15, CONN-16, CONN-17, CONN-18, CONN-19, CONN-20, CONN-21, CONN-22, CONN-23, CONN-24, CONN-25, CONN-26, CONN-27

## 192 acceptance clauses routed

- provider-access: 48 clauses
- isolated-host: 4 clauses
- local-runtime: 72 clauses
- manual-evidence: 51 clauses
- release-security: 11 clauses
- browser-qa: 4 clauses
- integration-verification: 2 clauses

These categories are heuristics for execution assignment, not test results. Some statements require several simultaneous gates. The first 80-task artifact retains each original clause and its verification status.

## Outstanding external gates

- Real owner-authorized OmniDev GitHub OAuth, revoke/refresh, and external draft-PR lifecycle, not only ChatGPT's GitHub connector.
- Real model/provider inference with explicit entitlement and budget.
- Docker isolation on a qualified worker host, verified cleanup and hosted service credentials. Current connected Windows host has Docker CLI unavailable and CPU policy admits only two slots after qualification.
- Hosted browser/accessibility, external staging/rollback, multi-tenant security, production service tests.
- Independent test signer/key registration and cryptographic verification of per-criterion evidence.

**Do not turn a parent task green from these fixture suites.** Use `UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json` and its validator for criterion-by-criterion decisions.

## Artifacts

- `UNFINISHED-WORK/mgr-80-parent-wave-20261029.json`
- `UNFINISHED-WORK/mgr-80-wave-routed-20261029.json`
- `UNFINISHED-WORK/mgr-p0-expanded-evidence-repaired-20261029.json`
- `scripts/select-acceptance-wave.mjs`, `scripts/route-acceptance-work.mjs`, `scripts/run-fixture-evidence.mjs`
- `tests/select-acceptance-wave.test.mjs`, `tests/route-acceptance-work.test.mjs`, `tests/run-fixture-evidence.test.mjs`, `tests/engine-public-key-provenance.test.mjs`
