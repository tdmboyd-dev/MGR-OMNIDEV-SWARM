# Data Memory And Platform

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## DATA-01 — Expand persistence and artifact storage

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** D1 stores records, snapshots, jobs and encrypted settings. R2 is not configured.

**Work required:**

- [ ] Normalize growing graph/job data where appropriate and add pagination/indexes instead of fixed record scans.
- [ ] Add artifact/blob storage for large snapshots, test logs, generated assets and 3D files.
- [ ] Define quotas, retention, source versioning, artifact hashes and cleanup.

**Finished when:**

- [ ] Large projects remain responsive within measured budgets.
- [ ] Artifacts have provenance, access controls and reliable lifecycle cleanup.

**Depends on:** No prerequisite task recorded.

**Starting files:** `../db/store.ts`, `../db/schema.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## DATA-02 — Build durable searchable global memory

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Activity and manually saved decisions persist; full searchable lifelong memory is not implemented.

**Work required:**

- [ ] Ingest decisions, bug/deployment history, debt, feature evolution, roadmaps, research, business/security/performance context.
- [ ] Add full-text/semantic retrieval with source references, project scope and version lineage.
- [ ] Add corrections, deletion/export and explicit retention policies; preserve durable backups rather than promise literal forever.

**Finished when:**

- [ ] Relevant historical evidence can be retrieved across project versions with provenance.
- [ ] Access, correction, retention and deletion are verified.

**Depends on:** DATA-01, SEC-02

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## DATA-03 — Add backup, restore and disaster recovery

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Snapshot rollback is implemented; database backup/vault-key rotation and disaster recovery are unverified.

**Work required:**

- [ ] Document protected database/artifact/credential backup and restore procedures.
- [ ] Implement vault-key rotation and recovery without committing secrets.
- [ ] Choose recovery objectives and run restore drills with audit evidence.

**Finished when:**

- [ ] A clean environment restores approved data and artifacts successfully.
- [ ] Lost/rotated credentials fail safely and can be reauthorized.

**Depends on:** No prerequisite task recorded.

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.
