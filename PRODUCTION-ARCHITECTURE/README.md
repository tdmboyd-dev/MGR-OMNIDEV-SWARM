# OmniDev Swarm — production architecture

Complete target architecture, reference contracts, migration decisions and production acceptance gates. This package specifies the full platform; it does not certify that the target services are deployed or that scale targets have been achieved. Existing implementation gaps remain tracked in [UNFINISHED-WORK](../UNFINISHED-WORK/README.md).

Read [FULL-ARCHITECTURE.md](FULL-ARCHITECTURE.md) for the consolidated design.

## Design chapters

- [System architecture and scale envelope](01-system-and-scale.md)
- [Microservices, ownership and process boundaries](02-services-and-boundaries.md)
- [Agent operating system, Omni Core and fractal swarms](03-agent-os-and-orchestration.md)
- [Database, graph, memory and vector architecture](04-data-graph-memory-vector.md)
- [Security, authentication, authorization and isolation](05-security-auth-and-isolation.md)
- [Events, messaging, streaming and workflow execution](06-events-messaging-and-workflows.md)
- [API and SDK architecture](07-api-and-sdk.md)
- [Universal integration, repository intelligence and missing-things engine](08-ingestion-repository-and-gaps.md)
- [Cloud infrastructure, global deployment and recovery](09-cloud-deployment-and-recovery.md)
- [Autonomous development and self-healing systems](10-autonomous-development-and-healing.md)
- [Digital twins, future prediction, innovation and competitive intelligence](11-digital-twins-futures-and-innovation.md)
- [Experience, workspace, UI and dashboard architecture](12-experience-workspace-and-dashboards.md)
- [Plugin architecture, agent marketplace and specialist departments](13-plugins-marketplace-and-domain-framework.md)
- [Cost tracking, metering, billing and analytics](14-cost-metering-billing-and-analytics.md)
- [Monitoring, executive intelligence, scoring and operating systems](15-observability-scores-and-operations.md)
- [Relational database design and data lifecycle](16-relational-schema-and-data-lifecycle.md)
- [Architecture decisions, evolution and implementation migration](17-decisions-evolution-and-migration.md)
- [Verification strategy and production gates](18-verification-and-production-gates.md)

## Engineering references

- [Requirements coverage](coverage-map.md)
- [Primary source references](source-references.md)
- [Verification results](validation-report.md)
- [PostgreSQL reference schema](contracts/core-schema.sql)
- [OpenAPI reference contract](contracts/openapi.json)
- [GraphQL composition contract](contracts/experience.graphql)
- [Event catalog](contracts/events-catalog.json)
- [Event envelope](contracts/event-envelope.schema.json)
- [Agent identity](contracts/agent.schema.json)
- [Delegated capability](contracts/capability.schema.json)

Reference contracts cover the core orchestration interfaces. Each service must supply its complete versioned contracts, migrations and tests before production release. Run `node PRODUCTION-ARCHITECTURE/validate.mjs` from the repository root.

## Living knowledge design — prompt 3

[Complete knowledge, memory, timeline and reasoning specification](../KNOWLEDGE-ARCHITECTURE/README.md). This extends the platform architecture and supplies detailed implementation gates; it does not close unfinished implementation tasks.

## AgentOS design — prompt 4

[Full agent operating-system specification](../AGENTOS-ARCHITECTURE/README.md). Lifecycle, scheduling, communication, debate, emergency response, economy and evolution contracts extend the earlier architecture. Implementation items remain open until proven.

## Experience design — prompt 5

[Complete UI/UX specification and wireframe atlas](../EXPERIENCE-DESIGN/README.md). Screen hierarchy, journeys, tokens, components, desktop/mobile and role modes. Design artifacts do not close live implementation tasks.

## Execution strategy — prompt 6

[Full company/product execution plan and financial scenarios](../EXECUTION-STRATEGY/README.md). Ten gated phases, MVP, staffing, pricing, growth, financing and risk. Forecasts do not change actual implementation status.

## Evolution architecture — prompt 7

[Complete evolution specification](../EVOLUTION-ARCHITECTURE/README.md). Learning, genetics, research, invention, adaptive organization and Omega governance. Implementation remains open; prompt 8 is reserved.

## Definitive Build Bible — prompt 8

[Integrated final architecture, audits and build backlog](../BUILD-BIBLE/README.md) is the normative consolidation layer. Prior packages remain detailed references; actual implementation claims require evidence.
