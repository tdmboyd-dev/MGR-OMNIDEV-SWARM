# OmniDev: owner handoff, 2026-10-28

Decision: keep this as Tevin's software engineering department. Begin with read-only repository inspection and bounded patch proposals. Tevin remains the owner-facing coordinator; OmniDev does not become another authority over the ecosystem.

What exists: a React/Vinext dashboard; SQLite-compatible Cloudflare D1 storage; project imports and source ledgers; heuristic source analysis; durable queued jobs; candidate patches; specialist evidence reviews; explicit decisions for snapshot application and rollback; an isolated execution worker; and a local ChatGPT companion. Specialist names describe review areas, not 48 separately certified tools. Static inspection and model opinions do not prove a program ran.

This audit preserves upstream revision26e230d052c45c1f42cb731ff095679497af045a on audit/ecosystem-2026-10-28. It does not overwrite the active upstream project or publish these repairs.

Repairs in the app/storage lane:

- Imports and candidate patches reject Windows device names, alternate streams, drive paths, traversal, trailing dots/spaces, secret files and Git internals. Case aliases cannot create ambiguous duplicate files. Imported content uses actual UTF8 byte limits.
- Cancel, reject and retry now check the current saved job status during the update. A concurrent completed application cannot be relabeled canceled by a stale browser request. Stale decisions return an error that requires refresh.
- GitHub snapshot and full-audit selection also exclude secret/Git path case aliases such as .ENV.json and .GIT/config.json.
- TypeScript incremental build state stays out of version control. The carousel now releases both event listeners, and form wrappers report missing field/item context before accessing invalid state.

Independent worker/companion lane adds its own report and tests; consult that handoff for request binding, worker isolation boundaries and durable local job storage repairs. The signed historical engine release is preserved. Its signature does not certify these newer source repairs or authorize distribution of a newly signed installer.

Proof boundary: local compilation, production bundling, in-memory SQLite route tests and controlled HTTP fixtures are reproducible. No actual GitHub write, paid model run, authenticated ChatGPT account session, attached Docker host, deployment or production owner gateway was exercised here. Those capabilities remain unverified.

The highest-value next work is a narrow Tevin adapter that accepts an approved immutable snapshot and returns source hashes, exact reading scope, proposed changes and evidence. Keep external writes disabled until the owner identity, request binding, host qualification, provider budget and exact write target have been proven. The ecosystem registry deliberately exposes no live OmniDev MCP tools yet.

Open issues and exact next steps:

1. Production owner boundary: API routes depend on the Sites hosting gateway, while the loopback development preview supplies a local mock identity. Before exposure, verify unauthenticated requests are denied at the actual host; add an explicit scoped adapter identity for Tevin, bound to tenant, actor and approved operations. An Origin check alone is not authentication.
2. Immutable public GitHub import: resolve the branch once to a commit/tree and fetch blobs by their immutable SHA, rather than reading moving branch URLs. Test a branch movement between inventory and content fetch and require one consistent source digest. The full audit path already uses immutable tree/blob identifiers.
3. Job enqueue request binding is now repaired: a canonical SHA256 binds the source snapshot, objective, mode, selected brain/specialist, review options and test profile. Changed intent returns409; exact replay returns the original durable job. Old jobs without a digest require reconciliation rather than silently assume equivalence.
4. Remaining source corpus: exact full/partial/unread ledgers accompany the package. Runtime reading is combined from several reviewers; historical architecture documents, packaged releases and large lockfiles are not all semantically reviewed. Do not call all520 files read merely because an inventory exists.
5. Input byte limits are now repaired: five POST routes enforce bounded stream reads before full string/JSON allocation; invalid UTF8 is denied. Candidate patches enforce100000bytes per file and500000bytes total. Worker source byte limits have a separate lane receipt. Host connection deadlines and network-rate limits still need deployed-host qualification; these tests do not certify resistance to every resource exhaustion attack.

Recommended expansion: source receipt first; bounded repair proposal second; independent test worker third; owner-approved repository write last. This is cheaper, easier to recover and more useful than giving every named specialist broad autonomous write access.
