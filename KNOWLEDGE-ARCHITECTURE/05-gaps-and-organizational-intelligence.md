# Missing knowledge and organizational blind spots

## Coverage-conditioned gap schema

A gap record contains gap_id, tenant/project/context, subject, gap_kind, rule/version, applicability, expected_evidence, observed_evidence, coverage_manifest, confidence_class, severity, impact, owner_state, proposed_resolution, detection_time, expiry, status and verification_refs. Types include knowledge, documentation, architecture, testing, business, security, team_knowledge_risk and single_point_of_failure. A failed search is a retrieval problem, not proof of absent documentation.

Classify results as confirmed_within_scope, suspected, unknown_due_to_coverage, not_applicable or resolved_with_evidence. Severity derives from impact and exposure; confidence derives from evidence. These are separate axes. Preserve a high-severity unknown instead of lowering its priority merely because evidence is incomplete. Gap resolution requires accepted evidence and rerunning the same applicability rule, not just a user clicking “done.”

## Detection engines

| Gap | Applicable rule and evidence | Resolution proof |
|---|---|---|
| Knowledge | Critical entity has unanswered required questions or disputed operational claims | Source-linked answers accepted and contradiction disposition recorded |
| Documentation | Required runbook/API/decision type absent from fully enumerated allowed source scope | Current document linked, ownership and recovery procedure validated |
| Architecture | Service/flow lacks a required boundary, interface or accountable design | Accepted architecture decision plus implementation inspection where required |
| Testing | Changed behavior lacks applicable tests or evidence of execution | Meaningful test receipt on pinned revision, including failure case |
| Business | Critical objective lacks measurable metric, baseline or experiment | Approved metric and validated measurement/experiment |
| Security | Applicable control missing or stale for actual exposure | Verified configuration/test and current source coverage |
| Team knowledge | Critical system has no reviewed handoff or only one independently verified operator | Demonstrated second operator rehearsal and maintained documentation |
| Single point of failure | Dependency/resource/ownership cut set blocks critical objective | Tested redundancy/failover or explicitly accepted risk |

Team analysis uses explicit role/ownership, runbook exercise and handoff evidence. Commit counts, meeting attendance and message volume are weak proxies and must not become employee performance rankings. Users can correct identity and ownership mappings. Exclude private personal communications without explicit authorized scope. Explain organizational risk as system continuity, not speculative judgments about individuals.

Build an objective → service → resource → owner → recovery-capability graph. Compute bounded articulation/cut-set candidates on authorized projections, then validate against runtime architecture and recovery tests. A graph articulation point is a topology signal, not proof of production outage inevitability. Model shared failure domains such as cloud region, identity service, certificate authority, vendor API, sole on-call operator and budget authority.

Blind-spot prediction combines overdue reviews, unowned changes, stale source coverage, repeated unresolved incidents and contradictory decisions. Default output is a hypothesis with an investigation plan. Forecasts require backtesting on prior incidents, calibrated uncertainty, time-separated validation and explanation of missing signals. Do not claim to predict an invisible gap without evidence of the detection method's performance.

## Workflow and safeguards

Detection emits gap.detected with exact evidence and coverage version. Triage validates applicability, assigns accountable owner and deadline, and links to ticket/workflow. A repair candidate proposes documentation, test, control or architecture changes. Verification independently checks resulting evidence and closes the finding only at the correct revision. Regression/staleness reopens it with history. Suppression requires named decision, reason, expiry and accepted risk; hidden permanent dismissals are disallowed.

Prioritization uses criticality, blast radius, uncertainty, dependency blocking, time sensitivity, business objective relevance and estimated repair effort. Weights and policy versions are visible and editable by authorized owners. Revenue opportunity predictions remain separate from confirmed engineering defects. Alert deduplication uses subject/rule/context fingerprint; meaningful scope or rule-version changes create linked revisions, not silent overwrites.

Operator dashboard shows knowledge coverage by domain, unresolved identity, stale assertions, conflicts, critical unowned systems, invalidated summaries, ingestion failures and pending adjudication. Executive dashboard presents risks with uncertainty and accountable actions. Coverage score measures enumerated evidence completeness, not “percentage of all possible knowledge.” Unknown denominator is displayed as unknown.
