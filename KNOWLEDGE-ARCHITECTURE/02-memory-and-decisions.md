# Eight memory layers and decision memory

## Memory record schema

Each memory record contains tenant_id, memory_id, layer, scope_id, subject_entity_ids, memory_kind, modality, state, content_artifact, source_assertion_ids, evidence_ids, created_by, created_at, valid_range, recorded_range, confidence_method, salience, sensitivity, access_policy_id, retention_policy_id, consent_basis, supersedes_id and retrieval_generation. Summaries additionally declare input manifests, compression version, covered intervals, omissions and summary fidelity evaluation. Memory is indexed by reference; raw documents are not duplicated indiscriminately into every layer.

Memory kinds include episode, semantic_fact, procedural_lesson, decision, hypothesis, preference, outcome, innovation and forecast. Embeddings help retrieval but do not define truth or identity. Procedural lessons cannot expand tool permissions. A stored user instruction is content until separately admitted into the applicable instruction/policy system; connector documents cannot silently override platform or user authorization.

## Layer boundaries

| Layer | Scope and content | Admission and retention | Retrieval boundary |
|---|---|---|---|
| 1 Session | Current conversation, selected sources, tool receipts and unresolved questions | Checkpoint durable episodes; ephemeral scratch TTL 24 hours by default | Participant/resource grants; session membership alone cannot expose underlying sources |
| 2 Agent | Specialized procedures, evaluations and reviewed individual lessons | Useful episodes admitted after evidence validation; task scratch expires | Agent identity plus current delegated scope; identity is not a private-data wildcard |
| 3 Swarm | Shared investigation, hypotheses, disagreements and review outcomes | Append collaboration episodes; compact after run closure | Each reader's current grants; shared summaries obey restrictive source policy |
| 4 Project | Architecture, source history, bugs, tests, deployments, business context | Durable under project retention; correction chains preserved | Project role plus source/object/branch/environment restrictions |
| 5 Organization | Company decisions, approved operating practices and cross-project patterns | Explicit aggregation, steward review and lawful retention | Org policy and project-specific restrictions; org membership is insufficient |
| 6 Global Pattern | Public lessons and consented, reviewed generalized patterns | Separate publication workflow; privacy review, leakage testing, withdrawal support | Public corpus or explicitly scoped sharing grants; no raw private tenant data |
| 7 Innovation | Opportunities, invention hypotheses, novelty searches and experiments | Record authorship, source rights, confidentiality and test outcomes | Project/org or approved publication scope; patentability remains an unverified legal question |
| 8 Future | Scenario assumptions, forecasts, roadmap branches and predicted outcomes | Retain issued forecast unchanged; attach later evaluations and replacements | Source-derived access plus scenario policy; future memory never replaces observed present |

Decision memory is a cross-cutting kind available within these layers, not a ninth layer or separate source of contradictory truth. Research memory maps to semantic/episode records in agent, swarm, project or organization scopes. The earlier production document's short-term/company/global terms map to session/organization/global pattern. Its decision and research stores become typed views; innovation remains layer 7 and future is explicitly layer 8.

## Write, consolidate, promote and correct

A memory command authenticates its writer, validates source manifests, applies classification, records consent/retention, computes idempotency key and appends a versioned entry plus outbox event. Eligible retrieval generation follows only after projection watermark advances. Rejected admission retains a minimal audit reason; harmful raw content need not be permanently preserved merely to record a rejection.

Consolidation clusters related episodes within a scope and creates an evidence-linked summary. It preserves dissent and exceptions, labels missing inputs and never deletes sources solely because a summary exists. Source retention and compaction are separate decisions. Before admitting a procedural lesson, require a generalization boundary: language/version/environment, triggering conditions, tested outcomes, contraindications and expiry/revalidation criteria.

Promotion from agent to swarm or project increases discoverability only after scope and provenance checks. Promotion to organization requires approved sharing. Global publication requires rights, explicit opt-in where applicable, confidential-data removal, membership/secret leakage testing, owner review and a withdrawal locator. Aggregation is not automatically anonymization. Do not globally train models on private memory by default. Revoked publication invalidates global indexes and downstream generated summaries identified through lineage.

Contradictions create a dispute set: conflicting assertions, overlapping context/valid intervals, evidence lineage, severity, owner and resolution criteria. Preserve both until adjudication. Human authority can settle a business choice but cannot retroactively prove a performance measurement. Retractions propagate to dependent summaries, vectors, graph projections, answers and automation prerequisites; revalidate descendants rather than silently leaving polished false memories.

## Decision schema and lifecycle

A decision stores decision_id, scope, title, problem, triggering_evidence, author/proposer, accountable_decider, participants, decided_at, effective_at, alternatives, criteria/weights, selected_option, rationale, risks, mitigations, expected_outcomes, verification_plan, review_date, related_entities, implementation_refs, actual_outcomes, lessons, status and supersedes_id. Alternatives include rejected/deferred choices and reasons. Expected outcomes are measurable metrics with baseline, target, observation window, owner and assumptions. Actual outcomes include measurement method and attribution uncertainty.

Lifecycle: draft → under_review → accepted or rejected → implemented → evaluated → superseded or retired. Reopening does not mutate the historic accepted rationale: append a reconsideration record and link it. Decisions may expire or remain implemented while failing their expected outcomes. Capture disagreement and exceptions. Sign-off records authorized principal, exact decision revision, policy version and timestamp; a generated summary of a meeting is not participant approval.

Architectural decisions link DECIDES to selected architecture, CONSIDERED to alternative designs, MOTIVATED_BY to evidence, ACCEPTS_RISK to risks and EVALUATED_BY to outcomes. A query for why an API exists follows design and decision links before offering a model's plausible explanation. If no decision exists, report undocumented rationale and optionally propose a retrospective record explicitly labeled retrospective.

## Longevity, forgetting and recovery

The design supports indefinite retained history where permitted, not unconditional permanent storage of every personal record. Retention is configurable by kind, sensitivity, tenant contract and legal basis. Legal holds apply through authorized review. User deletion, consent withdrawal and confidential-source revocation propagate through derivation lineage and indexes. Backup restoration applies tombstones before reopening query service. Audit proof can retain non-content operation evidence only when permitted; hashes may themselves be sensitive and require policy review.

Journal authority uses tenant-scoped transactions, access-aware object manifests, immutable versions and periodic signed checkpoints. Redis loss discards scratch/presence, not durable episodes. Restore canonical journal and manifests first, replay derived stores, validate counts/digests/access filters, and advertise coverage/watermarks. A memory cannot be served from a stale cached summary after its source grant is revoked.
