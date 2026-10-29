# OmniDev Swarm

A private software intelligence workspace with snapshot analysis, durable development jobs, bounded AI specialist reviews, candidate patches, repository delivery and a restricted execution worker.

Use **Agent runtime** to inspect AI account connection availability, import a project, generate a native or AI candidate, inspect patches and reviews, and apply or roll back changes to the stored snapshot. **Self-healing** uses the same reviewed workflow for repair jobs. Native maintenance generates missing documentation and snapshot-integrity tests; it does not act as an LLM or prove application behavior.

Sign in to GitHub, install your private OmniDev GitHub app on selected repositories, and verify the selected repository to create draft pull requests for candidates whose imported provenance matches the repository. Current repository file contents must match the preserved baseline. The application does not merge changes or deploy production repairs.

The hosted orchestrator is implemented. Isolated test execution requires an authorized Docker host running `worker/runner.mjs`; see `worker/README.md`. The primary UI now uses account connections rather than API-key entry. GitHub registration, consent, encrypted OAuth sessions, automatic refresh, repository selection and private snapshot import are implemented. Live sign-in needs the owner to approve GitHub consent. Direct ChatGPT plan usage in a remotely hosted app requires OpenAI registration approval; it is not supplied by the workspace sign-in. The portable runner does not depend on Vercel. No continuously running isolated host has been attached.

The existing intelligence workspace includes 47 master swarm domains, nested definitions, public GitHub and local text snapshots, extracted dependency graphs, rule-based security/gap signals, durable memory, illustrative capacity scenarios and template-based future roadmaps. Catalog registrations do not establish working integrations.

Keep this release owner-private. The Sites gateway supplies the owner authorization boundary. API mutations reject cross-origin requests, use prepared statements, and keep credential plaintext out of read-back. Imported snapshots are bounded and detected credential patterns are redacted; exclude secrets before import because detection is heuristic.

## Verification

```
node tests/prepare.mjs
node tests/acceptance.mjs
node tests/runtime.mjs
node node_modules/typescript/bin/tsc --noEmit
```

See `architecture/STATUS.md` and `evidence/` for exact capabilities, evidence and external dependencies. Provider and GitHub HTTP tests use stubs. Generated trusted snapshot tests execute locally. Browser QA and Docker execution were unavailable.

## Resume unfinished work

Use [UNFINISHED-WORK/README.md](UNFINISHED-WORK/README.md) as the single index for outstanding engineering, design, account activation and verification. It includes the full integration/domain inventories, dependency order, completion criteria and instructions for the later GitHub copy.

## Production architecture

The full target design, contracts, migration sequence and release gates are in [PRODUCTION-ARCHITECTURE](PRODUCTION-ARCHITECTURE/README.md). Architecture documentation does not close the implementation items in the backlog.

## Living knowledge design — prompt 3

[Complete knowledge, memory, timeline and reasoning specification](KNOWLEDGE-ARCHITECTURE/README.md). This extends the platform architecture and supplies detailed implementation gates; it does not close unfinished implementation tasks.

## AgentOS design — prompt 4

[Full agent operating-system specification](AGENTOS-ARCHITECTURE/README.md). Lifecycle, scheduling, communication, debate, emergency response, economy and evolution contracts extend the earlier architecture. Implementation items remain open until proven.

## Experience design — prompt 5

[Complete UI/UX specification and wireframe atlas](EXPERIENCE-DESIGN/README.md). Screen hierarchy, journeys, tokens, components, desktop/mobile and role modes. Design artifacts do not close live implementation tasks.

## Execution strategy — prompt 6

[Full company/product execution plan and financial scenarios](EXECUTION-STRATEGY/README.md). Ten gated phases, MVP, staffing, pricing, growth, financing and risk. Forecasts do not change actual implementation status.

## Evolution architecture — prompt 7

[Complete evolution specification](EVOLUTION-ARCHITECTURE/README.md). Learning, genetics, research, invention, adaptive organization and Omega governance. Implementation remains open; prompt 8 is reserved.

## Definitive Build Bible — prompt 8

[Integrated final architecture, audits and build backlog](BUILD-BIBLE/README.md) is the normative consolidation layer. Prior packages remain detailed references; actual implementation claims require evidence.

## Completion audit and engineering hardening — Version 2

[Delta report](COMPLETION-AUDIT/COMPLETION-REPORT-V2.md), [upgrade contracts](COMPLETION-AUDIT/upgrade-contracts.json) and [implementation evidence](COMPLETION-AUDIT/IMPLEMENTATION-EVIDENCE.md). The V1 Bible remains historical; current canonical backlog contains 174 tasks.

## Latest implemented platform slice

**Evidence & recovery** now searches persisted records, captures structured decisions, exports integrity-checked backups and restores only into an empty workspace. Agent identities and advisory debates are exposed through `/api/agents`. Effect reservations and a stop switch protect snapshot changes and requested draft PRs.

**ChatGPT companion** mode exports a source-bound job request. The portable [local companion](companion/README.md) implements eligible account consent and Responses streaming without an API key; import its generated candidate for server validation and review. Tokens remain local. Live account execution is not yet verified, and hosted website approval is separate.

Run `node tests/platform.mjs` after preparation for the additional 52 platform/protocol checks. See [latest execution evidence and limits](UNFINISHED-WORK/build-pass-2026-10-09.md).

## Full verification of the current review candidate

Run `pnpm verify:full` from a clean committed checkout after installing the pinned lockfile. It rebuilds test modules, type-checks and builds the app, executes all reviewed regression profiles, records exact source/output hashes, and retains failures in `outputs/full-verification/`. Follow [the full workflow](UNFINISHED-WORK/FULL-VERIFICATION-WORKFLOW.md) for criterion-level evidence and final approval. Local fixtures do not certify external providers, Docker or production release.
