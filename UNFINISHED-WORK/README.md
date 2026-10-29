> **Current checkpoint — October 29, 2026:** [The planning/Imprint repair report](mgr-planning-imprint-wave-20261029.md) records the latest tested source. OmniDev passed 58/58 profiles; canonical states are 122 open and 52 implemented_unverified. Eleven local clauses are reproduced; no original parent is independently certified. Start from the existing root HANDOFF and MGR-TRILOGY-HANDOFF. Older checkpoint entries below are history. The owner requests concrete unfinished features, not aggregate shorthand.

# OmniDev Swarm — unfinished work

This is the single starting point for all known unfinished engineering, design, authorization, activation and verification work. It covers the original platform request and the account-first direction accepted on October 8, 2026 (America/Chicago).

## MGR Code Monster + OmniSight integration (2026-10-28)

The historical 174 parents below are preserved; **28 newly approved additive MGR upgrade requirements** live in [mgr-trilogy-upgrades.json](mgr-trilogy-upgrades.json). Requirements MGR-019–028 come from Time's 2026-10-28 explicit approval of the innovation wave; the full before/after and acceptance gates are [mgr-approved-innovation-wave.md](mgr-approved-innovation-wave.md). The implementation and before/after contract is [mgr-omnidev-upgrade-bible.md](mgr-omnidev-upgrade-bible.md). A machine-generated, **non-certifying** source-reference audit of all 174 parent IDs is in [mgr-174-source-reconciliation.md](mgr-174-source-reconciliation.md) with detailed JSON alongside it. Run `node scripts/reconcile-backlog.mjs` from repo root to refresh evidence. Existing file references are not proof that acceptance tests pass.

Do not merge the 28 new MGR IDs into the original count or mark historical items complete without per-item integration evidence. The owner has authorized source fixes; production, permission, credential, and destructive gates remain separate. Every verified change must update code, tests, evidence and the appropriate ledger entry together.

DeepSeek's revised SQLite event, territory-lock and census proposals are evaluated in [mgr-deepseek-round2-review.md](mgr-deepseek-round2-review.md). The ideas are approved for research and qualified adaptation, **not** direct production installation; the proposed event hash verifier and lease ownership model still contain correctness/security defects.

**174 original work items (123 open, 51 implemented_unverified; none independently certified):** the original 40 platform items, 39 individually tracked integrations and 47 executable specialist domains, plus 30 final-audit additions and 18 Version 2 completion upgrades. No item is marked complete merely because its UI or catalog entry exists. Future discoveries should be added here rather than kept only in chat.

## Current verified checkpoint — October 29, 2026

[Full verification and repair report](mgr-full-verification-wave-20261029.md): **54/54 local profiles passed**, **136/174 source-linked**, **327/327 paths present**, seven separately recorded local contract results. The 441 original clauses remain unchanged; local passes do not imply live provider/worker or final certification. Use the [current index](174-IMPLEMENTATION-INDEX.md) and [criterion register](mgr-174-acceptance-evidence-register.json) for current status. Older narrative workstream entries retain their historical planning context.

## Start here

1. Read [current-state.md](current-state.md) to see what actually exists and what the tests establish.
2. Follow [implementation-order.md](implementation-order.md) for dependency order and release gates.
3. Open the relevant workstream below. Every item includes a stable ID, current state, required work, completion criteria and dependencies.
4. Update [backlog.json](backlog.json) and its corresponding Markdown entry when work changes.

| Workstream | File |
|---|---|
| Agents, queue, coding and execution workers | [02-agent-runtime.md](02-agent-runtime.md) |
| GitHub and AI account connections | [03-account-connections.md](03-account-connections.md) |
| All requested integrations | [04-integration-inventory.md](04-integration-inventory.md) |
| Living graph and missing-things engine | [05-knowledge-and-gaps.md](05-knowledge-and-gaps.md) |
| Security, compliance and verification | [06-security-and-verification.md](06-security-and-verification.md) |
| Production deployment and self-healing | [07-production-and-self-healing.md](07-production-and-self-healing.md) |
| Measured digital twins and future states | [08-digital-twins-and-futures.md](08-digital-twins-and-futures.md) |
| Design, accessibility and user experience | [09-design-and-user-experience.md](09-design-and-user-experience.md) |
| Business, innovation and executive scores | [10-business-and-innovation.md](10-business-and-innovation.md) |
| Every master specialist domain | [11-specialist-domains.md](11-specialist-domains.md) |
| Data, memory, backups and platform scale | [12-data-memory-and-platform.md](12-data-memory-and-platform.md) |
| Release documentation and later GitHub copy | [13-release-and-github-handoff.md](13-release-and-github-handoff.md) |
| Original-request coverage | [requirements-map.md](requirements-map.md) |
| Decisions and unanswered product choices | [decisions.md](decisions.md) |
| Resume and completion instructions | [RESUME.md](RESUME.md) |

## Tracking rules

- **P0:** needed for a trustworthy operational development loop or material security/verification foundation.
- **P1:** next platform capability; schedule after prerequisites.
- **P2:** later domain expansion or cleanup. Priority is a proposed build order, not a time estimate.
- **Engineering:** code/design remains to be built.
- **Authorization:** the owner/provider must grant access; application code cannot grant it.
- **Verification:** implementation exists but real-world behavior is not yet demonstrated.
- **Future-user-instruction:** intentionally waiting for the later GitHub-copy request.
- Status values: `open`, `in_progress`, `blocked`, `implemented_unverified`, `verified`, `deferred`. Use `verified` only when all completion criteria have evidence. Deferred work stays visible with a reason.

Dependencies are sequencing guidance. Items may contain related subtasks and are not additive effort estimates. The integration and domain lists overlap platform work by design: they preserve coverage without pretending 47 named swarms are 47 completed departments.

No passwords, API keys, OAuth tokens or worker credentials belong in this folder. Keep secret values in supported protected runtime storage.

## Production architecture

The full target design, contracts, migration sequence and release gates are in [PRODUCTION-ARCHITECTURE](../PRODUCTION-ARCHITECTURE/README.md). Architecture documentation does not close the implementation items in the backlog.

## Living knowledge design — prompt 3

[Complete knowledge, memory, timeline and reasoning specification](../KNOWLEDGE-ARCHITECTURE/README.md). This extends the platform architecture and supplies detailed implementation gates; it does not close unfinished implementation tasks.

## AgentOS design — prompt 4

[Full agent operating-system specification](../AGENTOS-ARCHITECTURE/README.md). Lifecycle, scheduling, communication, debate, emergency response, economy and evolution contracts extend the earlier architecture. Implementation items remain open until proven.

## Experience design — prompt 5

[Complete UI/UX specification and wireframe atlas](../EXPERIENCE-DESIGN/README.md). Screen hierarchy, journeys, tokens, components, desktop/mobile and role modes. Design artifacts do not close live implementation tasks.

## Execution strategy — prompt 6

[Full company/product execution plan and financial scenarios](../EXECUTION-STRATEGY/README.md). Ten gated phases, MVP, staffing, pricing, growth, financing and risk. Forecasts do not change actual implementation status.

## Evolution architecture — prompt 7

[Complete evolution specification](../EVOLUTION-ARCHITECTURE/README.md). Learning, genetics, research, invention, adaptive organization and Omega governance. Implementation remains open; prompt 8 is reserved.

## Definitive Build Bible — prompt 8

[Integrated final architecture, audits and build backlog](../BUILD-BIBLE/README.md) is the normative consolidation layer. Prior packages remain detailed references; actual implementation claims require evidence.

[Final audit additions](14-final-audit.md) include exact evidence, withdrawal, evaluator independence, budget transfer, company operations and corrected economics.

[Version 2 completion review](../COMPLETION-AUDIT/COMPLETION-REPORT-V2.md) adds eighteen contracts. See canonical JSON for current work; V1 rendered backlog remains a historical snapshot.
