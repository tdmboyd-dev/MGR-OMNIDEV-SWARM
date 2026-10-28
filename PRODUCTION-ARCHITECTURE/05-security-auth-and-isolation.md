# Security, authentication, authorization and isolation

## Trust boundaries

Separate human devices, edge/BFF, cell services, model providers, connector executors, untrusted-code sandboxes, customer environments, marketplace publishers and cross-tenant analytics. Every boundary has authenticated identity, a permitted data contract and an explicit action scope. Repository text, documentation, issues, model output, agent messages and plugins are untrusted inputs; signed provenance establishes origin, not correctness or permission.

Human authentication supports enterprise OIDC and SAML federation, passkeys/MFA and managed workforce provisioning through SCIM. Customer organization linking requires verified membership, not matching email domains alone. Desktop/mobile use authorization-code flow with PKCE in the system browser and protected OS credential storage. CLI supports browser or provider-supported device authorization. Browser sessions use HttpOnly, Secure cookies, origin/CSRF checks, short access lifetimes and server-side revocation. Workspaces never receive provider passwords.

The current Sites sign-in remains the owner-private prototype entry point. Production Identity Service maps it into an organization/session model only through a documented trusted assertion. GitHub authorization is a separate connection. ChatGPT/model account authorization is another separate grant; identity login alone does not authorize inference. Supported hosted plan usage requires the provider-approved integration. Google login can identify a person or authorize particular Google resources; it grants no blanket access to every AI provider.

## Authorization model

RBAC establishes organizational roles: owner, administrator, security administrator, billing administrator, engineer, reviewer, researcher, auditor and viewer. Agent/service principals have no default human role. ABAC evaluates tenant/project membership, environment tier, action class, resource labels, source classification, device assurance, region, approval, time window, cost and incident context. Explicit deny wins; membership alone cannot authorize production deployment.

Action tiers:

| Tier | Examples | Decision requirements |
|---|---|---|
| Read | Scoped source/graph/memory retrieval | Current resource grant and residency policy |
| Propose | Candidate code, finding, plan, report | Read grant; output classification inherited from sources |
| Sandbox | Build/test/scan in isolated replica | Approved image/tool class, compute/cost reservation, artifact policy |
| Repository write | Branch or draft PR | Target-scoped connection, exact candidate/revision digest and write grant |
| Staging release | Reviewed target changes | Test evidence, environment grant, approved plan and rollback |
| Production change | Deployment, data migration, containment | Current authorization, approval policy, maintenance/blast-radius limits and fresh health evidence |
| Financial/admin | Billing change, permission change, secret export | Strong reauthentication and dedicated role; agents cannot self-grant |

A capability is signed, audience-bound and references `{tenant, principal, project, action, targets, input_digest, authority_epoch, policy_version, grant_epoch, reservation_id, expires_at, nonce}`. Tool broker verifies it immediately before dispatch. Delegation intersects parent grant and template policy; no child can increase privilege. Production approvals bind exact artifact digest, target, plan, source revision and expiry. Any material change invalidates approval. Separation of duties prevents proposer from being its only required approver.

Revocation increments a grant epoch in authoritative storage and distributes invalidation. Sensitive dispatch performs a fresh authoritative epoch check, not just a cached JWT check. Ordinary reads may have a documented short revocation window; new release/write actions fail closed during uncertainty. Signed routing epochs and fenced control-store ownership prevent an old region from dispatching after failover.

## Multi-tenant enforcement

Tenant context is derived from authenticated membership and route ownership. Browser-supplied tenant IDs are selectors to validate, not authority. PostgreSQL service roles have no BYPASSRLS and do not own tables; enable and FORCE row security. RLS adds defense in depth, while service-level project/action checks remain mandatory. A transaction-local tenant context is set by trusted middleware and reset by pool boundaries; leaked pooled context is a test case. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Neo4j, Qdrant, object storage, Redis keys, message topics and metrics queries all require server-owned tenant/project scoping. Dedicated cells offer stronger physical isolation but still need authorization. Download URLs are short-lived, bound to current classification and permission where feasible, and never authorize listing another prefix. Egress checks cover redirects, DNS rebinding and cloud metadata endpoints. Resource counts, search suggestions and graph neighborhoods must not disclose forbidden entities.

## Encryption modes

Baseline: TLS on external paths, authenticated service-to-service encryption, envelope encryption at rest with per-tenant data keys wrapped by regional KMS. Customer-managed keys and tenant key revocation are enterprise options. Secrets use vault handles and short-lived workload credentials; source content does not enter metrics, exception text or invoice descriptions.

True end-to-end encrypted workspace mode: keys stay on approved customer clients or customer-controlled execution agents. Server stores ciphertext and minimal routing metadata. Plaintext parsing, embedding, inference and twin execution occur in the customer-controlled boundary; server-side graph/search is limited to intentionally disclosed metadata or encrypted artifacts. An external model provider receives plaintext only with an explicit customer-controlled decryption/inference grant. This mode changes available features and diagnostics.

Server-assisted confidential-processing mode is a separate option with attested compute and restricted keys. It is not described as server-blind E2EE. No architecture simultaneously promises server access to arbitrary plaintext for AI analysis and that the server cannot decrypt it. Cryptographic mode is selected per workspace and propagates through ingestion, search, jobs, support and retention.

## Workload and sandbox identity

Use SPIFFE/SPIRE-compatible short-lived workload identities and explicit trust-domain federation between approved regional services. Node/workload attestation precedes capability issuance; service accounts or Kubernetes labels alone are not proof of isolation. [SPIFFE overview](https://spiffe.io/docs/latest/spiffe-about/overview/).

Untrusted repository code runs in disposable microVMs or comparably reviewed stronger isolation on a separate node/network/account pool. Hardened containers suffice only for lower-risk trusted maintenance profiles after threat assessment; they are not the default multi-tenant hostile-code boundary. Read-only base image, unprivileged UID, restricted syscall/capability profile, no host Docker socket, no host mounts, no metadata access, no cloud credentials, bounded CPU/RAM/PIDs/disk/output/time and controlled network egress are mandatory. Kubernetes Restricted standards are a baseline for service pods, not proof of a sandbox boundary. [Pod security standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/).

A sandbox receives immutable sanitized input objects and a narrow artifact upload capability. Repository write and production credentials stay outside it in the tool broker. Dependency network access uses an approved package mirror/proxy with digest records, never unrestricted internet. GPU/render/licensed runtimes have separate pools with license accounting and device-isolation tests. Artifact scanning and provenance verification happen before another tenant or a release consumes output.

## Detection, supply chain and compliance

Collect audit facts for identity, grants, consent, secret access, tools, approvals, execution admission, repository writes, deployments, billing and support access. Hash-chain or signed batch roots plus WORM-capable retention protect evidence against undetected alteration; a hash does not make a log legally compliant by itself. Regional clocks are monitored, and event sequence/receipt times preserve causality when clocks disagree.

Signed builds, SBOMs, verified source/image digests, dependency advisories, publisher identity and restricted build workers protect the supply chain. Threat detection covers token misuse, unusual extraction volumes, cross-tenant requests, suspicious model/tool instructions, sandbox network escapes and financial abuse. Support access uses time-bound reasoned grants and customer-visible audit, with no unrestricted plaintext access in E2EE mode.

Compliance is a control/evidence program with mapped scope, retention, residency, incident response and independent review. The design supports applicable standards; it does not certify them. Authorized penetration testing uses explicit target scope, safe test windows and data handling; a security agent cannot discover and attack arbitrary external systems.
