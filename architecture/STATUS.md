# OmniDev Swarm implementation status

Current unfinished work is tracked in [UNFINISHED-WORK/README.md](../UNFINISHED-WORK/README.md). This file preserves the implementation checkpoint.

The private React/Vinext console runs on a Cloudflare Worker with D1. The original records migration is preserved; migration 0001 adds durable jobs and encrypted runtime settings.

| Capability | Implemented behavior | Verification / dependency |
|---|---|---|
| Intelligence workspace | 47 master domains, nested swarm definitions, snapshot imports, knowledge graph, heuristic gaps, memory, scenarios, roadmaps | 31 SQLite-backed acceptance checks; public GitHub HTTP stubbed |
| Development runtime | Durable leases, bounded retries, cancellation, recovery, native candidate generation, AI root and up to two specialist reviews | Actual route handlers exercised with SQLite; provider HTTP stubbed |
| Provider access | Gateway, OpenAI, Anthropic fixed-origin adapters; AES-GCM credential vault; verification and disconnect | No live model credential configured |
| Candidate changes | Exact baseline checks, bounded patches, static checks, reviewed snapshot apply, guarded rollback, findings reconciliation | Source and finding read-back tested |
| Repository delivery | Encrypted repository-scoped GitHub token, write-permission verification, baseline comparison, branch and draft PR creation, idempotent stored handoff | GitHub writes stubbed; OAuth sign-in, private app manifest registration, repository selection and authenticated private snapshot imports implemented; live owner consent not completed; never merges |
| Execution worker | Authenticated polling, lease recovery, Docker test runner, restricted network and filesystem, resource limits, bounded output | Authorization and Docker arguments tested; no Docker available here |
| Self-healing | Native snapshot repair creates missing README and integrity tests; review, apply, recovery and rollback | Generated trusted fixture tests actually run locally; application behavior and production health are not verified |
| Design / browser interaction | Runtime and self-healing views, provider/repository setup, candidate diff, expert evidence, exports | Type checked and built; supported browser QA unavailable |
| Production self-healing | Requires telemetry, isolated execution and scoped deployment adapters | Not implemented as a production deployment capability |
| Universal integrations / full twins / invention | Catalog and planning foundation | Dedicated adapters, measured models and evaluation remain future work |

## Execution policy

AI jobs have a 60 KB context budget, 2,000 output tokens per call, three total execution attempts/model calls, at most two executed specialist reviews, and 12 patches capped at 500 KB total. Additional expert proposals are stored as proposals. Definitions may nest without a schema depth limit; execution is deliberately finite. Source and objective text are treated as untrusted data. Generated code never executes on the hosted application worker or unrestricted host.

Credentials are encrypted using the deployment's vault secret. Runtime API read-back exposes configuration metadata only. The private Sites gateway remains the owner access boundary; this is a single-owner workspace, not a public multi-tenant service. The Docker worker additionally needs its own bearer token and private gateway service credential, supplied through a secret manager.

## External activation blockers

The owner requested account sign-in instead of API-key entry. GitHub now uses owner-approved private-app registration and OAuth. Model-key entry and Vercel Gateway selection have been removed from the primary UI; existing adapters are retained for compatibility. ChatGPT plan usage in this remotely hosted app requires an approved OpenAI registration. The Sites identity sign-in does not grant model inference permission. The documented local ChatGPT flow is a separate deployment option; it has not been implemented or activated here. The OpenAI Developers plugin and Sites workspace-app eligibility lookup are unavailable in this session. No connector declarations have been invented.

An execution project named `omnidev-swarm-workers` was created on Vercel. Sandbox creation was denied with HTTP 403 for scope `tdmboyd-devs-projects`; no sandbox or deployment was started. Docker and alternate authorized Vercel credentials are unavailable. The runner is ready for an authorized Docker host, but no continuously running isolated worker is claimed.

## Test boundaries

Run `node tests/prepare.mjs`, `node tests/acceptance.mjs`, `node tests/runtime.mjs`, and `node node_modules/typescript/bin/tsc --noEmit`. Evidence is saved under `evidence/`. Tests exercise the actual API and storage code with SQLite. Provider and GitHub HTTP are stubbed, while generated trusted snapshot integrity tests run as real Node tests. Those checks do not establish live provider access, arbitrary application correctness, isolated Docker execution, production healing or browser interaction.

## Official implementation references

- https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create
- https://platform.claude.com/docs/en/api/overview
- https://vercel.com/docs/ai-gateway/openai-compat/rest-api
- https://docs.docker.com/engine/containers/run/
- https://docs.docker.com/engine/containers/resource_constraints/

## Account connection verification

GitHub account tests cover origin checks, secure cookie binding, encrypted application and account credentials, real provider URLs with stubbed HTTP, one-use callbacks, consent denial, expiry, refresh, metadata-only read-back, repository discovery, selection, private imports and disconnect. The published flow requires the owner to click GitHub consent; stubbed tests do not establish that consent.

Provider references:
- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
- https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest
- https://platform.claude.com/docs/en/cli-sdks-libraries/cli/authentication
- https://geminicli.com/docs/get-started/authentication/

## Version 2 completion/hardening checkpoint

Later than the historical tables above: atomic active-job admission; expiring source/candidate/test-digest worker assignments; compare-and-swap report acceptance; successful-report image/cleanup claims; and actual runner pinned image with awaited absence verification. Current tests:31 acceptance,72 runtime/account,6 simulated-Docker subprocess cleanup/wiring checks. Type checking passed. HTTP remains stubbed; real Docker execution, independent worker attestation and live account/deployed journeys remain unverified. Worker success claims carry isolationVerified:false. See COMPLETION-AUDIT/IMPLEMENTATION-EVIDENCE.md and the 174-task canonical backlog. The V1 Bible/PDF remain historical design snapshots.
