# Monitoring, executive intelligence, scoring and operating systems

## Operational telemetry

Use OpenTelemetry-compatible trace/metric/log contracts across edge, BFF, service, workflow/activity, model/tool dispatch and sandbox execution. Propagate trace and correlation IDs through event envelopes without credentials. Sensitive source/prompt bodies are excluded by default; diagnostics access is tenant-scoped and audited. Regional collectors redact, sample and route before export.

Metrics cover API availability/latency, auth/policy failures, queue ready age, active/reserved work, workflow retries/history growth, model quota/errors, sandbox capacity/cleanup, ingestion lag, graph/vector watermarks, datastore saturation, budget/receipt mismatch and deployment health. Agent health distinguishes waiting states from stalled or failed work. Cardinality budget prevents arbitrary task/file/user IDs as global metric labels; detailed lineage lives in traces/events.

Select a horizontally scalable time-series implementation with verified tenancy, retention and HA behavior; VictoriaMetrics-compatible regional deployment is the reference family, subject to a specific version/replication design during provisioning. Keep metrics, log and trace storage independently sized. Initial metrics: high-resolution 30 days, downsampled 13 months; debug logs 7 days, ordinary operational logs 30 days, traces 7–30 days by sampling. Audit/financial evidence follows separate retention/legal policy. These are proposed defaults, configurable by residency and contract.

Alert on user-visible SLO burn rate, stale workers, policy authority/fencing failure, duplicate external operations, ledger imbalance, source/graph staleness, excessive output/egress and sandbox anomalies. Thresholds derive from measured baseline; silence is not a green health state. Alerts carry affected projects, severity, evidence links, owner and runbook. Incident/notification connectors require selected recipients/channels and do not send arbitrary autonomous messages.

## Score definitions

Scores are versioned measurements with coverage and uncertainty, not model confidence dressed as arithmetic. An evidence metric states data source, normalization, age, applicability, sample size and adverse thresholds. Each dimension returns `{value|null, coverage, confidence, freshness, methodology_version, evidence_refs, critical_flags}`. Null means unassessed.

| Requested dimension | Representative measurable inputs |
|---|---|
| Security | Verified vulnerabilities/control coverage, secrets/IAM exposure, remediation age; critical risk flags |
| Architecture | Boundary/dependency fitness, coupling, cycles, decision quality, change blast radius |
| Code Quality | Supported static quality checks, duplication, correctness signals and evaluated regressions |
| Innovation | Validated opportunity/experiment quality and outcomes, not idea quantity |
| Performance | Measured latency/throughput/resource efficiency against declared workloads |
| Scalability | Calibrated capacity headroom, bottlenecks and tested scaling behavior |
| Reliability | SLO/error-budget adherence, recovery/failure tests and incident recurrence |
| Maintainability | Change lead time, testability, ownership, debt trend and dependency support |
| Developer Experience | Measured build/test feedback, onboarding/task friction and developer research |
| User Experience | Task success, usability/accessibility evidence and real user feedback |
| AI Readiness | Data/provenance/tool/policy/evaluation readiness, not number of AI packages |
| Business Opportunity | Validated demand/unit economics/market opportunity and uncertainty |
| Future Readiness | Tested evolution paths, lifecycle risks, milestone evidence and forecast calibration |

Original executive dimensions also remain available: Revenue Potential, Technical Debt, Operational Excellence and Business Health, plus accessibility/testing/docs observability submetrics. Map overlap explicitly; do not silently replace Business Health with Business Opportunity or invert Technical Debt without labels.

Reference Omni Score weights for the thirteen requested dimensions: Security 15, Architecture 10, Code Quality 8, Innovation 5, Performance 8, Scalability 8, Reliability 12, Maintainability 7, Developer Experience 5, User Experience 5, AI Readiness 5, Business Opportunity 7, Future Readiness 5 (sum 100). Tenant methodology may override with a versioned approved profile.

For eligible dimensions, aggregate `sum(weight × coverage × value) / sum(weight × coverage)` and separately display weighted coverage. Do not impute missing dimensions as 100. Score is provisional unless weighted coverage ≥80% and required security/reliability evidence is fresh. An unresolved verified critical risk adds a prominent blocker and reference policy caps Omni Score at 49; accepted risk remains visible and its governance is explicit. Calibration and fairness across project types require evaluation before using scores for commercial guarantees or employee assessment.

Repository intelligence score applies the technical subset with coverage normalization and methodology version; business dimensions remain unassessed unless data exists. Score histories bind source and measurement windows so trend changes distinguish real improvement from a new scoring algorithm.

## Executive command center

Show project/security/architecture health, debt, innovation and revenue opportunities, scaling risks, future projections and Omni Score. Drilldown traces every number to evidence, coverage, source revision and action. Separate measured current health, incomplete scan, proposed opportunity and future scenario. Ranking across projects uses comparable methodology and flags incomparable coverage. A revenue hypothesis never becomes booked revenue.

Engineering/architecture/security dashboards share the same snapshots but expose role-appropriate detail. Real-time swarm dashboards show actual leases, tasks, cost reservations and dissent. Executives can set objectives/budgets; this cannot override forbidden targets or grant an agent more permission.

## Runbooks and operating evidence

Required playbooks: region/cell outage; database failover/restore; graph/vector rebuild; provider outage; OAuth revocation/refresh failures; sandbox escape; secret exposure; runaway agent/cost; duplicate/unresolved external side effect; bad deployment; schema/event version mismatch; deletion/retention incident; compromised marketplace release.

Runbooks specify detection, stop conditions, authority/owners, safe actions, customer communication, recovery/read-back and evidence closure. Quarterly recovery/isolation exercises and release-ring failure drills are design gates, with cadence refined by enterprise contracts. Track real RPO/RTO and task outcome quality, not just component uptime.
