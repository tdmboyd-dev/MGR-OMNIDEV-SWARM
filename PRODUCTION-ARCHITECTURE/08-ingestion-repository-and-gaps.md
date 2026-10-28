# Universal integration, repository intelligence and missing-things engine

## Connector lifecycle

A connection moves through `registered → consent_required → authorized → discovering → syncing → healthy|degraded|revoked`. Record provider account, application registration, scopes, selected resource IDs, target classification, residency, last successful observation, webhook cursor, source checkpoints and granted actions. Catalog registration alone establishes no access. A source returning no data is distinct from denied access, stale sync or provider failure.

Use provider-supported OAuth/app authorization/workload identity and vault-managed refresh. No arbitrary token proxy. Local filesystem, TCP databases and licensed 3D applications use owner-approved bridges in a selected trust boundary. Bridges receive root/resource grants, independently enforce symlink/path containment and publish signed manifests; the server cannot authorize unspecified local directories. Versioned per-provider adapters are replaced without changing canonical graph identity.

## Required integration families

| Family | Adapters / ingestion evidence | Execution constraints |
|---|---|---|
| Code | GitHub, GitLab, Bitbucket, Azure DevOps; local projects/directories, monorepos | Selected repository/root, immutable commit, branch/write policy, CI receipts |
| Clouds | AWS, Azure, Google Cloud, Digital Ocean | Selected account/subscription/project, inventory/IAM/billing scope; no unbounded global admin |
| Infrastructure | Kubernetes, Docker and networking | Namespace/host/resource selector; separate read, plan and apply rights |
| Databases | PostgreSQL, MySQL, SQL Server, MariaDB, MongoDB, Neo4j, Redis, Firebase, Supabase | Metadata/read grants first; schema/data/migration privileges separately reviewed |
| Design | Figma, Adobe XD, Sketch | Supported API/export/plugin versions; file/team permissions and source locators |
| 3D/content | Blender, Maya, Cinema4D, Unity, Unreal | Versioned scene/asset bridge, licensed runtime, GPU/renderer pools and artifact validation |
| Knowledge | Notion, Confluence, internal documentation | Page/space/database ACL, version history, source deletion and attribution |
| Communication | Slack, Teams, email | Authorized channels/folders; retention; ingestion consent does not authorize messages |
| Systems/business | APIs, microservices, legacy systems, ERP and CRM | Product-specific schemas/protocols, workflow scope and sensitive business-data policy |

Dedicated implementable inventories and acceptance criteria remain in `../UNFINISHED-WORK/04-integration-inventory.md`. Support is versioned and capability-specific. Unsupported discontinued provider paths are replaced by documented exports/bridges, not fabricated endpoints.

## Repository ingestion pipeline

1. Authorize selected resources and verify branch/commit scope. Pin immutable base commit and connection grant revision.
2. Receive validated webhook or polling delta; deduplicate provider event ID and verify signature/replay window. Queue a source-snapshot workflow.
3. Create a bounded tree/content manifest with paths, blob hashes, media types and coverage exclusions. Detect archive bombs, huge binaries, submodules, symlinks and vendored content before extraction.
4. Store tenant-encrypted immutable source objects. Scan/redact secrets according to tenant policy; retain restricted original only where explicitly permitted. Parsed evidence must not leak secret values.
5. Parse supported languages and manifests; map symbols, imports, call/data flow, API contracts, database access, IaC/deployments, tests and feature/requirement links. Analyze code in controlled workers; importing a repository does not run its install scripts.
6. Persist extraction manifests, incremental graph/vector updates, scanner evidence and coverage watermark. Failed extractors produce incomplete coverage rather than “nothing missing.”
7. Generate intelligence summary, versioned score snapshots, prioritized findings and project-specific roadmap hypotheses.
8. Watch further commits and operational signals, invalidating affected entities/chunks/findings with dependency-aware scheduling.

Monorepos use package/workspace graph and affected-path/test planning. Binary/3D/model artifacts use separate modality processors. Very large trees use resumable chunk manifests, not a single giant JSON response. Deleted/renamed content carries temporal lineage. Provider pagination/rate limits are checkpointed and observable.

## Mapping contracts

Code mapping includes language, file/symbol identity, signature/location and parser coverage. Dependency mapping includes resolved package versions, source provenance, transitive graph and SBOM. Data-flow mapping records source/sink edges, validation and confidence; dynamic cases remain unknown until traces or tests establish them. Architecture mapping identifies boundaries and deployment evidence, not just directories. API mapping includes auth/schema/version and compatibility. Feature mapping links requirements, tests, user flows and behavior with evidence.

Security mapping combines scanners/advisories/IAM/configuration evidence. Cost mapping joins resource inventory and authorized billing. Performance mapping joins benchmarks and runtime signals. Risk mapping records impact, probability/uncertainty, affected assets and mitigations. No score implies a complete audit when coverage is partial.

## Continuous missing-things detector

Rules are versioned expectations with applicability predicates, required evidence, failure condition, severity/confidence, suggested remediation and counterexamples. An expectation can derive from project requirements, environment policy, language/framework, user journey, architecture and business objective. Rules cover missing tests, validation, security controls, logging, API/pages/features/business logic, integrations/docs/optimization, revenue paths, product/market opportunities and competitive advantages.

Technical gaps should be evidence-based: “No recovery test for this declared critical payment flow in the analyzed scope,” rather than “the company has no tests” after a partial import. Business opportunities are hypothesis findings with market/customer evidence and experiment plans. A missing monetization path is not automatically a defect.

Finding identity includes tenant, subject entity/revision, rule version and evidence fingerprint. Disposition states are `open`, `investigating`, `accepted_risk`, `candidate_ready`, `fixed_unverified`, `verified_fixed`, `superseded`. A manual resolved click does not verify a repair. A change-based re-evaluation updates the current finding while preserving historical state/evidence. Severity can override prioritization but cannot authorize remediation.

Repository intelligence output contains coverage, freshness, architecture/dependency maps, threat/debt findings, score confidence, roadmap alternatives and prioritized action backlog. Subscribe to source/configuration/advisory changes and schedule bounded rescans; stop when consent is revoked. Improvement proposals feed the autonomous cycle, not an unconditional deployment loop.
