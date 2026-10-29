# Planning, evidence and Imprint repair wave — October 29, 2026

## What is working in this checkpoint

The committed OmniDev source passed **58/58 approved local profiles**, including its actual production build and TypeScript. The committed Code Monster source passed **113/113 tests**. The committed OmniSight source passed **39/39 checks**. A separate test exercised the actual Code Monster Imprint producer against the actual OmniSight projection, verifying 2 visible proposals, 1 in the restricted view and an unchanged source repository.

| Repository | Tested source commit | Exact evidence |
|---|---|---|
| OmniDev | `1c00a6105afe42b06a1d463d541f06c51839f9ad` | [58-profile report](evidence/planning-wave-20261029/run/report.json) |
| Code Monster | `166305de9fa380c3a9f28936d6d95f011531195a` | Companion repo `docs/evidence/imprint-slot-machine-20261029/committed-verification.json` |
| OmniSight | `a94ae4b478901bbe7b004677b706a3267f89204a` | Companion repo `docs/evidence/imprint-projection-20261029/committed-verification.json` |

These source revisions precede the documentation/evidence commits that record them. The source tests do not become a claim that subsequent arbitrary changes passed. Logs retain command arguments, exit status, hashes and environment limits; overlapping/nested suites are not added together as unique tests.

## Functional changes

OmniDev now generates evidence-based V2/V3/V5/V10 plans for an explicitly selected project. Each horizon contains evidence, uncertainty, dependencies, a testable milestone, an experiment, rollback conditions and a stop rule. Repeating the same evidence reuses the plan; changed evidence creates a linked version. Outcomes append to the issued proposal and retain the original contract. Stale source, revision and concurrent-save checks occur in the database transaction along with their history writes.

Decision records now expose outcomes, corrections and history. Lexical search retrieves the exact older revision whose words matched, retaining original decision/plan context separately from the source present when an observation was recorded. The interface shows that provenance and its limitations. Free-text creation is labeled as notes, and actual decisions use the structured workflow. Unused imports and obsolete display code were removed.

Rescans reconcile new, absent and returning findings while preserving owner dispositions. Security summaries and recommendation ordering use the same project scope as their rows. Scenarios remain visibly hypothetical and explicitly assigned or unassigned. Selecting a replacement backup clears the previous validation.

The gap scanner was evaluated on the **same final 41-case corpus before and after repair**. The original source made 19 incorrect classifications; the repaired source made 0. The corpus includes 26 image-attribute cases and 15 test-path cases. Image attributes are checked per element, with quoted values, JSX expressions and HTML comments handled. Recognized test paths include common directory, JavaScript, Python, Go, Ruby and Java conventions; names such as contest.ts and latest.json are not tests. These are deliberately selected regression examples, not an estimate of accuracy across customer repositories. Runtime attributes, semantic accessibility, SQL/eval/credential rules and broader product gaps remain unqualified.

Code Monster has one Imprint assembly engine using Slot Machine for constrained selection. Required slots, dependency order, frozen choices, path validation and content hashes fail closed. Plans require actual tests and owner approval; declared preference is not confidence. It uses the existing lease-fenced candidate writer and existing evidence ledger. New-file creation is explicitly absence-checked.

Signed receipt v2 binds the exact executable, arguments and working directory through a recomputed command digest. Batch replay also binds the complete canonical plan, source commit, candidate ref, agent/task, bytes and trusted candidate intent. The active Boolean verification branch was removed. Historical v1/Boolean events remain readable but cannot authorize new execution or silently migrate into v2.

OmniSight reads proposals through the existing owner-token boundary. Scope filtering occurs before visible counts; full-plan explanations/digests are withheld from partial path views. Empty comma-separated prefixes reject rather than grant whole-repository access. All four loaders invalidate old responses after token changes. Census refresh/failure/empty scope clears prior file selections. Nothing in this viewer approves, applies or certifies a proposal.

## Original requirement evidence

The original task identities and all acceptance text were compared against the prior source and preserved. FUT-01 moved to implemented_unverified because its bounded planning/evaluation contracts are now implemented. Other parents remain subject to their full requirements. The register now has 11 separately reproduced local clauses, while its one historical final REL-02 criterion and zero independently certified parents remain distinct.

| Original clause | Local status | What was exercised | Remaining condition |
|---|---|---|---|
| FUT-01/AC-01 | VERIFIED | Four horizons bind to actual selected snapshot/finding evidence and expose testable milestones, dependencies, unknowns and tradeoffs. | Local planning contracts only; real market/billing/runtime evidence and quality of broader business/architecture recommendations remain unqualified. |
| FUT-01/AC-02 | VERIFIED | Hypotheses retain unassessed confidence; outcomes append without altering the original proposal. Version lineage, source drift, stale forms and transaction races are tested. | Owner-recorded observations are not independent certification or calibrated predictions; real long-term outcomes remain to be measured. |
| AUD-20/AC-01 | VERIFIED | Each V2/V3/V5/V10 horizon records a reversible experiment, rollback instructions and explicit stop rule. | The local contract is reproduced; actual model/tool/compiler/schema replacement experiments remain to execute. |
| AUD-20/AC-02 | PARTIAL | Executed route/UI contracts and command/output hashes bind to the exact clean source commit. | Broader future-readiness experiments and independently attested review remain unqualified; design records alone cannot close the parent. |
| DATA-02/AC-01 | VERIFIED | Lexical search retrieves corrected historical outcome revisions and earlier future-plan versions with original/observed source context and exact record lineage. | Bounded local stored-record retrieval only; semantic retrieval, representative relevance evaluation and broader evidence ingestion remain incomplete. |
| DATA-02/AC-02 | PARTIAL | Invalid and other-project search scopes reject or exclude records; correction history is retained and stale updates fail atomically. | Actual tenant authorization, a complete retention policy, deletion/withdrawal convergence and production disaster recovery remain unqualified. |
| GAP-01/AC-01 | PARTIAL | Rescans reconcile additions/disappearance without duplicating signals and preserve manual dispositions. A fixed41-case two-rule corpus improves from19 errors to0. | No production false-positive threshold is established. SQL/eval/credential and other rules, project-type expectations and business hypotheses remain unmeasured. |
| GAP-01/AC-02 | PARTIAL | Snapshot-only limits are explicit; disappearance is not proof of repair; recommendations exclude resolved and accepted-risk signals. | Broader scanners and real repository coverage need evaluation; markup checks do not resolve runtime spreads or establish semantic accessibility. |
| TWIN-02/AC-01 | PARTIAL | Scenarios bind to an explicit selected source or stay unassigned; numerical inputs and outputs are labeled hypothetical owner assumptions. | Real authorized billing, revenue, traffic and staging measurements are not connected; calibrated forecasting is not established. |
| UX-03/AC-01 | PARTIAL | Future/decision/search surfaces invoke persisted route actions and render revision/source evidence, errors, empty states and history. | Actual browser keyboard, viewport and assistive-technology journeys and target-user usability remain unqualified. |

## Concrete limits and next build work

The planning system still lacks real billing, revenue, customer-demand, staging and calibrated forecast inputs. History retrieval is lexical; semantic retrieval, complete retention/withdrawal behavior and production tenant isolation remain unfinished. The rule corpus covers two narrow checks; language-aware extraction and the broader security/product rules need measured evaluation.

Imprint still needs an ordinary usable recipe/proposal entrypoint, persisted recipe policy and revocation, representative recommendation quality tests and whole-job benchmarks. The code engine still needs a qualified independent signer and isolated worker host, durable concurrent multi-agent integration and real authenticated coordination with OmniDev. Existing graph and scheduling kernels are not a production fleet.

OmniSight still lacks server-driven large-result pagination, live changes/freshness, a real semantic/dependency/runtime graph and authenticated multi-user views. Actual browser keyboard, viewport and assistive-technology qualification remain open: the connected extension lacked its originating context; cloud browser could not reach this local process; the official local Chromium download was truncated. Fake-DOM and React-render tests are reported accurately and do not replace that work.

The next wave must implement specific missing behavior from these requirements and produce an exhaustive concrete pending-work register, as requested by the owner. Do not replace that explanation with an aggregate task count.

## Preservation and publication

Existing handoffs are the restart authority. Dated current sections supersede old instructions; historical proof remains readable. Source code has one active receipt path and one loader per evidence type. No duplicate scheduler was added. GitHub publication is **not completed**: repository permissions were confirmed, an approved terminal push lacked terminal credentials, and the native plugin write returned `user rejected MCP tool call`. No prompt was confirmed pending. The connected Windows GitHub CLI was already signed in; this is not proof of a completed upload. Do not retry through another route to override that native rejection.

Code Monster and OmniSight checkouts began from materialized source snapshots. Before any later publication, reconcile their real remote ancestry without force-pushing or changing visibility. The source receipts and recoverable local commits remain authoritative for this work.
