# Knowledge And Gaps

Use the canonical backlog for current recorded states; no parent is independently certified. See [README.md](README.md) for status definitions and resume rules.

## GRAPH-01 — Build a unified typed intelligence graph

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Graph extracts files, simple declarations/imports and manifest dependencies from snapshots. No full semantic or cross-system graph exists.

**Work required:**

- [ ] Define typed nodes and edges for files, classes, functions, methods, schemas, tables, APIs, services, deployments, assets, flows, decisions, documentation, conversations, cost and revenue.
- [ ] Add stable identities, provenance, timestamps, ownership and permission boundaries.
- [ ] Implement cross-source entity resolution, incremental updates and graph queries.
- [ ] Represent unresolved/isolated entities honestly and reconcile them as evidence arrives.

**Finished when:**

- [ ] Multiple connected systems share verified cross-source relationships.
- [ ] Updates/deletes do not leave stale edges or reveal unauthorized nodes.

**Depends on:** DATA-01, INT-01

**Starting files:** `../lib/analyzer.ts`, `../db/schema.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## GRAPH-02 — Add language-aware and runtime discovery

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Regex extraction does not establish full function/method signatures, business rules, dynamic behavior or runtime call relationships.

**Work required:**

- [ ] Add supported language parsers, API/schema discovery and infrastructure inventory.
- [ ] Ingest traces, deployments, user flows and business rules through approved adapters.
- [ ] Version analysis and preserve confidence/coverage per source.

**Finished when:**

- [ ] Fixtures and authorized real projects show correct entities and relationships.
- [ ] Unsupported languages and incomplete snapshots are labeled as coverage gaps.

**Depends on:** GRAPH-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## GAP-01 — Expand the missing-things engine

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Rescans preserve manual dispositions and reconcile snapshot signals. Image-alt presence and test-path recognition pass41 labeled local cases; production accuracy and remaining rules are not established.

**Work required:**

- [ ] Build evidence-based rules for missing pages, APIs, workflows, validation, security controls, monitoring, integrations, automation, architecture layers, accessibility and scale planning.
- [ ] Evaluate expectations against project type, requirements, user flows and repository coverage.
- [ ] Add product, monetization and opportunity gaps with explicit hypotheses and supporting research.
- [ ] Deduplicate findings, refresh dispositions and explain why each gap should exist.

**Finished when:**

- [ ] Known gaps are detected with actionable evidence and acceptable measured false-positive rates.
- [ ] Incomplete snapshots and business hypotheses do not become unsupported factual claims.

**Depends on:** GRAPH-02, BIZ-01

**Local evidence:** [Current repair report](mgr-planning-imprint-wave-20261029.md) and exact source-bound logs. Full original acceptance remains subject to its stated limitations; the checkbox is not independent certification.
