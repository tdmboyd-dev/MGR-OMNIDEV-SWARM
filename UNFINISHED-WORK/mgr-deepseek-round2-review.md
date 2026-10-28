# DeepSeek round-two code review — MGR admission decision

**Owner-supplied source:** `Pasted text(4).txt`, 1,088 lines, reviewed on 2026-10-28. DeepSeek candidly corrected its first design. Its stronger SQLite event, territorial lock and census proposals contain useful implementation lessons, but **the displayed code is not proven production-safe and its stated test results were not executed in this workspace**.

## A. Evidence ledger — ADAPT, do not copy unchanged

**What improved:** WAL/FULL-sync single-host SQLite pattern, unique sequence and idempotency constraints, stream heads, transaction boundary, evidence validation, replay and crash-restart tests. This is a useful reference for Code Monster's future `CM-401` durable implementation.

**Definite correctness bug in the posted code:** `append()` hashes separate `input.actor.id`, `input.actor.kind` and `authStr`, but `verifyChain()` hashes concatenated `e.actor` and **does not include authorization**, while `mapRow()` does not expose `authorization`. Even untampered newly appended records can fail verification. The source comment proposes a legacy fallback but no versioned hash contract is actually defined. Fix with a single canonical envelope version, preserving all fields and the identical algorithm at append/verify.

**Other problems:**

- It claims actor identity is "bound," yet the caller supplies `actor`; no authenticated principal/authorization policy check is shown.
- Idempotency key is `UNIQUE` globally, not stream-qualified; independent campaigns could collide. Same key with a different payload should be rejected, not silently return unrelated data.
- `canonicalJson(undefined)` is not a string; schema validation, size limits, UTF-8 normalization, event kind allowlists and resource protection are absent.
- Test snippet uses `require('better-sqlite3')` inside an ESM TypeScript import test, which is not valid by default in ESM without `createRequire` or compatible loader.
- WAL/FULL is useful for crash resistance but not a proof of power-loss durability, corruption resistance, cross-host quorum, backup correctness or permission binding.
- Foreign keys are enabled but none enforce referenced actors/evidence; secrets/PII retention, isolation and migration semantics remain.

**Admission gate:** implement a real transactional adapter behind Code Monster's event contract, validate schema/identity, use hash versioning, run tamper/restart/parallel-process/idempotency-conflict tests, document SQLite version and release architecture. Do not mark `CM-401`, `MGR-003` or `MGR-008` complete based on the pasted snippet.

## B. Territory lock manager — ADAPT WITH MAJOR SAFETY FIXES

**What improved:** SQLite transactions, read/read compatibility, write exclusivity checks, TTL, heartbeat, lease epochs, grouped acquisition and a clear distinction between task and agent identifiers. A practical single-host reference pattern.

**Critical gaps:**

1. The primary key `(cell_id, agent_id)` allows the *same agent* to replace the lock for a different `task_id`, masking concurrent task conflicts and invalidating ownership. Lock identity must include strict task/session/lease token matching, with explicit transfer operations.
2. `release(cellId,agentId)`, `releaseAll(agentId)` and `heartbeat` don't check task, lease token, epoch, or expiry. A stale process could release or renew a successor's lease.
3. Expiring a lease in the DB cannot stop a former worker from writing: every authoritative mutation must be fenced by current lease epoch/token and source revision.
4. `ttlSeconds` checks only `<=0`; NaN, infinity, huge TTL and clock rollback require bounding and validated server time.
5. Multiple tasks can deadlock through external resources even when DB transactions serialize local acquisitions; deterministic sorted claim order, transaction timeouts and rollback proofs are needed.
6. The SQLite lock table handles single-host DB access, not multi-host execution unless all workers have a qualified, consistent central authority.

**Admission gate:** lease ID and fencing tokens, strict owner/task/session checks, monotonic time policy, stale-worker negative tests, transaction concurrency tests, source SHA preconditions and permission checks. Never confuse "database mutex" with complete worker isolation.

## C. Full census/CAS — useful improvement, still not 100% tree understanding

**What improved:** visible skipped-directory records, explicit metadata-only/symlink/error outcomes and fresh index state. A count invariant is a useful *internal consistency check*.

**Subtle defect in the claim:** The equation `indexed + metadataOnly + excluded + unsupported + failed === totalFiles` is only as complete as `totalFiles`. If the traversal skips a subtree and only counts the directory, the potentially thousands of files **inside** are not in the denominator. A valid invariant over visited entries doesn't prove complete repository file coverage. Git tree inventory and explicit generated/dependency paths are needed to define a truthful denominator.

Other required work: snapshot consistency while files mutate during scan, path canonicalization/case collisions, symlink/FS boundary policies, Git submodules/LFS, large streamed content, credentials, ignore rules, binary sniffing, parser support and a durable CAS with garbage collection and quota.

**Admission gate:** compare local census against Git `ls-tree`/commit-anchored manifest; report hidden/ignored subtrees with unknown counts instead of false 100%; fail tests on injected unreadable directories and concurrent file modification.

## D. Backlog and feature suggestions

DeepSeek's proposed `REL-02` evidence check and three-way split for tasks lacking explicit source references are worthwhile. Add them to future reconciliation tasks; don't automatically classify 114 tasks without independent source/test review. Its suggested commercialization and novelty comparisons are useful hypotheses, not proof. The prior approved ten-feature innovation register remains authoritative.

## E. GitHub authentication recommendation

Reject the suggestion to automatically issue a broad PAT with `repo` and `admin:org` when ordinary account sign-in or scoped connector approval can do the task. Don't paste tokens or passwords in chat. Prefer the user's normal browser sign-in and a limited permission route for private repo creation and contents. A fine-grained PAT or GitHub App authorization is a **fallback with least privilege and explicit owner consent**, not the default convenience path.

## Disposition

**ADAPT research and tests, REJECT unchanged source as production code.** The plan should include these concrete negative tests and license/version gates. Existing Code Monster reference remains truthful: in-memory event chain, proposed territory DAG and local census, not a durable distributed engine.
