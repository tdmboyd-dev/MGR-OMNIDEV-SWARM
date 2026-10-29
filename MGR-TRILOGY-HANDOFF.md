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
