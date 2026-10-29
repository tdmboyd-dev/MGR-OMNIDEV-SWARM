# Snapshot security scanner and finding preservation — October 29, 2026

## Verified result

The saved security scanner work and its caller repairs are integrated. **All 60 local verification profiles pass** at source commit `e6701655ecad5f1c9d3fd7944b7ecec4191b0955`, including TypeScript and the production build. The source commit and generated test modules stayed unchanged throughout execution. This is local regression evidence, not a production release or independent acceptance of an original parent task.

The complete original remaining-work register is [remaining-detail-omnidev-20261029.json](remaining-detail-omnidev-20261029.json). It names each capability, working behavior, exact remaining actions, original acceptance wording and qualification limits. Do not treat an old `open` label as proof that no implementation exists.

## What changed for the user

- **Fewer misleading warnings:** JavaScript/TypeScript comments, quoted examples, regex literals and bound SQL parameter values are separated from the limited executable patterns the scanner recognizes. Query interpolation and additional credential literal forms are detected.
- **No disappearing warnings when inspection fails:** a rescan, snapshot apply or rollback preserves existing security findings and manual review choices when malformed or oversized source cannot be inspected.
- **Malformed replacement code does not pass the bounded inspection gate:** changes that the scanner cannot inspect fail that gate. Maintenance on another file may still proceed, with the incomplete comparison explicitly marked `not run`.
- **One verification path:** the new scanner and reconciliation suites are registered in the existing full runner. No duplicate worker or scheduler was added.
- **Plain scope:** a warning remains a heuristic requiring review. The scanner does not prove a vulnerability, validate a secret, execute submitted source or grant release approval.

## Before and after

| Defined scope | Before | After | Evidence |
|---|---:|---:|---|
| Same 60 hand-labeled security examples | 34 mismatches; 26 matches | 0 mismatches; 60 matches | `evidence/security-wave-20261029/baseline/security-baseline.json`, `run/securityGapEvaluation.log` |
| Scanner suite, including resource limits and disclosure checks | New bounded checks | 67/67 pass | `run/securityGapEvaluation.log` |
| Finding preservation and static gate behavior | 4 fail; 2 pass | 6/6 pass | `baseline/reconciliation-before.log`, `run/securityGapReconciliation.log` |
| Existing image/test-path gap examples | Earlier repaired checkpoint | 41/41 remain passing | `run/gapEvaluation.log` |
| Full local regression | 58 profiles at the prior source checkpoint | 60/60 profiles | `run/report.json` |

The 60 examples are a labeled regression corpus, not representative-production accuracy. The 67 scanner checks include those examples; do not add them together. Full profiles can import overlapping test suites, so the profile count is not a count of unique assertions.

The scanner baseline was freshly reproduced from `1c00a6105afe42b06a1d463d541f06c51839f9ad:lib/analyzer.ts`, with exact source and corpus hashes. The caller baseline was the recovered working snapshot containing the new scanner and original caller source from `0126c41dafcba0b6e46fb92cd2a9043e20987e56`; it was not a clean committed full-source baseline. Its four failures were reproduced again before applying the saved caller patch. The final passing full run is pinned to the new clean source commit above.

## Executed verification

Targeted repair commands:

```sh
node tests/prepare.mjs
node tests/security-gap-evaluation.test.mjs
node tests/gap-evaluation.test.mjs
node tests/security-gap-reconciliation.mjs
```

Pinned complete run:

```sh
node scripts/run-full-verification.mjs outputs/security-wave-full-expanded
```

This invokes the same runner as `pnpm verify:full`. Its 60 exact command receipts, output bytes and hashes are preserved in [evidence/security-wave-20261029/run/report.json](evidence/security-wave-20261029/run/report.json). All 60 output hashes were reread and matched. [verification.json](evidence/security-wave-20261029/verification.json) binds the source files, baseline and result; [manifest.json](evidence/security-wave-20261029/manifest.json) hashes the complete evidence set.

The first restricted execution attempt produced empty stdout/stderr for child Node processes even when they exited zero. The runner correctly refused to count zero-output results as proof. That complete failed attempt remains under `restricted-run/`. A controlled local execution probe demonstrated that expanded execution restored real stdout/stderr; the same source then passed the full run with no evidence checks disabled. Localhost and subprocess tests still do not qualify Docker or a deployed service.

## Original backlog and remaining work

All **174 parent IDs, 441 acceptance statements and 28 separate upgrades** are preserved. `backlog.json` and `mgr-174-acceptance-evidence-register.json` are unchanged by this wave. The recorded parent states remain **122 open / 52 implemented_unverified**, with zero newly independently certified parents. `GAP-01` remains partial against its complete original requirement.

The concrete remaining work includes:

- Project-type-aware expectations for missing pages, APIs, validation, workflows, architecture, monitoring and scale controls.
- Full language parsing, alias/binding resolution, semantic data flow and representative real-project scanner evaluation.
- Real isolated supervised workers, authenticated specialist execution and actual concurrent multi-agent campaigns.
- Live account consent, synchronization, refresh/revocation and provider-side delivery evidence.
- Semantic graph, retrieval, source history, impact analysis and measured business/revenue recommendations.
- Protected independent verification, authenticated owner release decisions and deployed cross-tenant boundaries.
- Actual browser, keyboard, assistive-technology, responsive and large-project journeys.
- The remaining named capabilities and clauses in the detailed register, including domain-specific, business, legal and operational qualification.

These are remaining engineering or qualification requirements. They are not all permissions blockers and should not cause independent work to stop. Root coordinates the companion repositories and the shared `MGR-TRILOGY-HANDOFF.md`. Remote publication, merge and deployment are separate outcomes and are not claimed by these local receipts.
