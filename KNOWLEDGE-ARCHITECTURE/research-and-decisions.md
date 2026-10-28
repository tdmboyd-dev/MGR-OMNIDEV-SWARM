# Research basis and architecture decisions

Inspected primary documentation October 8–9, 2026. Scope: targeted architecture research, not complete end-to-end evaluation of every database/model vendor. Production procurement, release-version pinning, performance and license review remain release gates. No untested system is labeled fully researched or operational.

| Source | Inspected technical lesson | Disposition |
|---|---|---|
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | Entity/activity/agent and derivation interoperability | ADAPT provenance mapping; no mandatory global OWL closure |
| [PostgreSQL ranges](https://www.postgresql.org/docs/current/rangetypes.html) | Range representation and indexed temporal lookup | ADOPT range primitives behind journal contract; benchmark actual partition workload |
| [Neo4j constraints](https://neo4j.com/docs/cypher-manual/current/schema/constraints/) | Uniqueness/property constraints; edition-dependent support | ADAPT projection checks; domain/range/admission enforced by OmniDev |
| [Qdrant filtering](https://qdrant.tech/documentation/search/filtering/) | Metadata-filtered vector retrieval | ADAPT trusted tenant/resource filters with authoritative recheck |
| [Earlier primary references](../PRODUCTION-ARCHITECTURE/source-references.md) | Messaging, identity, workflow and account boundaries | Reuse decisions; no new auth mechanism invented |

## Capability research packets

| Packet field | Graph/provenance | Memory/time | Retrieval/reasoning |
|---|---|---|---|
| Definition | Typed, sourced, versioned entity assertions | Scoped episodes/lessons/decisions and bitemporal history | Authorized evidence discovery and bounded explainable conclusions |
| Production use | Dependency/ownership/impact queries | Durable context, rationale and correction history | Diagnostics, planning, gap and opportunity investigation |
| Standards | PROV mapping; typed internal ontology | UTC ranges, revision manifests and access policies | JSON contracts, provider-independent model boundaries |
| Research/papers | PROV normative model used for interoperability; broader graph-reasoning literature remains qualification work | No literature claim required for interval semantics; learned consolidation methods need evaluation | No claim that generative graph reasoning is solved; deterministic rules plus tested hypotheses |
| Open implementations | Neo4j reviewed constraints; registry/journal OmniDev-owned | PostgreSQL reviewed ranges; consolidation service OmniDev-owned | Qdrant reviewed filtering; planner/verifier OmniDev-owned |
| Models | N/A for identity/provenance; extractor models optional | Optional summarizer evaluated by fidelity, not selected yet | Embedding/reranker/generator provider not locked; selection requires domain tests |
| Datasets | Authorized multilingual histories and synthetic ambiguities | Late observations, conflicting decisions and revocations | Time/project-held-out questions, negative and injection cases |
| Licensing | Source data rights plus database edition/license qualification | Tenant retention and rights govern artifacts | Model/dataset licenses evaluated separately before use |
| APIs/providers | Replaceable journal/graph adapter contracts | Memory/time APIs owned internally | Search/answer contract hides vector/model providers |
| Native alternative | Native admission, identity and ontology; avoid building a new graph storage engine | Native layered memory and decision semantics on transactional primitives | Native planner/rules/evidence verifier; use replaceable retrieval/inference |
| Hardware/runtime | Cell-isolated CPU parser/journal/graph pools; size empirically | Transactional/object capacity plus replay workers | Vector RAM/storage, reranking CPU/GPU/model API budget |
| Cost | Current plus history/index/replica bytes and extraction | Retention, summaries, restore and invalidation | Candidate fanout, embedding/reranking/tokens; exact usage attribution |
| Failure modes | Identity collision, false dependency, partial scan, projection corruption | False summary, scope leakage, clock ambiguity, deletion resurrection | Wrong context, unsupported cause, stale evidence, prompt injection |
| Evaluation | Precision/ambiguity, replay and relationship validity | Fidelity/temporal correctness and revocation | Recall/support/abstention/isolation/latency/cost corpus |
| Placement | Per-cell registry/journal and derived graph | Per-cell memory admission/time view | Per-cell retrieval/evidence/reasoning with delegated scope |
| Acceptance | Ontology/identity/projection gates in chapter 6 | Eight-layer/decision/timeline/recovery gates | Quality/security/counterfactual/causal gates |

## Locked design decisions

K-ADR-01: Journal authority, graph/vector/search derived. Reject multi-store uncontrolled source truth.

K-ADR-02: Open-world semantics and coverage-conditioned absence. Reject negative conclusions from empty search.

K-ADR-03: Structural connectivity for every discovered item; semantic links require evidence. Reject manufactured dependencies to satisfy “nothing isolated.”

K-ADR-04: Bitemporal history plus separate scenarios. Reject forecasts masquerading as present state.

K-ADR-05: Current authorization applies even to historical views and derived answers. Reject historical grant replay.

K-ADR-06: Eight memory layers with decision/research typed cross-cutting views. Reject duplicate competing memory authorities.

K-ADR-07: Native planner, ontology, admission, reasoning rules and evidence verification with replaceable stores/models. Reject provider permanence and unnecessary storage reinvention.

K-ADR-08: Conditional indefinite retention, lawful deletion and explicit global-publication consent. Reject raw cross-tenant memory pooling.

K-ADR-09: Causal claims require discriminating tests/interventions and concise evidence traces. Reject model confidence or vote counts as proof.

## Follow-up qualification queue

| ID | Capability | Status | Evidence and next action |
|---|---|---|---|
| K-R01 | Parser identity across languages/refactors | SPECIFIED | Compare real parser/build/LSP behavior and ambiguous lineage corpus |
| K-R02 | Temporal projections at target history size | SPECIFIED | Benchmark range indexes, pruning, cold reconstruction and shadow rebuild |
| K-R03 | Graph partition layout and supported edition | SPECIFIED | Pin release/license; execute hot-hub/federated workload and failover |
| K-R04 | Embedding/reranking/consolidation model selection | QUEUED | Compare licensed candidates on domain corpus, privacy, hardware and cost |
| K-R05 | Cited diagnostic causal reasoning | SPECIFIED | Execute known incidents with controlled interventions and time-held-out evaluation |
| K-R06 | Global pattern privacy and withdrawal | SPECIFIED | Test leakage, consent lineage, withdrawal and derived-output invalidation |

Architecture scope is complete; these empirical qualifications prevent design specifications being misrepresented as proven production behavior.
