# MGR OmniDev Swarm — connected trilogy handoff (2026-10-29)
Status: **NOT production complete**. This file is additive. Read `UNFINISHED-WORK/README.md`, `UNFINISHED-WORK/backlog.json`, and `UNFINISHED-WORK/mgr-trilogy-upgrades.json` before work.
## Canonical scope
- Preserve all original 174 parent IDs and historical statuses; do not infer completion from a file's existence.
- Preserve 28 separate MGR-001 through MGR-028 upgrades.
- Code Monster owns pinned Git census, evidence, candidate-write protection, and task scheduling.
- OmniSight owns read-only, permission-scoped visualization.
- OmniDev owns campaign governance, owner approvals, job/account policy, provider and worker orchestration.
## Live source links
- Code Monster private branch: `tdmboyd-dev/MGR-CODE-MONSTER` / `mgr/receipt-admission-20261029`; at `0b2e68913e2c86dbc60a5fbd1ff373bb02ea1e19`, added pure DAG planner + 8 focused tests. This is NOT 10 live agents.
- OmniSight private branch: `tdmboyd-dev/MGR-OMNISIGHT` / `mgr/ten-lane-handoff-20261029`.
## Current proven and open
Previously: file-ledger indexing optimized, isolated 3k-file fixture; 174/174 IDs mechanically accounted but not individually acceptance-certified. Code Monster has a limited one-task local execution flow, receipt gate research and new pure planner; this is NOT an OmniDev runtime integration.
### Must-do engineering next
1. Qualify trusted signed test-runner and mandatory `campaign-v0` admission; prohibit the older Boolean-only path for newly created campaigns without a verified migration contract.
2. Add adapter against actual `TerritoryLeases.acquire()` and `release()`; do not invent an `acquireAll()` API or claim atomic multi-cell behavior.
3. Durable three-agent scheduling and real combined Git commit verification, with retry/quarantine and source-anchored receipts.
4. Expose versioned, read-only, authorized campaign graph to OmniSight; unknown edges stay unknown.
5. Rerun full OmniDev TypeScript/runtime suite and reconcile each original 174 acceptance case, plus the 28 upgrades. Preserve `REL-02` history and any failed runtime fixture.
6. Run cross-repo CI and GitHub read-back. Deploy only after owner-gated release certification.
## Workflow
Read -> audit source -> capture baseline -> implement -> test including negative cases -> reconcile ledger/docs -> commit/push to dedicated review branch -> verify remote -> update handoff. No false green, no automatic production merge.
## Constraints
Ten work lanes are tracked, but no actual ten-worker deployment is certified. Paid provider calls require explicit campaign budget; secrets remain outside repo. Earlier DeepSeek `20261029-084734` is untrusted review input; its source-dependent conjectures must be checked against the real interface.

## Wave October 29, 2026 — 10-slot queue, backlog triage and DevMapGod decision
- Added `worker/campaign-workers.mjs` plus `tests/campaign-workers.test.mjs`: bounded one-host queue with up to ten actual subprocess slots, fixed allowlisted command profiles, persisted events, retries (max 3), quarantine, and resume after interrupted jobs. **Seven local tests passed** under Node 22.16.0. This is NOT ten AI model agents, container isolation, or a persistent unattended service yet; don't advertise as such.
- Added `scripts/audit-174.mjs` plus `tests/audit-174.test.mjs`: mechanical 174+28 conservation and evidence-triage with **three additional local tests passed**. All 174 historical statuses remain `open` in canonical backlog. Only 11 explicitly say `partial-tested-local`, 60 include source references, 14 include evidence references, and 163 have no `implementation_state`. **These are flags, not accepted task completions.** No mass close.
- DevMapGod is a cross-product workflow: Code Monster full Git inventory/evidence and batch repair engine, OmniSight visualization, OmniDev orchestration. No fourth repository. Batch changes must be grouped by safe transform, staged into candidate commits, and proven against appropriate tests; unproven dead code is not deletable automatically. DeepSeek 20261029-094504 is concept research, not source/test evidence; its unsupported market superiority and time/cost estimates were not adopted.
- Next P0: attach a qualified always-on supervisor, actual agent model/provider adapters with spend limits, controlled filesystem sandbox and isolation, owner approval receipts, all 174 acceptance reproductions, whole repo suite, three-product contract tests. Branch changes remain unmerged. Never silently publish or deploy.

## 2026-10-29 follow-up — existing fleet identified, duplicate removed, true blocker
- Existing canonical production-intended worker is `worker/runner.mjs` plus `worker/fleet.mjs`, `worker/application-profile.mjs` and `worker/doctor.mjs`. `worker/runner.mjs` already polls `/api/worker` continuously (default), and `OMNI_WORKER_SLOTS` supports 1–10 admitted by real CPU/memory limits. It uses pinned Docker image digests, restricted network, read-only mounts, no privileges, and verifies container cleanup. **This is not a newly created capability.**
- Removed redundant unsandboxed `worker/campaign-workers.mjs` and its tests before merge. Keep only the canonical Docker-backed fleet. Added `tests/mgr-ten-slot-fleet.test.mjs` to test the original fleet, **5/5 synthetic local tests passed** (concurrency 10, resource limit, failure quarantine). This does not mean host Docker passed.
- Connected Windows machine `Time` reports Node 24.21.0, but `docker` command unavailable; isolated worker host **not activated**. `pnpm` also not on PATH. Manual `tests/worker-cleanup.mjs` failed on Windows at assertion line 6 because its simulated `docker` script is a POSIX executable fixture and its PATH prepend uses a Unix separator; that is a cross-platform test-fixture blocker, not proof the production cleanup logic failed.
- Historical backlog new machine-readable `UNFINISHED-WORK/mgr-historical-truth-20261029.json`: **174/174 open historically**, 11 entries `partial-tested-local`, 60 with explicit source refs, 14 with evidence refs, 163 without `implementation_state`. This is preliminary triage; do not mark 174 truly missing or 11 fully verified. `scripts/audit-174.mjs` and `tests/audit-174.test.mjs` preserve 174+28, **3/3 isolated tests**.
- DevMapGod: Code Monster private branch `src/devmapgod.mjs`, **7/7 isolated tests**, SHA-bound conservative classification and risk-aware batch proposals. OmniSight private branch `lib/devmapgod-projection.mjs`, **3/3 isolated tests** validating source provenance and scope filtering. **No live UI endpoint and no batch execution yet.** OmniDev remains controlling job/owner approval plane. No fourth repo.
- Next actual host activation: install/qualify Docker on an owner-approved dedicated host; pre-pull pinned worker image; provision protected `OMNI_SITE_URL`, `OMNI_WORKER_TOKEN`, `OMNI_SITE_SERVICE_TOKEN` and a pinned `OMNI_WORKER_IMAGE`; run `node worker/doctor.mjs`, then real Docker smoke tests; only after that set worker slots up to 10. Do not submit model calls absent an explicit budget. Never use a fake container output as proof.
- Re-run source acceptance independently for each historical task before any status change, and correct POSIX-only worker cleanup fixture for Windows without weakening Linux coverage. `MGR-001` remains IN_PROGRESS.
