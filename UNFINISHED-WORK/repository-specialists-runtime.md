# Repository traversal, specialist coordination and application runtime — 2026-10-09

## Implemented in this pass

- Immutable-commit GitHub traversal walks nonrecursive subtrees without the old 100-file snapshot limit. Each entry gets a persistent record; supported text blobs up to 100 KB are inspected once and receive content digests and static findings. Secret files, binaries, oversized files, dependencies, generated files, symlinks and submodules receive explicit exclusions. This is static heuristic inspection, not exhaustive semantic correctness proof. Source snapshots for model generation remain bounded.
- Transient failures retain queued records. Compare-and-set claims and stable entry IDs make retries deduplicate. Interrupted claims recover after two minutes. The browser resumes the latest audit, and an attached persistent worker can drive audit steps after browser closure. A GitHub-truncated individual directory fails rather than claiming complete coverage.
- Owner-enabled coordination routes up to two specialist reviews by domain. Local account specialist plans continue sequentially inside the companion after the page closes and save their results. Returning to the candidate's specialist buttons imports saved outputs without another model call. API reviews use independently assigned brains. Negative reviews block snapshot application and draft PR creation. Recommendations are bounded and do not imply arbitrary implementation agents or an unlimited engineering organization.
- A separate Node application worker profile runs declared typecheck, build and test scripts with offline npm ci, inside a pinned, non-root, network-disabled Docker container. Source stays read-only; compilation occurs in a bounded tmpfs. The fixed recipe, candidate digest, assignment expiry and cleanup receipt remain bound to reports. Missing manifests or meaningful tests block execution. Application reports cover the supplied candidate bundle, not absent repository files.

## Verification

Evidence: evidence/repo-completion.txt (13 completion checks, plus imported runtime regression suite), evidence/specialist-background.txt (5 real local HTTP/background-plan checks with fixture inference), evidence/specialists-ledger.txt, evidence/account-autostart.txt and evidence/companion-dashboard.txt. TypeScript and the production build must pass before publication.

## Remaining activation / qualification work

1. Attach a dedicated Docker host, pinned pre-pulled worker image and owner-private Sites service access. No Docker daemon exists in the authoring environment; no real isolation or application execution is certified here.
2. Application image needs a read-only /opt/omni-npm-cache seeded for the exact package-lock dependencies and no embedded credentials. Offline install fails on cache miss; it never opens network access silently.
3. Import a complete runnable source bundle before claiming whole-application test coverage. Existing bounded GitHub snapshots may omit required source. Full traversal inventories and inspects additional files but does not send an unlimited repository to a single model request or runtime assignment.
4. Qualify real provider/account inference, full browser-close/reopen import, platform-specific Docker behavior, representative integration services and private-repository rate limits. Integration tests requiring databases need a future explicitly configured isolated service topology; this profile supplies no production services.
5. API specialist coordination still depends on server requests; local specialist plans require the companion process to stay running. No computation runs while the host is off. Cross-provider background fleet orchestration and unlimited repair loops remain future platform work.

These limits stay open until evidence exists. They are not replaced with simulated success or 'perfect file' labels.
