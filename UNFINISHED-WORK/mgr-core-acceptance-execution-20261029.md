# Core behavior acceptance and repairs — October 29, 2026

This wave reproduced original acceptance clauses against the existing implementation and repaired five concrete defects. The complete clause mapping, exact wording, source-file hashes, test commands, raw-output hashes and remaining limits are in `mgr-core-acceptance-execution-20261029.json`. Raw logs are under `evidence/core-acceptance-20261029/`.

## Repairs actually executed

| Defect | Repair | Verification |
|---|---|---|
| Exhausted worker leases discarded previously saved candidates, specialist reviews and test output; recovery had no durable event. | Preserve existing result data. Commit job state, agent state and a recovery event atomically. Compare the observed lease/result before updating. | Retry resumes work; exhaustion retains evidence; concurrent recovery has one event; a newer result is preserved; an audit-storage failure rolls everything back. |
| Integration graph snapshots re-created deleted project nodes and stale project names. | Resolve integration participants from current project records. | Delete and rename actual stored projects, then inspect graph nodes and edges. |
| Restore accepted jobs belonging to non-project records, dangling project links, malformed JSON data and invalid retry counts. | Validate object shape and typed references before any restore writes. Preserve the existing audit-child reference model. | Reject malformed archives with an unchanged store; restore exact records into a fresh SQLite database; keep imported jobs canceled and credentials absent; simultaneous restores have one winner. |
| A delayed provider response could mark replacement credentials verified; named provider verification returned legacy-provider metadata. | Compare-and-swap the exact encrypted configuration with a unique verification identity. Return status for the selected provider. | Replace, disconnect, replace-back and concurrent completion races; named-provider response; missing/rotated vault-key recovery without credential disclosure. |
| Project deletion and snapshot clearing removed audit parents but left nested file/tree artifacts, making future backups invalid. | Delete the selected project's audit children before their parents inside a guarded transaction. | Two additional cases prove deletion and snapshot clearing preserve another project's artifacts and leave a valid backup. |

The stronger archive validation also exposed a platform test fixture that used nonexistent project IDs for reservations. The fixture now creates real project records; the validation rule was kept.

## Before and after

The original implementation was reconstructed from Git commit `c44818c5017d15139c294e971346b1152ed24ba1` in a separate temporary checkout. The same new behavior tests ran there and against the repaired working source. The current source was not reverted to produce the baseline.

| New suite | Original implementation | Repaired implementation |
|---|---:|---:|
| Intelligence and archive integrity | 2 passed, 6 failed | 8 passed, 0 failed |
| Job recovery integrity | 2 passed, 4 failed | 6 passed, 0 failed |
| Provider verification races | 2 passed, 5 failed | 7 passed, 0 failed |
| **New behavior cases** | **6 passed, 15 failed** | **21 passed, 0 failed** |

These are 21 test cases around four root-cause repairs, not 21 completed parent tasks. The source-file manifest binds the repaired working files; the root workflow supplies final commit-bound evidence after publication.

Final integration review exposed the fifth defect: orphan audit artifacts after legitimate cleanup. Two supplementary cleanup cases initially failed and then passed after repair. The current new suites therefore contain **23 passing cases**: intelligence/cleanup 10, recovery 6, and provider verification 7. The supplemental logs retain their separate before/after counts, rather than retroactively changing the original 21-case baseline.

The existing runtime suite passed 79 checks; platform passed 80 of its own checks; acceptance passed 31; provider/brain routing passed 19; integration fleet passed 15; repository completion passed 13. Project-control and real supervisor rollback scripts also exited successfully. Several scripts execute the runtime suite internally, so these counters must not be summed as unique tests. TypeScript compilation passed.

## Clause-level disposition

Twenty original clauses across fourteen parent IDs were examined. The following five original clauses have fully reproduced local contract behavior in this report:

- `RUN-03/AC-01`: concurrent operation claims and stale-result protection.
- `RUN-03/AC-02`: correct retry/exhaustion states and auditable recovery.
- `DEV-01/AC-02`: unsupported edits and stale source baselines reject recoverably.
- `QA-02/AC-01`: real behavior regressions produce meaningful failures, then pass after repair.
- `QA-02/AC-02`: snapshot integrity remains distinct from application execution evidence.

Fifteen other clauses have useful partial evidence with explicit remaining requirements in the JSON. In particular, local SQLite restoration does not certify external artifacts or deployed disaster recovery. API-provider key recovery does not certify every OAuth provider. The owner-private graph does not supply multi-tenant authorization.

## Reproduction

Run from the repository root after installing the pinned dependencies:

```sh
node tests/prepare.mjs
node tests/intelligence-integrity.mjs
node tests/job-recovery-integrity.mjs
node tests/provider-verification-race.mjs
node tests/runtime.mjs
node tests/platform.mjs
node tests/brains.mjs
node node_modules/typescript/bin/tsc --noEmit
```

Runtime tests spawn generated Node tests, and the supervisor test spawns a real child process and uses loopback HTTP. Their execution environment must permit those operations. Early attempts made inside a host sandbox that prevented child execution were excluded from passing evidence and were rerun with authorized child-process execution.

No live provider inference, Docker-host qualification, production deployment or automatic parent-task closure is claimed by this report. Exact local clause evidence may be attached to the canonical register; full parent promotion continues to require every original clause and the configured independent evidence/owner gate.
