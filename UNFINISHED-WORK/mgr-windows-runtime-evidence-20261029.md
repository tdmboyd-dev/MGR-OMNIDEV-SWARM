# OmniDev source-backed Windows regression evidence — 2026-10-29

**Provenance:** authorized connected Windows device "Time", local checkout `C:\Users\cool\OmniDev-Source-Import-20261028`, Git HEAD `26e230d052c45c1f42cb731ff095679497af045a` (baseline source). Node `v24.21.0`; pnpm `11.25.0` via Corepack. Dependencies installed using `corepack pnpm install --frozen-lockfile --ignore-scripts` (exit 0, 639 packages in lockfile set; no lifecycle scripts). `tsconfig.tsbuildinfo` generated locally by typecheck, not committed.

## Commands actually executed and observations

| Exact command (from repo root unless absolute) | Observed result | Important qualification |
| --- | --- | --- |
| `corepack pnpm exec tsc --noEmit` | exit 0 | TypeScript check on baseline checkout, not new integration branch |
| `node tests/prepare.mjs; node tests/runtime.mjs` | runtime `passed:79 failed:0` | SQLite fixtures; provider HTTP and GitHub operations stubbed; Docker unavailable |
| `node tests/specialist-areas.mjs` | `passed:52` for 48 domain flows, after nested 79 runtime checks | Named review and routing workflows, not external domain tool certification |
| `node tests/integration-fleet.mjs` | `passed:15`, after nested 79 runtime checks | 3-project fixture mapping, candidate splitting, bounded scheduling, no live connectivity |
| `node tests/acceptance.mjs` | `passed:31 failed:0` | SQLite-backed API route fixtures, stubbed GitHub network |
| `node tests/open-progress.mjs` | PASS | Progress rehydration / disconnect handling in VM fixture |
| `node tests/job-presentation.mjs` | PASS | Status and evidence-gap grouping |
| `node tests/engine-supervisor.mjs` | PASS | Actual child failure, rollback pointer and quarantine in temporary local fixture |
| `node tests/worker-cleanup.mjs` before correction | FAIL at line 6 on Windows | POSIX-only mocked `docker` PATH shim, not actual Docker failure |
| `node tests/worker-cleanup.mjs` after cross-platform fix | `passed:4`, exit 0 | Portable injected cleanup responses on Windows; genuine Docker unavailable |

**Do not add nested 79 checks repeatedly when reporting unique test totals.** These independent commands establish multiple scopes of local fixture acceptance; no end-to-end hosted live provider or isolated Docker worker was certified.

## What this disproves about the stale 174 count

The canonical `UNFINISHED-WORK/backlog.json` still records **174/174 `open`**, but there are working components for many areas: jobs, leases, account/provider state, encrypted credentials, 48 specialist workflows, three-project integration staging, snapshots, rollback, draft-PR adapter fixtures and supervision. Therefore **174 open statuses != 174 confirmed missing features**.

This evidence is **not** enough to automatically mark task AUTH-01, REL-02, RUN-* or any other parent fully done. Each parent has multiple acceptance bullets, including live provider/permission/host behavior not exercised here. Continue `mgr-acceptance-queue-20261029.json` by correlating each acceptance bullet with actual test plus provider readback. Preserve original historical status until all gates pass. If partially satisfied, attach this report as `TESTED_LOCAL_PARTIAL` evidence without closing the item.

## Current host capacity and blockers

`workerCapacity({requested:10})` on the Windows host returned `{slots:2,requested:10,cpuSlots:2,memorySlots:11,reserve:0.3}`; `docker --version` failed because Docker CLI is unavailable. The canonical `worker/runner.mjs` can poll persistently but **zero real Docker-isolated agents were activated**. Ten logical lanes can be queued; this host admits two simultaneous slots under existing policy once qualified.

## Remote branch parity

GitHub integration branch `mgr/code-monster-omnisight-20261028` contains additional proposed worker portability changes and backlog records not all present in the tested baseline checkout. **The 79/52/15/31 figures are tests of pinned baseline SHA `26e230d...`, not proof of the entire integration branch's CI health.** Full branch checkout + regression and protected Docker qualification remain release gates.
