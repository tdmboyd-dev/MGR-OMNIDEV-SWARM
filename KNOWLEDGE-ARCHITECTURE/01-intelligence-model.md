# Living intelligence model and graph schema

## Scope and authority

This is prompt 3's detailed knowledge architecture. It extends the production architecture's cell topology, transactional authority, projection model, bounded agents and zero-trust controls. It specifies a living development memory: observations become evidence-backed assertions; assertions become permission-scoped relationships; relationships support explanations, decisions and experiments; outcomes correct prior beliefs. It is a design specification, not a claim that the current regex analyzer implements these services or that this is the world's first such system.

The knowledge journal service owns canonical entity identities, observations and versioned assertions in PostgreSQL plus immutable object manifests. Source systems retain authority over their own facts. An observation is what a particular collector saw, not an omniscient statement about reality. Neo4j, lexical search, Qdrant and analytical rollups are rebuildable projections. No model writes directly into authoritative stores. A model proposes assertions through a validation and adjudication command.

Separate four representations: source artifacts; extracted claims; accepted knowledge views; generated answers. They have different retention, reliability and access rules. The accepted view includes disputed and unknown states rather than erasing ambiguity. Accepted means the admission criteria were satisfied, not that a statement can never be wrong.

## Canonical objects

| Object | Essential fields | Invariant |
|---|---|---|
| Entity | tenant_id, entity_id, kind, source_namespace, external_key, identity_version, lifecycle, home_partition | Names and paths are mutable attributes; identities are tenant scoped |
| EntityVersion | entity_id, version_id, source_revision, content_digest, properties_ref, valid interval, recorded interval | Immutable knowledge version; large payload in encrypted object storage |
| Observation | observation_id, source_connection, collector/version, source_revision, observed_at, coverage_manifest, artifact_id | Evidence of collection with explicit scope and failures |
| Assertion | assertion_id, subject, predicate, object entity or typed literal, modality, status, evidence_ids, confidence_record, temporal bounds | A claim never becomes a fact merely through repeated generation |
| Relationship | relationship_id, subject_id, predicate, object_id, assertion_id, context_id | Projection of a sourced assertion; not independently authoritative |
| Context | project, branch, environment, release, scenario, session, snapshot manifest | Distinguishes mutually valid claims in different circumstances |
| Evidence | evidence_id, artifact_id, digest, selector, producer, method, license, classification, ACL, retention | Stable location and integrity proof; selector resolves within a pinned artifact |
| CoverageManifest | expected domains, enumerated scope, successful/failed/excluded coverage, timestamps, collectors | Absence claims require applicable coverage, not missing search results |
| IdentityResolution | candidate identities, evidence, resolution state, reviewer, reversible merge map | No automatic irreversible merging by similar names |
| Hypothesis | testable statement, supporting/refuting evidence, proposed intervention, outcome | Remains distinct from observation and forecast |

Use UUID identities and source-local natural-key mappings. Deduplicate source observations by tenant, connection, revision, collector digest and partition. Content hashes deduplicate bytes only within the authorized encryption/deduplication boundary; identical bytes do not imply identical entities or owners. Identity mapping for functions uses repository lineage, parser-specific symbol identity and signature/context. Git rename similarity is a candidate signal; ambiguous moves remain separate entities linked by POSSIBLE_SUCCESSOR.

Every discovered item receives a structural containment link to its source/context, provenance link to an observation and an ownership state. This meets navigable connectivity without fabricating semantic dependencies. Unknown owners point to an explicitly typed UnresolvedOwner record; broken references point to UnresolvedReference. These represent missing knowledge, not real users or confirmed external services. Tenant root is the terminus of containment. Semantic isolation is measurable even when structural connectivity exists.

## Complete entity ontology

The contract catalog contains every requested type and additional evidence/operational types. Names are canonical PascalCase; adapters map synonyms without rewriting historical records.

| Family | Types | Principal relationships |
|---|---|---|
| Organization | Organization, Project, Repository, User, Team, Customer | OWNS, CONTAINS, MEMBER_OF, RESPONSIBLE_FOR, USES |
| Source structure | File, Function, Class, Module, Package | DEFINES, CONTAINS, IMPORTS, CALLS, DEPENDS_ON |
| Runtime | Service, Microservice, Container, Server, Infrastructure, CloudResource | RUNS_ON, DEPLOYS_TO, COMMUNICATES_WITH, CONFIGURES |
| Data | Database, Table, Column, Index | CONTAINS, READS, WRITES, INDEXES, MIGRATES |
| Interfaces | API, Endpoint, Event, Queue, Log | EXPOSES, IMPLEMENTS, EMITS, CONSUMES, OBSERVED_IN |
| Coordination | Ticket, Roadmap, Meeting, Conversation, Documentation, ArchitecturalDecision | DISCUSSES, RESOLVES, DOCUMENTS, DECIDES, SUPERSEDES |
| Business | BusinessProcess, RevenueSource, Competitor, CustomerInteraction | SUPPORTS, GENERATES_REVENUE, COMPETES_WITH, AFFECTS |
| Creative | DesignAsset, Asset3D, Animation | DERIVED_FROM, REFERENCES, ANIMATES, USED_BY |
| Intelligence | AIModel, AgentSwarm, Agent, AgentOutput | GENERATED_BY, REVIEWED_BY, USES_MODEL, SUPPORTS, REFUTES |
| Evidence and time | Observation, Evidence, Assertion, Snapshot, Commit, Deployment, Release, Scenario, Forecast, Experiment, Outcome | OBSERVED_IN, DERIVED_FROM, VALIDATED_BY, PREDICTS, TESTS |
| Gaps and access | KnowledgeGap, Requirement, Policy, Grant, UnresolvedReference, UnresolvedOwner | APPLIES_TO, REQUIRES, BLOCKS, GOVERNED_BY |

CloudResource has provider-qualified subtype and external ID; Container records image digest and runtime occurrence, not merely image tag. Logs are indexed batches and selected evidence spans, not billions of individual graph nodes by default. Customer interactions minimize personal data and retain authorized source pointers. 3D assets map scene hierarchy, mesh/material/rig, dependencies, license and exporter revision through extension subtypes. AIModel identifies weights/provider revision, capabilities, license and evaluation context; a marketing model name alone is not reproducible identity.

## Relationship semantics and constraints

CONTAINS is an acyclic structural parent relation within a context; CALLS and DEPENDS_ON may legitimately cycle. Track cycle meaning by strongly connected components, not by globally banning cycles. CALLS requires parser/static-analysis/runtime evidence; MENTIONS is textual mention and cannot be promoted to dependency. READS/WRITES attach operation and environment context. RESPONSIBLE_FOR is explicit ownership, not inferred from a single commit. CHANGED_BY records commit authorship separately from deployment actor and decision maker. Business AFFECTS relationships need measured evidence or hypothesis modality.

All edges carry source assertion ID, evidence, validity, modality and access scope. Relationship visibility requires authorization on both endpoints and the relation/evidence. Projection filters must not expose denied endpoint names, counts, degree, paths or inferred membership. Shared public dependencies are public corpus entities; tenant-private usage edges remain private.

Ontology migrations are versioned: additive labels first, adapters dual-read old and new representations, replay into shadow projections, compare semantics and coverage, then promote. Unknown extension types stay namespaced and quarantined from strong reasoning rules until reviewed. Extensions declare property types, relation domain/range, cardinality, required evidence and license. Keep original extracted type alongside normalization to preserve fidelity.

## Provenance and epistemic states

Represent observed, human_asserted, inferred and predicted modalities, with proposed, accepted, disputed, superseded and retracted lifecycle states. A collector can assert an observation accurately while its underlying source is wrong. Confidence stores method, calibration dataset/version, evidence quality, freshness and uncertainty; an uncalibrated language-model percentage is not a probability. Evidence independence tracks common origins so ten summaries of one ticket do not count as ten corroborations.

PROV-compatible export maps source objects to entities, extraction/evaluation operations to activities and responsible principals to agents. This is interoperability mapping, not a claim of complete OWL reasoning support. Sign journal batch manifests, preserve extractor and model versions and content hashes, and record derivation DAGs. Do not store private model chain-of-thought; preserve concise rationales, evidence references, rule executions and reviewer decisions sufficient to explain outputs.
