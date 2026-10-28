# MGR innovation approval — engineering requirements

**Owner approval:** Timebeunus Boyd, 2026-10-28. **Status:** approved to plan/build in the authorized project scope; **not** implemented, patent-cleared, safety-certified, or released unless individual acceptance gates pass. Do not confuse business enthusiasm with verified technical novelty.

## Source of truth and owners

- **Code Monster** owns algorithmic contracts, source evidence, graphs, work DAG, execution policy, learning and recovery.
- **OmniSight** owns visual layers, graph interactions, territorial/campaign displays, forensic replay and commercially licensable UI/SDK.
- **OmniDev** owns portfolio governance, account permissions, campaigns, release decisions and full operator workflow. It consumes the other two; no duplicate authoritative jobs/ledgers.
- Maintain original 174 OmniDev tasks intact. Add separate MGR-019..MGR-028 rows to additive upgrade registry. Shared features reference these IDs and their product-specific tickets.

## Approved features, before → after, proof and dependency

### MGR-019 — Proof-Carrying Code Atlas

**Before:** heuristic/source graph claims can appear without reproducible claim-by-claim proof. **After:** every visible node, issue, recommendation, repair, task assignment and risk links to immutable source SHA/file/line, parser/tool version, test receipt, confidence, privacy scope and invalidation timestamp. *Code Monster CM-903; OmniSight OS-801; OmniDev MGR-019.*

**Acceptance:** a test with incorrect/outdated/missing provenance is rejected or marked unverified, source ref read-back resolves correct pinned revision, and permission-limited viewers cannot inspect hidden evidence. Depends on Code Monster semantic graph and common evidence contract.

### MGR-020 — Counterfactual Repair Simulator

**Before:** engineers learn broad blast radius after editing or testing. **After:** construct a branch-sandbox hypothetical graph change, estimate impacted consumers/tests/migrations, identify unresolved assumptions and compare predicted vs actual effects after tests. This is an evidence-calibrated risk estimate, not a claim to know the future. *CM-904/OS-802.*

**Acceptance:** known API break fixtures correctly flag affected consumers; false positives/negatives are measured; no speculative simulation promotes code to production without real tests. Depends on graph/versioned contracts.

### MGR-021 — Change Quarantine and Staged Promotion

**Before:** patch candidates may be applied to snapshots or offered for review. **After:** risky changes enter isolated quarantine worktrees/workers, run security/compatibility/rollback tests, and advance through gated stages with auditable approval; failures automatically halt propagation. *CM-905/OS-803.*

**Acceptance:** deliberately risky migration cannot escape quarantine; rollback and controlled promotion tested. Depends on worker isolation and verification.

### MGR-022 — Repository Digital DNA

**Before:** simple path/file identity loses relationships after moves or symbol renames. **After:** stable provenance across structural edits, public API migrations and package splits using similarity, symbol lineage and commit/AST evidence; ambiguous matches remain uncertain. *CM-906/OS-804.*

**Acceptance:** rename/move fixtures preserve historical lineage without conflating unrelated similar symbols; replay evidence identifies source commit. Depends on versioned graph and code history.

### MGR-023 — Autonomous Engineering Economics

**Before:** specialist scheduling mainly uses concurrency and provider options. **After:** evaluate expected verified progress per CPU-minute/model dollar and risk, route tasks economically, cancel low-value branches while preserving receipts, enforce owner budget limits. *CM-907/OS-805.*

**Acceptance:** identical benchmark campaigns consume less measured spend than baseline without lower verified quality; no hidden charges or unauthorized model switch. Depends on job/event metering and model routing.

### MGR-024 — Evidence Convergence / Totality Meter

**Before:** early audit response or partial graph can look like complete understanding. **After:** display exact categories of indexed, metadata-only, excluded, unknown, failed, untested, blocked and verified nodes/tasks; reschedule all safe unresolved work until campaign completion. *CM-908/OS-806.*

**Acceptance:** induced crashes, file exclusions and test errors always leave visible remainder; finite campaign reaches verified terminal states without reprompt. Depends on full census and durable campaign state.

### MGR-025 — Cross-Repo Immune Repair Memory

**Before:** lessons and findings are stored but may not propagate safely. **After:** verified failure signatures create scoped regression test recipes for related repos, with applicability proofs, version compatibility and expiration; no blind patch propagation. *CM-909/OS-807.*

**Acceptance:** shared regression caught in eligible repo, unrelated repo untouched, stale recipe expires and failure to transfer is documented. Depends on cross-repo graph and independent testing.

### MGR-026 — Operator Trust Dial

**Before:** global effect control and review gates exist, but rich per-repo/per-risk autonomy lacks proof. **After:** per-repository policies set read-only, propose, safe-auto-fix, test-only, draft-PR and controlled release authority with risk/secret/destructive overrides. *CM-910/OS-808.*

**Acceptance:** negative permission tests prove a lower-trust campaign cannot gain higher authority through a tool/model; policy changes are audited. Depends on authenticated effect-policy and scoped workers.

### MGR-027 — GodView Forensic Time Machine

**Before:** limited historical graph/decision views. **After:** reconstruct exact code/CI/agent-claim state at commit/time, compare before/after, show who changed what and which acceptance gates passed or failed; privacy/retention preserved. *CM-911/OS-809.*

**Acceptance:** reproducible replay after process restart; impossible or unauthorized historical claims are visibly rejected. Depends on temporal graph and event journal.

### MGR-028 — Semantic Territory Bargaining

**Before:** simple file/path partition can over-serialize or allow hidden contract clashes. **After:** use graph cuts, API ownership, generated code, migrations, tests and work-intent forecasts to propose efficient nonoverlapping territories, negotiate shared-contract first changes, then lease tasks atomically. *CM-912/OS-810.*

**Acceptance:** frontend/backend/verifier fixture executes safe independent work concurrently, detects shared schema conflict, and produces reproducible integrated passing candidate. Depends on semantic graph and durable atomic claim service.

## Research and originality gate

Every feature needs an updated research packet: current competitor/prior-art evidence, standards, source licenses, model/runtime cost, failure modes, security/privacy, native adaptation, user test, objective benchmark and deployment viability. No marketing claim of “first ever,” “100x” or superior accuracy without substantiated measurements. Study external systems without copying restricted code.

## Execution rule

Approved features are queued for implementation but must respect dependency order and existing authorization. No deletion of proven OmniDev features. Every status change requires source commit, test command, failure tests, rollback notes and an evidence receipt. An unfinished feature stays visibly unfinished across sessions.
