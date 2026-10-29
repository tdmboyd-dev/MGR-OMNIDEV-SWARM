# OmniDev Swarm — Source-Grounded Upgrade Bible

**Date:** 2026-10-28. **Target:** existing `tdmboyd-dev/MGR-OMNIDEV-SWARM`; preserving current `main` source as baseline. This is an additive upgrade program, not a new competing brain.

## Mission

Retain every validated OmniDev feature; repair actual faults; replace heuristic-only source mapping with Code Monster intelligence and give the operator OmniSight GodView. Convert ad hoc short-lived sessions into recoverable full-job campaigns. Every change must update code, tests, historical task audit, new upgrade ledger, and verified before/after evidence together.

## Baseline implementation (observed)

React/Vinext/Cloudflare/D1 owner console, GitHub account and project imports, job leases, provider adapters, candidate validation, heuristic static findings, file receipts, simple graph and search, agents/specialists, Docker worker implementation, account companion and draft-PR/stored snapshot review flows. Public source contains tests and documented historical staging. No proof that all live account/worker/provider/release paths are production-certified. GitHub source baseline ref `26e230d052c45c1f42cb731ff095679497af045a`.

## BEFORE / AFTER / COMPONENT OWNERSHIP

| System | BEFORE | AFTER in OmniDev | Ownership contract |
|---|---|---|---|
| Import | Bounded GitHub/local snapshot | Pinned complete metadata inventory, incremental sync, indexed coverage | Code Monster ingests, OmniDev authorizes |
| Mapping | Text/regex file and limited graph | Semantic symbol/API/DB/CI/test evidence, confidence and freshness | Code Monster graph, OmniSight presents |
| Visuals | Workspace cards and small graph | GodView file tree, zoom levels, territory work board, time travel | OmniSight embedded SDK |
| Specialists | Role definitions, bounded planner | Qualified agents, safe work partition and measured outcomes | OmniDev policy, Monster scheduler |
| Jobs | Persistent retries and leases | Whole-goal campaigns, remaining-work ledger, crash recovery | Preserve OmniDev job IDs, versioned orchestration API |
| Fixes | Candidate snapshots and draft PR | Repro → patch → behavioral test → independent review → draft PR → release gate | Monster verification, OmniDev approval/publishing |
| Workers | Designed runner, not fully externally qualified | Attested isolated worker pool, actual restart/time/budget/secrets tests | OmniDev effect policy + Monster adapters |
| Actions | GitHub integration exists | Workflow parse, DAG/logs and failure-to-source diagnostics | Monster Actions adapter |
| REA | Optional Beast X-Ray concept | Qualified REA app/binary/runtime evidence integration | Beast X-Ray + Monster adapter |
| Memory | Persistent records and decision data | Event/evidence chain, versioned graph and verified recipe learning | Shared contract; no duplicate truth systems |
| Cross repo | Bounded inferred contracts | Verified producer/consumer API and migration coordination | Monster graph, OmniSight impact view |
| Modernization | Heuristic issues | Ranked codemods, deprecation elimination, risk/cost/benefit proof | Monster improvement engine |
| Security | Effect policy, review, rollback pieces | Independent review gates, permission containment, risk blast-radius | OmniDev owner approval stays canonical |
| Backlog | 174 original `open` historical tasks | Preserve originals + source-grounded reconciliation + new additive MGR tickets | `UNFINISHED-WORK/` canonical folder |

## 174-item truth and evidence discipline

- `backlog.json` **must remain the authoritative historical 174-parent ledger** until separately accepted acceptance gates prove a change. Do not blanket-close all items or treat a stale open flag as no code.
- `mgr-174-source-reconciliation.json/.md`: mechanically checks all 174 task IDs and cited source files; existing files are not functional proof. The output is preliminary and intentionally says `NOT_YET_REPRODUCED`.
- `mgr-trilogy-upgrades.json`: 18 additional requirement IDs `MGR-001`–`MGR-018` with independent statuses and acceptance. These are not silently folded into original backlog counts.
- Evidence for a close: exact code SHA, test command/result, integration provider read-back if applicable, prior/after behavior, remaining risk, reviewer, timestamp and rollback safety.
- Stale historical `REL-02` GitHub transfer status is a candidate for careful reclassification, **not** automatic full completion if its acceptance covers other behaviors. Keep recorded history.

## Change protocol (every PR)

1. Identify linked historical IDs and/or MGR upgrade IDs; preserve original requirements and source behavior.
2. Capture initial code/test conditions and record baseline SHA.
3. Implement focused change with fallback or compatibility plan; no uncontrolled removal of superseded code.
4. Run behavior, contract, security and negative tests. Label mocked vs live evidence explicitly.
5. Update all ledger references, docs, graph and tests in the same PR. If a required status is still open, say why.
6. Independent review or owner gate for secrets/permissions/destructive releases; never silently deploy.
7. Update after-state and evidence receipt only after tests and provider-side behavior are confirmed.

## Source fixes and immediate findings

### OD-LEDGER-01: repeated scan complexity

**Before:** `fileLedger` called `.find` on the entire previous ledger per file and `.filter` over findings per file, giving avoidable N×N or N×F growth. **After (implemented in current worktree):** indexed previous receipts, pre-grouped counts and changed-path Set; preserve previous receipt object when same content hash; invalidate changed data and keep `runtimeVerified:false`. Focused 3,000-file fixture validates same outcomes. True runtime/CI validation still separately required.

### OD-ANALYZER-01: heuristic limitations

**Before:** regex `function|class`, imports and issue heuristic signals. **After target:** continue cheap first-pass heuristics, but attach Code Monster AST/SCIP symbol evidence, confidence and coverage. Do not replace existing quick checks until semantic parity and latency tests pass.

### OD-CENSUS-01: bounded input

**Before:** small text snapshot import and bounded repo-audit classifier. **After target:** separate complete metadata census (including generated/binary/excluded counts), blob hashes and precise unsupported reasons; schedule AST indexes for every eligible file; never equate excluded bytes with inspected semantics.

### OD-WORKER-01 / OD-PR-01

**Before:** worker architecture and draft PR mechanisms have local/fixture evidence. **After target:** real authorized worker job with isolation tests, live GitHub draft PR read-back, negative security tests and recovery receipts; no production healing claims before proof.

## End-to-end release proof sequence

1. Full regression + TypeScript checking pass on clean snapshot.
2. Github OAuth/owner scope and model route are explicitly consented and live qualified.
3. Worker runs an induced failing test in an isolated host and cannot access forbidden network/secret paths.
4. Code Monster maps target commit; OmniSight displays actual file/agent map.
5. Three agents partition safe work; claims, conflicts and integration are recorded.
6. Candidate actually fixes failure; independent tests and UI/browser QA pass.
7. Create draft PR, verify it against provider, wait for review; production deployment requires separate approved gate.
8. Audit logs, rollback, ledger and graph sync have exact source SHAs; campaign ends only when all acceptance items have dispositions.

## Phases and priorities

Phase A: 174-task census + concrete ledger optimization + baseline tests. Phase B: credential/worker/PR live qualification and durable campaign integration. Phase C: Code Monster semantic graph and complete repository coverage. Phase D: early OmniSight file tree and territory UI. Phase E: X-Ray/Actions, modernization, cross-repo and release operations. Phase F: security, disaster recovery, accessibility, production certification. Safe parallel overlap is acceptable only with clear graph/contract dependencies.

## Runtime/cost/safety constraints

Local-first, no compulsory GPU or second expensive subscription. AI usage behind quotas, provider and privacy policies. GitHub OAuth must be scoped; raw provider credentials cannot enter repo artifacts. Hosted subscription entitlements must not be assumed to pay for autonomous API usage. Approval remains mandatory for credential/security/production/destructive changes. A permanent supervisor is needed to run jobs while no chat is open; an AI conversation alone is not a daemon.

## New features / novelty candidates

1. **Proof-carrying GodView:** every visible node, claim, runtime signal and suggested fix links to versioned evidence.
2. **Conflict-aware territory scheduler:** frontend/backend/verifier jobs get scoped leases and graph-dependent work allocations.
3. **No-silent-remainder execution:** full scoped worklist persists across model context exhaustion, UI disconnect and host restart.
4. **Time-travel blast radius:** before/after source/dependency/test graph and release risk on one timeline.
5. **Self-improvement with proof:** benchmark-backed codemods, cost reduction and verified rollback, not novelty hype.

Novelty is an engineering/commercial hypothesis, not patent clearance; research and measure against real alternatives.

## Remaining blockers (not hidden)

No current live GitHub creation for new projects without authenticated session; full 174 acceptance reclassification requires per-task actual execution, possible credentials/live provider approval; source changes have not been published to production. This document and additive registers record the work precisely for continuation.
