# Primary source references

Consulted October 8–9, 2026. Capacity, SLOs, service decomposition, default limits and score weights are OmniDev design decisions, not vendor promises. Pin versions and reverify edition, licensing and auth availability before implementation.

| Primary reference | Design relevance |
|---|---|
| [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | FORCE RLS and privileged-role exceptions |
| [Neo4j composite databases](https://neo4j.com/docs/operations-manual/current/scalability/composite-databases/concepts/) | Edition-specific graph federation capabilities |
| [Temporal workflow definition](https://docs.temporal.io/workflow-definition) | Deterministic workflow execution |
| [Temporal child workflows](https://docs.temporal.io/child-workflows) | Child lifecycle and bounded workflow histories |
| [Qdrant multitenancy](https://qdrant.tech/documentation/manage-data/multitenancy/) | Tenant filtering and partition strategies |
| [Kafka design](https://kafka.apache.org/41/design/design/) | Messaging guarantees versus external side effects |
| [SPIFFE overview](https://spiffe.io/docs/latest/spiffe-about/overview/) | Workload identity |
| [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) | Baseline container restrictions; not a hostile-code microVM guarantee |
| [Sign in with ChatGPT](https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt) | Provider-approved account authorization pathways |
| [ChatGPT token sharing](https://developers.openai.com/siwc/token-sharing-open-source) | Local open-source account flow; hosted registration must be verified |
| [GitHub App manifests](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest) | Private app registration and consent |
