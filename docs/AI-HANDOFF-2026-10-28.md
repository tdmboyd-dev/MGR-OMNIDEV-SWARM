# OmniDev: AI continuation handoff, 2026-10-28

Canonical audit branch: audit/ecosystem-2026-10-28, base26e230d052c45c1f42cb731ff095679497af045a. Preserve concurrent upstream development. Never reset/force-push the default branch. Parent ecosystem registry records this as an engineering department with runtimeVerified:false and tools:[] until a real Tevin adapter is verified.

Storage: db/store.ts uses env.DB and prepared D1 statements. drizzle/0000_orange_phalanx.sql stores records;0001_modern_hammerhead.sql adds jobs/runtime settings. Test fixtures use node:sqlite DatabaseSync with a D1-shaped adapter; no user's database is changed. lib/jobs.ts carries lease tokens, candidate/source binding, reviews, apply/rollback and pipeline coordination. lib/control-plane.ts handles existing admission limits and exclusive snapshot effects. Reuse this state machine rather than adding a second approval/task engine.

Routes: /api/workspace handles import/static analysis/projects; /api/runtime jobs/providers/decisions; /api/worker bearer-scoped execution dispatch/report; /api/intelligence durable intelligence records; /api/agents specialist state; /api/accounts/github cookie-bound OAuth. Production user routes rely on the external Sites gateway; local preview mock identity is not production authentication. Never expose that preview publicly or infer owner authorization from the Origin header.

New app repairs: lib/request-body.ts bounds UTF8 stream bytes before decoding across workspace/runtime/agents/intelligence/worker POST handlers. Tests cover stream cancellation, false content lengths, split codepoints and invalid UTF8. Early oversized Content-Length rejection does not consume the body; connection deadlines remain hosting responsibilities. Enqueue stores enqueueRequestDigest over canonical source/settings intent, compares both prior read and concurrent-insert loser, conflicts409 for changed/undigested legacy intent, and preserves exact replays. safePath in lib/runtime-contract.ts is the shared import/candidate path policy. Workspace import validates action/file object shapes, case-insensitive uniqueness,100000-byte per-file exclusive limit and2000000-byte total maximum. Candidate paths preserve existing exact-before validation and reject casing collisions. Job cancel uses WHERE id=? AND status=? and requires an affected row; retry/reject similarly require a successful conditional update; retry also checks attempts<3 in SQL. GitHub snapshot/audit classifiers exclude secret and Git path case aliases. Failure means stale decision, not permission to replay automatically.

Safe reproduction:

    corepack pnpm install --frozen-lockfile --ignore-scripts --prefer-offline
    node tests/prepare.mjs
    node --test tests/snapshot-paths.mjs tests/job-decision-races.mjs tests/request-body.mjs tests/ui-lifecycle-integrity.mjs
    node tests/acceptance.mjs
    node node_modules/typescript/bin/tsc --noEmit
    node scripts/run-framework.mjs build

The new tests use real isolated SQLite and production-transpiled route/job modules. snapshot-paths covers unsafe paths before writes, case aliases/null data, UTF8 limits and exact saved source/hash readback. job-decision-races inserts a terminal state between the read and update, proves its receipt/state survives, denies a concurrent third failed attempt, and checks ordinary transitions. Acceptance uses controlled GitHub/provider fixtures. Worker/companion tests have a separate lane receipt; coordinate shared .test-runtime generation before concurrent tests.

Required Tevin adapter proposal (not implemented/live): scoped principal {tenantId,actorId,operations,workspaceIds}; request {requestId,approvedPreviewDigest,operation,snapshot:{commit,files:[{path,sha256,content}]},objective,budget}; result {requestId,status,sourceDigest,readingLedger,patches,evidenceRefs,externalEffects:[]}. Begin operations inspect and propose. Persist canonical request digest; exact replay returns same receipt, changed replay conflicts. Require Tevin's existing preview/approval coordinator before any external write. Return unknown when provider/host outcome cannot be reconciled; never silently retry chargeable or GitHub effects.

Fixtures/logs and exact per-file reading ledger are under work/ecosystem/wave2/omnidev*. Parent package merges frontend/root/worker receipts. Authorship in a ledger is a reading scope, not proof of runtime execution. Ignore node_modules, dist, .test-runtime and tsbuildinfo in source exports. Preserve signed historical engine ZIP bytes; newer code requires publisher re-sign before installer delivery.
