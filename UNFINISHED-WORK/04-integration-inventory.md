# Integration Inventory

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## INT-01 — Create reusable integration execution contracts

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog registrations do not connect systems; only bounded GitHub/snapshot adapters have execution code.

**Work required:**

- [ ] Define source identity, authentication, scopes, target resources, discovery, ingestion, incremental sync and actions.
- [ ] Add rate limits, pagination, retry/backoff, webhook validation, freshness, deletion and provenance.
- [ ] Build secret-safe server or local bridge contracts for HTTP, filesystem and TCP systems.
- [ ] Keep provider operations explicit and testable; no arbitrary connector proxy or token copying.

**Finished when:**

- [ ] Every adapter follows a verified lifecycle and common capability/error contract.
- [ ] Cross-source permission boundaries and revoked access are enforced.

**Depends on:** AUTH-04, DATA-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-01 — GitHub integration

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Bounded snapshot ingestion and OAuth adapter implemented; live consent and advanced sync/CI remain unverified.

**Work required:**

- [ ] Add pagination, incremental sync/webhooks, organization installation verification, larger repositories and authenticated PR/CI evidence beyond the current bounded snapshot adapter.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-02 — GitLab integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover projects/branches/merge requests, import source and CI evidence, and create reviewed merge requests through scoped authorization.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-03 — Bitbucket integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Support workspace/repository authorization, branch snapshots, pull requests and Pipelines evidence.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-04 — Azure DevOps integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Support organization/project authorization, repos, work items, pipelines and reviewed pull requests.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-05 — Local Projects integration

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Manual text snapshots supported; dedicated live bridge not implemented.

**Work required:**

- [ ] Build an owner-approved local bridge with selected project roots, safe source ingestion and watched updates.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-06 — Local Directories integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Manual text snapshots supported; dedicated live bridge not implemented.

**Work required:**

- [ ] Implement explicit directory grants, path/symlink containment, filesystem change detection and revocation.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-07 — Monorepos integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Manual text snapshots supported; dedicated live bridge not implemented.

**Work required:**

- [ ] Discover packages, ownership, dependency boundaries, build/test selection and affected-project analysis at scale.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-08 — AWS integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized accounts/services/IAM/deployments and billing; add target-scoped infrastructure plans and actions.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-09 — Azure integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover subscriptions/resources/identity/deployments and billing with scoped workload authorization.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-10 — Google Cloud integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover projects/services/IAM/deployments/billing and supported model permissions.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-11 — Digital Ocean integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover projects, droplets, clusters, storage and billing; add scoped reviewed operations.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-12 — Kubernetes integration

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Read selected clusters/namespaces/workloads/RBAC/events; add reviewed manifest rollout and rollback.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-13 — Docker integration

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Docker test runner implemented; ecosystem discovery and real execution unverified.

**Work required:**

- [ ] Discover selected hosts/images/containers and build provenance; distinguish platform test isolation from ecosystem inventory.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-14 — PostgreSQL integration

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-15 — MySQL integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-16 — SQL Server integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-17 — MariaDB integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-18 — MongoDB integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-19 — Neo4j integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-20 — Redis integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-21 — Firebase integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-22 — Supabase integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-23 — Figma integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Ingest authorized files/components/flows and connect designs to implementation entities.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-24 — Adobe XD integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Determine a currently supported export/plugin bridge and map design assets/flows with version and availability limits.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-25 — Sketch integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Build authorized document/export/plugin ingestion for symbols, components and user flows.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-26 — Blender integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Build a version-aware bridge for scenes, objects, materials, rigs, render jobs and validated asset outputs.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-27 — Maya integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Build a version-aware scene/asset/plugin bridge with licensed runtime execution and artifact provenance.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-28 — Cinema4D integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Build licensed version-aware scene/asset/render ingestion and controlled execution.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-29 — Notion integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Sync approved pages/databases with stable identities, permission boundaries and change/deletion handling.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-30 — Confluence integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Sync selected spaces/pages, decisions and history with permissions and freshness.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-31 — Slack integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Ingest authorized channels/conversations and decision links; scope any write action separately.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-32 — Teams integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Ingest authorized teams/channels/messages and map decisions without expanding visibility.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-33 — Email Systems integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Select supported providers and folders, ingest authorized correspondence and extract decisions with retention controls.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-34 — Internal Documentation integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Support approved document formats/sources, versioning, source attribution and deletion.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-35 — APIs integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Ingest OpenAPI/GraphQL/schema contracts, authenticated discovery, compatibility and scoped test actions.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-36 — Microservices integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Map service inventory, contracts, dependencies, traces, deployments and ownership across targets.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-37 — Legacy Systems integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Build protocol/version-specific bridges; preserve unsupported coverage and test migration plans.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-38 — ERP Systems integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Select target products and map authorized workflows, business rules and financial entities.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## CONN-39 — CRM Systems integration

**Priority:** P2 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Catalog entry only; dedicated live adapter not implemented.

**Work required:**

- [ ] Select target products and map customer/workflow/revenue entities with privacy and access controls.
- [ ] Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

**Finished when:**

- [ ] Authorized real-source discovery and incremental read-back are demonstrated.
- [ ] Denial, revocation, service failure and unsupported actions fail safely.
- [ ] Writes, if shipped, have separate target-specific tests and policy.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.
