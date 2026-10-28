# Plugin architecture, agent marketplace and specialist departments

## Plugin artifact contract

A plugin is a signed immutable release containing manifest, publisher identity, runtime/module digest, requested capabilities, supported API versions, configuration schema, declared tool endpoints, resource classes, data destinations, dependency/SBOM manifest, evaluation results and rollback/upgrade constraints. Components can include connector adapter, parser/scanner, sandbox tool, agent template, UI extension, twin model or domain evaluator. Each kind has a distinct capability contract.

Manifest fields include `plugin_id`, `version`, `publisher`, `artifact_digest`, `signature`, `min_platform_api`, `capabilities`, `network_destinations`, `data_classifications`, `residency_support`, `execution_profile`, `tool_schemas`, `billing_model`, `license`, `compatibility` and `provenance`. Installation pins digest/version, tenant/project scope and approved capabilities. An upgrade requesting new permissions requires fresh approval; no mutable “latest” bypasses review.

Server plugins execute in restricted services or sandbox pools through the Tool Broker. Declarative UI plugins render in isolated frames with a typed host bridge and restrictive content/security policy; they receive selected authorized view data, not ambient session tokens. Native/desktop plugins need code signing and OS grant boundaries. Prompt templates are untrusted instructions unless incorporated into a reviewed template policy; they cannot redefine platform authority.

## Marketplace workflow

Publisher registration/identity verification → signed submission → malware/dependency/license review → isolation and permission tests → domain-quality evaluations → review/risk tier → immutable published release → tenant installation consent → monitored execution → revocation/update/rollback. Security emergency revocation blocks new execution and invalidates capabilities; existing outputs retain provenance and may need re-evaluation.

Marketplace discovery shows evaluated capability, supported environments, permissions/data destinations, cost model, update history and independent review results. Ratings distinguish task evidence from subjective feedback and detect abuse/Sybil activity. Publisher payout uses the billing ledger, settlement windows, refund/chargeback reserves and verified tax/payment onboarding handled by a supported financial provider. No platform agent may autonomously accept financial/legal terms or install a privileged plugin globally.

## Agent template marketplace

An agent template supplies specialization, prompt/instruction digest, input/output schemas, required tools, memory selectors, supported models, evaluation rubric, cost limits and collaboration policy. It has no credentials or inherited grants. Tenant administrators can restrict models/tools/publishers and require internal review before use. Agent templates are data consumed by the Agent OS; purchasing a template does not grant production deployment authority.

A template promotion compares held-out task quality, unsupported claims, security violations, regression rate, latency and cost against the prior version. Correlated model reviewers and contaminated evaluation sets are disclosed. Enterprise private marketplace supports organization-specific templates with no public leakage of source or business strategies.

## Domain framework

All 47 domains in `../UNFINISHED-WORK/11-specialist-domains.md` use the same agent/task/evidence protocol. Root swarms group execution capability without forcing every specialty into a separate service. Security/Cyber Defense/Penetration Testing require authorized targets and reviewed tools. Backend/Frontend/Mobile/Testing/QA produce behavioral implementation and tests. DevOps/Cloud/Infrastructure/Networking produce scoped plans and deployment evidence. Database specialists validate integrity/migrations/recovery. AI/ML/LLM/RAG/vector specialists evaluate data/model/retrieval quality and privacy.

3D/Blender/Maya/Unity/Unreal/Game specialists use version-aware scene/asset adapters, sandboxed GPU/licensed pools, deterministic artifact manifests and render/playability/performance checks. UI/UX/Accessibility use task journeys and assistive evidence. Documentation/Research/Open Source/Dependency specialists retain source/version/licensing provenance. Business/Product/Customer/Revenue/Competitive/Innovation/Future specialists distinguish observations, hypotheses and validated experiments. Compliance/Legal specialists map scoped controls and qualified-review requirements rather than certify outcomes autonomously.

New technologies create proposed domain/template registrations, not instant privileged tools. The discovery workflow gathers references, drafts schemas/evaluations, performs review and then admits a versioned specialist. Emergency/investigation agents inherit incident scope, expiry and budget and retire after the incident. Temporary agents and permanent departments share retained lineage and auditable retirement.
