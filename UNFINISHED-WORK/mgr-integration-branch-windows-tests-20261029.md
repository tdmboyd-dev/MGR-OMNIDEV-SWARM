# MGR OmniDev integration-branch Windows test evidence — 2026-10-29

Source branch `mgr/code-monster-omnisight-20261028`; tested isolated worktree `C:\Users\cool\OmniDev-Integration-Review-20261029`; pinned commit `fa739a0fca0e949b71c665abd08b1997b5d3b513` at test start. No changes to main.

- `corepack pnpm install --frozen-lockfile --ignore-scripts --store-dir ...` succeeded with pnpm 11.25.0. First `--offline` attempt failed because policy metadata was not cached (`ERR_PNPM_NO_OFFLINE_META`), not because of source changes. Retried online successfully.
- `corepack pnpm exec tsc --noEmit`: exit 0.
- `node tests/prepare.mjs; node tests/runtime.mjs`: 79 passed, 0 failed.
- `node tests/worker-cleanup.mjs`: four Windows portability assertions passed, exit 0. Actual Docker absent; no isolation certification.
- `node --test tests/mgr-ten-slot-fleet.test.mjs tests/mgr-portable-cleanup.test.mjs tests/audit-174.test.mjs`: 11 passed, 0 failed.
- `node tests/acceptance.mjs`: 31 passed, 0 failed.
- `node tests/integration-fleet.mjs`: 15 passed (and internally repeats 79 runtime checks). Avoid double counting.
- Existing worker fleet allows ten slots if hardware supports; connected Windows machine currently admits only two by CPU policy and Docker CLI is unavailable.

**Acceptance distinction:** these are real local fixture validations on the *integration branch*. Network provider HTTP, real Docker workloads, hosted service identity and live source-to-PR repair remain unqualified. This is not release certification.

**Backlog:** 174 parent IDs retained. REL-02 was reclassified from historical open to implemented_unverified based on real GitHub source transfer read-back; current split 173 open + 1 implemented_unverified. 28 additive MGR items retained. Consult `mgr-historical-truth-20261029.json` and original `backlog.json`, not historical summaries alone.
