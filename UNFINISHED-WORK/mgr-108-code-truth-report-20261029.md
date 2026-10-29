# OmniDev 174-task code reconciliation — executed wave 2026-10-29

**Purpose:** Determine what was already built from the original plan, check actual source/tests, repair code or metadata when needed, and close only verified acceptance criteria. The 174 records are original *product requirements*, not 174 uniform missing bugs.

## Results supported by execution

| Measure | Observed |
|---|---:|
| Original backlog parent IDs conserved | 174 |
| Parent tasks linked to committed source | 108 |
| Referenced Git-object source paths hashed and present | 276 of 276 |
| Specialist-domain tasks corrected from stale `open` to `implemented_unverified` | 47 |
| Total current implemented-but-not-fully-verified statuses (including GitHub import) | 48 |
| Recorded open parent tasks | 126 |
| Specialist suite | 52 checks passing, across 48 roles |
| Underlying runtime suite executed by specialist test | 79 checks passing |
| Historical Sites-to-GitHub import inventory | 516/516 SHA-256 byte matches at original GitHub import commit |
| Imported source high-confidence credential scan | 516 files / 9,199,629 bytes, 0 recognized matches |
| Acceptance criterion independently checked in this wave | REL-02 / AC-01 (pinned exact GitHub source transfer) |
| Other REL-02 criterion | BLOCKED pending comprehensive security and non-target-repo scope review |
| Fully certified parent tasks from this wave | 0 |

## Code verified and adjusted

1. `lib/specialists.ts` already defines checks, proposed change capabilities and bounded permissions for 48 specialist roles. `tests/specialist-areas.mjs` exercises SQLite job admission, brain selection, source-check contract and cancellation for all 48, with **52 checks passing**. Exactly 47 `DOM-01…DOM-47` original parent tasks map to named roles. All 47 now show `implemented_unverified` instead of the historically stale description suggesting that no specialist workflow exists. They still need representative authorized domain-tool output, provider receipts, limitations and budget review. The 48th role, Integration Engineering, is not an extra DOM parent.
2. `scripts/reconcile-implementation.mjs` now hashes **pinned committed Git objects**, not editable working-tree files. This corrected a real provenance weakness. `tests/reconcile-implementation.test.mjs` **2/2 passed**, including an uncommitted-tamper negative control.
3. `scripts/verify-source-import.mjs` checks all 516 original Sites source manifest hashes at original GitHub commit `26e230d052c45c1f42cb731ff095679497af045a`; **516/516 matched**. `tests/verify-source-import.test.mjs` **3/3 passed**, after fixing the security filename rule to catch `.env.production`.
4. `scripts/scan-import-secrets.mjs` scanned all imported source files for explicit high-confidence credential formats. **0 matches** across 9,199,629 bytes. `tests/scan-import-secrets.test.mjs` **2/2 passed**. This does not prove zero secrets of any arbitrary format.
5. The canonical 174-task acceptance register is synchronized. Running its validator after the REL-02 evidence update returned `valid:true, totalParents:174, totalCriteria:441, verifiedCriteria:1, readyForCertification:0, errors:[]`.

## Provenance files

- `UNFINISHED-WORK/mgr-committed-code-reconciliation-20261029.json`: per-task, per-path Git commit, SHA-256, size and existence.
- `UNFINISHED-WORK/174-IMPLEMENTATION-INDEX.md`: every original ID, grouped by planning area, with current implementation status.
- `evidence/github-source-import.json`: original 516-file source import inventory.
- `UNFINISHED-WORK/mgr-original-source-secret-audit-20261029.json`: limited high-confidence credential-scan outcome.
- `UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json`: each original acceptance criterion and its proof status.
- `UNFINISHED-WORK/backlog.json`: canonical task statuses, original acceptance wording and actual source path links.

## Remaining requirements — no false close

- A functioning specialist workflow ≠ domain-specific authorized external tool certification.
- A Git blob existing ≠ code is correct, tested, integrated and deployable.
- A successful broad test suite with mock provider HTTP ≠ live provider authorization.
- The original source import is byte-verified, but an exhaustive secret scan and proof about unrelated repository modifications remain outstanding.
- The next engineering wave must take the implemented-but-unverified tasks through their **exact original criteria**, execute repairs, and then mark parent `completed_verified` only with complete acceptance evidence. Do not reopen settled inventory work.
