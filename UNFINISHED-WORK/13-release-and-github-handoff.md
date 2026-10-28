# Release And Github Handoff

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## REL-01 — Prepare release documentation and operating evidence

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** README, architecture status and evidence files exist, but full operating/developer documentation is incomplete.

**Work required:**

- [ ] Add setup/upgrade guides, API contracts, environment prerequisites and runbooks for shipped capabilities.
- [ ] Define versioning, schema migration policy, supported versions and release validation.
- [ ] Consolidate evidence without replacing older historical results or claiming stubbed tests are live.

**Finished when:**

- [ ] A new authorized operator can set up, verify, recover and upgrade the platform using the docs.
- [ ] Release notes accurately distinguish engineering work, activation and verification.

**Depends on:** QA-01, OPS-04

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## REL-02 — Copy the project to the requested GitHub destination

**Priority:** P1 · **Type:** future-user-instruction · **Owner:** Unassigned

**Current state:** Source is maintained by Sites. The user plans to request a separate GitHub copy later; no destination has been selected.

**Work required:**

- [ ] Wait for the user's next explicit GitHub-copy instruction and destination/visibility.
- [ ] Verify the authenticated owner and repository permissions; choose create versus update explicitly.
- [ ] Include source, migrations, worker, docs, test evidence and this folder; exclude credentials, caches, build output and dependencies.
- [ ] Read back the pushed commit and folder structure; document how the GitHub copy relates to Sites publishing.

**Finished when:**

- [ ] User-designated GitHub repository contains the exact reviewed source and unfinished-work folder.
- [ ] No unrelated repository is modified and no secret is committed.

**Depends on:** No prerequisite task recorded.

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## REL-03 — Resolve the unused Vercel experiment

**Priority:** P2 · **Type:** cleanup-and-verification · **Owner:** Unassigned

**Current state:** An empty optional worker project was created; sandbox creation returned 403 and no running worker/deployment was established.

**Work required:**

- [ ] Confirm current resources before cleanup.
- [ ] Remove or explicitly archive only the unused experiment through an authorized supported operation.
- [ ] Keep Vercel out of required architecture and retain a truthful historical record of the failed attempt.

**Finished when:**

- [ ] No unwanted running resources or required Vercel dependency remain.
- [ ] Cleanup outcome is verified; absence of a supported delete operation is documented.

**Depends on:** No prerequisite task recorded.

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.
