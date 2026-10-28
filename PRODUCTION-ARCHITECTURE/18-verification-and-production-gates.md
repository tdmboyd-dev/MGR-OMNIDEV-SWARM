# Verification strategy and production gates

## Design verification versus implementation verification

This package is an engineering design. Documentation coverage, arithmetic, reference resolution and contract fixtures can be checked now. Multi-million-user capacity, zero-tenant-leakage, real OAuth grants, microVM isolation, provider billing, high availability and calibrated predictions require implemented systems and real experiments. Their status remains unverified until evidence exists.

## Required suites

| Suite | Material test cases |
|---|---|
| Tenant isolation | Cross-tenant project IDs, graph edges/counts, vector filters, pooled DB context, caches, object URLs, event consumers, support access and backups |
| Identity/authorization | OIDC issuer/audience/nonce, PKCE/state replay, account/resource scope, refresh races, revocation, approval digest/expiry, delegated escalation |
| Orchestration | Crash after reservation, after outbox commit, during activity, stale lease completion, cancellation with dispatched effect, parent/child budget conservation, poison events |
| Provider/tool effects | Timeout after provider write, duplicate webhook, concurrent PR/create, changed target/base, unknown outcome reconciliation and receipt deduplication |
| Isolation | Host/metadata/socket access, symlinks/archive bombs, package egress, syscall/device escape, resource exhaustion, image provenance, artifact poisoning and cleanup |
| Data lifecycle | Projection rebuild/version swap, source delete, revocation before index purge, backup restore with tombstones, key rotation/recovery, legal hold and residency |
| Financial | Concurrent reservation, negative balance, duplicate receipt, FX/rate-card revision, unknown usage, rounding, ledger imbalance, correction/refund and plan double-charge |
| Capacity | Reference repo sizes/hot monorepo, interactive fanout, 20B-edge partition plan, vector recall/memory, sustained event/queue load and costly graph queries |
| Resilience | Zone loss, full region partition, lost placement quorum, stale writer/fence, replica lag, cross-cloud restore, provider and model outages |
| Agent quality | Held-out behavioral tasks, hallucinated evidence, correlated reviewers, adversarial source instructions, poor specialist votes and regression cost |
| Twins/futures | Baseline/candidate repeatability, workload drift, calibration error, false causal revenue claims, forecast retrospective accuracy |
| Experience | Account/install/consent return, interrupted tasks, keyboard/screen reader/mobile/zoom, unavailable panels, unknown effects and approval clarity |
| Marketplace | Signature/digest tampering, unexpected permissions/egress, malicious UI bridge, compromised release, revocation, upgrade/rollback and publisher settlement |

## Production gates

1. No unresolved critical tenant-isolation, secret, fencing or financial-integrity issue.
2. Current supported provider/resource authorization is proven; customer-visible capabilities match real grants.
3. Exact artifact/commit, relevant behavior/security tests and required independent review are bound to every sensitive action.
4. Operating envelopes are measured on representative workload distributions with headroom and admission controls.
5. Zone/region recovery meets the sold RPO/RTO tier; uncertainty/loss windows are displayed honestly.
6. Restore and deletion drills pass; keys, backups and audit evidence remain recoverable and controlled.
7. Platform/client/plugin versions are compatible with running workflows and declared support windows.
8. Billing reconciles actual receipts, reservations and immutable ledger; model-plan users are not silently converted to a different billing path.
9. Incident runbooks, owners, kill switches and permitted auto-healing classes are exercised.
10. Accessibility/consent/recovery journeys pass before expanding audience beyond the current owner-private foundation.

## Capacity experiment design

Benchmark resource envelopes per store/workload rather than treating marketing maximums as budgets. Use realistic tenant/repo-size skew, hot keys, ACL distributions, parser languages, modality mix, index generations and long-lived workflows. Measure p50/p95/p99, queue age, failure rates, cost, storage/index overhead and recovery at sustained and burst load. Establish supported maximums from the weakest critical subsystem.

Example stages: 10K reference repositories → 100K/cell with incremental ingestion → multi-cell placement/migration → 1M repositories across cells → 10M repository envelope through tested cells plus workload-scaled aggregate model. Billions of relationships are verified through partition/shard load and query correctness, not an unbounded full-graph browser rendering. Synthetic capacity tests and real customer observations remain separately labeled.

## Architecture consistency checks

All command APIs map to owning services and scoped identities. All effectful operations have durable intent and reconciliation. All private stores/indexes have authorization/deletion strategy. Each HA promise declares writer ownership, replication and fencing. Each long-running/recursive flow has bounded resource admission. E2EE mode states where plaintext computation occurs. Score/forecast/business outputs distinguish evidence, unknowns and hypotheses. Reference arithmetic and schema examples are validated as design artifacts.

Deployment manifests, full domain migrations and complete service-specific API specs are implementation deliverables derived from this package; the core reference contracts are not advertised as an already running production platform.
