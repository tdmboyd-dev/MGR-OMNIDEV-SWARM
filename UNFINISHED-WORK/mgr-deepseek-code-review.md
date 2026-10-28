# DeepSeek external review — technical adjudication, 2026-10-28

Source: Owner-provided `Pasted text(3).txt` (528 lines), reviewed against the uploaded 126-page OmniDev PDF, original MGR master blueprint and current GitHub source. **Do not treat an external AI's claims as tested evidence.**

## Executive verdict

DeepSeek correctly identified the difference between a **plan** and working software, the need to reconcile the 174 recorded open parents, the bounded repo import limits, the lack of proven continuous live worker/PR chain, and the importance of a cheap deterministic indexer plus conflict-safe coordination. Its proposed sequencing and interface concepts are valuable.

But the supplied three TypeScript snippets are **not production-ready**, and some statements were overconfident. In particular, its territory planner computes *proposed claims* but falsely labels them granted, allows overlap, ignores sharedSymbols/migrationLocks, cannot safely map multi-task agents, and can mishandle dependency order. Its indexer can silently omit skipped trees, leave stale indexed entries after subsequent scans, follow unsafe assumptions about symlinks/path formats, ignore errors on directories, and cannot guarantee a complete census. Its event contract is only interfaces, not a persisted transactional ledger. Claims of unique worldwide novelty, competitor feature absence, fixed timeline, or token pricing are not established without verifiable current research and measurements.

## Decision by contribution

| DeepSeek element | Verdict | MGR action |
|---|---|---|
| Review that artifacts were blueprints | Correct at that point | Build runnable local foundation and retain honest status |
| 174 historical `open` != no implementation | Correct | Reconcile with current GitHub source; preserve originals + separate verified state |
| REL-02 GitHub transfer may be stale | Correct candidate | Flag; do not blanket-complete its other acceptance gates |
| File-ledger O(N²)/O(N×findings) | Correct, confirmed code | Optimize OmniDev ledger and add 3,000-file fixture |
| Repo import size cap and heuristics | Correct baseline finding | Separate full manifest from semantic coverage; add incremental parse provider |
| Runtime/PR lack real proof | Correctly cautionary | Treat as qualification blocker, not assume API broken |
| $0–30 budget should limit concurrent LLMs | Direction sound | Enforce budgets; cost claims need model/rate/usage verification |
| Novel features table | Useful differentiation hypotheses | Do not call patent-cleared or assert competitors lack any feature without source validation |
| Weeks 1–13 schedule | Unsupported estimate | Treat as illustration; use acceptance-based waves |
| EventEnvelope / EvidenceLedger interfaces | Useful schema prototype | Adopt concepts; add deterministic hash, idempotency, validation, persistent transactional backing before production |
| Territory planner snippet | **Reject unchanged** | Implement deterministic task-based conflict graph; proposals are not granted locks; production needs atomic leases |
| CAS indexer snippet | **Reject unchanged** | Implement census that reports excluded subtrees, metadata-only files, symlinks and errors; fresh scan+diff; production needs concurrency/streaming/persistence |
| Recommendation to ask five questions | Mostly already resolved by Time | Two new repos, 2D-first OmniSight, no specific paid model required before budget/proof; user authorized direct work |

## Detailed review of supplied code

### `contracts/events.ts`

Positive: typed event kinds, evidence provenance fields, causation/correlation IDs, per-stream sequence, idempotency, and chain concept. Risks: interface alone cannot enforce append-only, clock trust, atomic sequence, hash consistency, structured payload schema, signature/auth or replay ordering. The stated hash `sha256(prevHash + canonical(payload))` excludes event metadata; mutable evidence/actor fields could go undetected. Generic `Omit` envelope allows caller-chosen actor/product without authenticated binding. `confidence` needs range/schema validation; URIs may leak sensitive paths/keys. **Disposition: ADAPT contract, not adopt as runnable implementation.** Code Monster now includes a tested single-writer reference ledger with full-envelope hash and idempotency; distributed/persistent transaction gate remains open.

### `territory/planner.ts`

Positive: read/write cells, intent model, conflict edges, DAG and coverage concepts. Serious faults:

1. Grants all reads/writes upfront even when conflicts exist; a graph edge isn't an enforceable lock.
2. Resolves conflict by `agents[0]`/`agents[1]`, not the task pair; loses tasks where an agent owns multiple jobs.
3. Does not consume `sharedSymbols` or `migrationLocks` inputs; does not validate cell IDs, TTL, uniqueness or dependencies.
4. No supplied task dependencies are modeled, no cycle detection, no actual topological scheduling.
5. Reader-writer conflicts are overconservative even when readers have immutable commit snapshots, while migration locks can be underconservative.
6. `Date.now()` creates nondeterministic plans, expiry races, and no heartbeat/epoch/atomic compare-and-swap enforcement.
7. Coverages count claims, not true inspected/indexed source coverage; excluded array always empty.

**Disposition: REWRITE.** Code Monster reference planner now computes task-level conflict DAG, validates unknown cells/cycles, retains proposal-only claims and has tests. Real persistence/atomic leases still required.

### `cas/indexer.ts`

Positive: SHA-256, file classification, change frontier, native CPU index, metadata-only concept. Major faults:

1. `walk()` silently skips `.git`, vendors, build trees; census doesn't count those skipped subtrees.
2. Non-file/symlink entries are neither counted nor reported; inaccessible directories are swallowed.
3. `this.entries` is reused without clearing old file paths between indexing passes, giving false unchanged/deletion results.
4. Metadata-only binary/vendor entries aren't represented in map; diff cannot fully account for their changing status.
5. Paths use native OS separators but classification looks for `/` on Windows, causing missed filters.
6. Special/large file rules suppress hashes; 'total' mixes only scanned files, not complete inventory, and unsupported count is unused.
7. Repeated sequential `readFile` loads whole content into memory; no streaming, concurrency control, size-bound parser tier or durable CAS.
8. Security/accuracy need symlink policy, byte encoding, file mode, gitignore policy, case collisions, LFS/submodule, binary detection, ignored directory census and commit pinning.

**Disposition: REWRITE.** Code Monster's tested local census now records excluded directories, symlinks, metadata-only and failures; fresh snapshots and changed/deleted frontier. Production-grade Git/indexing and full hidden subtree accounting require further work.

## Features worth exploring beyond both proposals

- **Proof-carrying task territory:** each assignment includes exact source SHA, graph dependencies, exclusive write lease, owner and test receipt, with independent audit.
- **Time-travel counterfactual repair planner:** simulate before/after dependency graph and likely blast radius *before* agents edit; calibrate with historical outcomes.
- **Change quarantine and staged promotion:** high-risk edits build in disposable branches, verify contracts, stage, and only propagate when reliability gates pass.
- **Repository digital DNA:** stable identity for symbols/packages across renames, moves and API migrations, maintaining provenance rather than losing history.
- **Autonomous mission economy:** budget AI calls by predicted marginal verified impact, not flat agent count; kill low-value branches with preserved evidence.
- **Evidence convergence meter:** measure unknown/unindexed/unverified parts, confidence and remaining-work frontier; continue until the totality contract is satisfied.
- **Cross-repo immune memory:** regression patterns discovered once create scoped tests for dependent repos, with expiration and evidence of applicability.
- **Operator trust dial:** adjustable automatic-change authority per repo/risk class with negative permission tests and enforced stop gates.
- **GodView forensic replay:** reconstruct at commit/task/time who owned which source cells, what tests failed, and why a rollback occurred.
- **Semantic ownership bargaining:** agent territory split over actual import/API/test dependency cuts rather than only folders, preserving contract-first task ordering.

All are **research/implementation proposals**, not certified inventions or existing working features. Before selling as novel: targeted prior-art, patent counsel where justified, competitor-source checks, licensing and customer validation.

## Implementation state after review

**Implemented locally:** Code Monster evidence event reference, territory planner reference, complete-path-aware local census with node tests; OmniSight 2D GodView demo; OmniDev file-ledger optimization, focused 3k-fixture, source-reference census across all 174 items, additive 18-item MGR upgrade register. **Still required:** durable DB-backed journal/locks, true semantic parser, LLM/REA/Actions integrations, full cross-repo production certification, remote GitHub creation and end-to-end live PR/deploy loop.
