# MGR Trilogy — operator Bible and how-to

October 30, 2026. This is the practical guide for the current implementations. The full target plans remain in `BUILD-BIBLE/`, Code Monster's `docs/PRODUCT-BIBLE.md` and OmniSight's `docs/PRODUCT-BIBLE.md`. A design in those plans is not automatically a working feature. Read each newest `HANDOFF.md` and the combined `MGR-TRILOGY-HANDOFF.md` for the source-bound current checkpoint.

## What it is and what to use it for

The Trilogy is a coordinated development workflow made from three separately owned products. It helps inspect source, propose bounded changes, execute authorized verification and display the evidence. It is intended to become a set of tools Tevin can use through MGR's shared edge. Current local integrations do not establish a deployed autonomous development company or unrestricted self-repair service.

| Component | Owns | Use it when |
|---|---|---|
| OmniDev Swarm | Imported projects, development jobs, existing worker fleet, budgets and owner decisions | You need to request, review, verify or deliver a scoped project change |
| Code Monster | Commit-pinned census, Imprint/Slot Machine proposals, fenced candidate writes and durable evidence | You need exact source inventory, a bounded candidate or signed proof bound to that candidate |
| OmniSight | Permission-scoped projections and evidence navigation | You need to inspect permitted files, proposals and current job proof without granting mutation rights |
| Backpack, optional companion | Source-linked context, handoff delivery, procedures and local evidence assistance | An AI/operator needs to resume with current context and inspect its actual available tools |
| Tevin in MGR-ONE | Assistant reasoning and permission ownership | A user needs the correct tool selected and an authorized multi-step outcome |
| MGR-API-MCP | Bounded shared tool interface | An authorized assistant needs a typed, scoped route to a domain tool |

Imprint and its Slot Machine selector belong inside Code Monster. VampBite derives job identity/evidence from the existing ledger. DevMapGod is a cross-product workflow. Do not create another brain, scheduler or canonical task database for this integration.

## Read the truth before acting

The canonical original scope is **174 parent requirements, 441 exact acceptance clauses and 28 separate upgrades**. Recorded original parent states remain 122 `open` and 52 `implemented_unverified`; independently accepted full parents remain zero at this checkpoint. A passing local command never automatically closes them. Use `UNFINISHED-WORK/backlog.json`, `mgr-174-acceptance-evidence-register.json`, `mgr-trilogy-upgrades.json` and the newest dated wave overlay together.

The current products include substantial implementations and tests. They also retain important missing behavior: qualified persistent Docker execution, independent production signing/key custody, deployed account and tenant acceptance, semantic graph/recommendation coverage, browser/assistive/performance journeys and full original requirement acceptance. A source link or catalogue entry does not prove a feature works.

## Recover the right branches

The active source recovered for this wave came from these development branches:

| Repository | Existing development branch |
|---|---|
| `tdmboyd-dev/MGR-OMNIDEV-SWARM` | `mgr/code-monster-omnisight-20261028` |
| `tdmboyd-dev/MGR-CODE-MONSTER` | `mgr/receipt-admission-20261029` |
| `tdmboyd-dev/MGR-OMNISIGHT` | `mgr/ten-lane-handoff-20261029` |

Fetch and inspect the newest handoffs before choosing a baseline. `main` may contain older application code. Current readiness work uses `backpack/trilogy-readiness-20261030` in separate clones; it does not change the other agent's checkout. Record each commit and tree, check `git status --short`, and preserve local changes. Review branches are not automatically approved merges. Recheck remote refs before integration because another agent may advance them.

## Install and run local verification on Windows

Use Node 24.21.0 or a compatible supported Node version. OmniDev declares Node >=22.13 and **pnpm 11.25.0**. It has a pnpm lockfile; `npm ci` is the wrong installer. Code Monster and OmniSight use Node's built-in modules and do not require a dependency install for their test suites.

In the OmniDev checkout:

```powershell
npm.cmd exec --yes --package=pnpm@11.25.0 -- pnpm install --frozen-lockfile --ignore-scripts
node scripts/run-full-verification.mjs C:/absolute/path/outside-repo/omnidev-verification
```

The second command prepares current compiled modules, checks the pinned source, runs all approved profiles, captures bounded output and writes `report.json` plus individual logs. Use an external output directory or a Git-ignored directory. It requires clean committed source and rejects source or generated-module drift. Output hashes, source commit and qualification belong to that exact run. Do not combine passing subsets from different revisions into an invented full pass.

In Code Monster:

```powershell
node --test --test-concurrency=2 test/*.test.mjs
```

In OmniSight:

```powershell
npm.cmd test
node --check app/main.js
```

On Windows, keep explicit platform skips visible. File-symlink privilege, POSIX private-mode tests and simulated POSIX Docker fixtures are distinct from real Windows ACL/Docker qualification. No `--test-force-exit` is used for acceptance. Long-running fixture Git tests must finish and close their resources; hiding open handles is not a repair.

The updater's packaged public key is pinned to LF using `.gitattributes`. Do not normalize signed release payloads or weaken byte comparison to get a pass. The worker uses Git's `/dev/null` config path, which Git for Windows supports; Windows `NUL` was rejected by the installed Git in the reproduced failure. Application signing checks remain enforced.

## Open the local OmniDev development app

In the installed OmniDev checkout, run `npm.cmd run dev -- --hostname 127.0.0.1`. The portable launcher selects port 5173; use the local address it actually prints. Stop it with Ctrl+C after your session. The development server is a local engineering surface; it does not supply an account connection, owner grant, worker host or provider credentials. Start the real account/connection journey in the authorized deployed host when that host and consent are available. Do not interpret a rendered screen as live account/provider qualification.

For a first local proof without external accounts or providers, use the full verification and three-product integration commands in this guide. They execute the real local implementations with explicitly disposable service/signing/provider fixtures.

## Security dependency checkpoint

The October 30 production audit initially reported 23 advisories, including three critical findings. After framework/schema and selected dependency repairs, the complete production/development graph reports zero known advisories at the saved audit time. The intermediate complete audit, after production repairs but before build-tool repairs, reported 62 advisories; these are different graph checkpoints, not additive unique vulnerabilities. The final 75-profile run includes real connector dispatch/denial, PNG generation and disposable SQLite migration generation/checking, plus application TypeScript/build.

pnpm 11 reads dependency overrides from `pnpm-workspace.yaml`; the old duplicate package-manifest override was removed. Seven-day release-age policy remains enabled, and installation scripts remain ignored during the recorded setup. Sources: [pnpm package settings](https://github.com/pnpm/pnpm/blob/main/pnpm/docs/package_json.md), [Next.js upstream security advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). See the saved audit JSON for exact package paths and advisory identities. Zero known advisories does not mean an exhaustive security audit or production certification.

## First useful source inspection

Choose an owner-authorized local Git repository. Commit or deliberately identify the source revision you want to inspect. In Code Monster, produce a **new**, explicit JSON output path:

```powershell
node src/cli.mjs export-census C:/absolute/target-repository C:/absolute/private-output/census.json
```

The exported census describes committed Git objects at a pinned revision. It is stronger than a filename guess, but it does not establish complete semantic understanding or whole-application correctness. Preserve the output commit/hash and inspect exclusions/limits. Keep private source exports private. OmniDev is publicly visible at this checkpoint; do not copy private companion raw source or manifests into it.

To inspect the census in OmniSight, set `OMNISIGHT_CENSUS_FILE` to the private output path. Supply a strong `OMNISIGHT_OWNER_TOKEN` through your normal protected local environment flow, then run `npm.cmd start`. Open the displayed `http://127.0.0.1:4300` address locally. Enter the viewer token and choose **Connect pinned evidence**. The token remains in page memory; do not paste it into chat, source, logs or a committed script.

Optionally set `OMNISIGHT_ALLOWED_PREFIXES` to permitted prefixes such as `src,tests`. Omission means the configured owner's full view. An empty or malformed list rejects rather than broadens access. Search reaches permitted records; pages and folders describe the loaded scope. The graph/territory demonstration must remain labeled until actual graph/claim data supports it. For exact source navigation, set the authorized `OMNISIGHT_SOURCE_REPOSITORY_URL`; its link uses the pinned commit, not a moving branch.

## One change through the actual three-product workflow

1. Import the authorized repository snapshot into OmniDev. Preserve its exact commit/tree. Choose an existing snapshot job and inspect the native or model-authored candidate. Native maintenance is bounded documentation/integrity generation, not a general reasoning model.
2. Prepare the matching Code Monster Imprint plan from that exact base. Match every before/after file hash and the canonical plan hash to the OmniDev candidate. Review the actual changes and acceptance.
3. Use the existing OmniDev owner action to authorize the candidate-only grant. The bridge credential cannot authorize itself. The grant binds owner, project, repository, job, source, plan, candidate ref, fixed command and expiry.
4. In Code Monster, run `node src/cli.mjs trilogy-sync SOURCE_ROOT STAMP_JSON JOB_ID PRIVATE_STATE_DIRECTORY` with the configured scope, bridge URL/token and registered verifier public key. Use exact absolute paths. The private state must be outside the source/Git administration directories. It binds this source and scope. Database symlinks and multiply linked files reject before SQLite opens them.
5. The bounded pass stages one exact candidate and submits pending evidence. It does not run project code or poll forever. The existing OmniDev worker performs the approved snapshot command on its configured qualified host. Signing credentials remain outside the candidate/container environment.
6. Run the same synchronization command after the worker has produced proof. Code Monster validates the registered signer, exact command/candidate/output and current grant, then admits the existing ledger events. A valid result remains `verified-pending-owner`.
7. Configure OmniSight's job reader with the actual authorized `grant.request` fields and a separate read credential. **Refresh current job** fetches current upstream state. Expired/revoked access clears earlier proof. A restricted path view withholds whole-job totals/identity that would leak excluded scope.
8. An explicit owner action may apply a currently verified candidate. Exact-candidate publication has separate preview, approval and draft creation/reconciliation. It preserves the tested commit and rejects drift. A draft pull request is not a merge or release. Review actual checks and remote identity before any later merge decision.

Full settings and API schemas: `UNFINISHED-WORK/TRILOGY-JOB-BRIDGE.md`, `lib/trilogy-contract.ts`, and the companion repositories' current bridge guides. The older bridge guide describes exact-candidate publication as future work; the newer handoff and `lib/trilogy-publication.ts` supersede that historical limitation. Distinct owner, bridge, worker and reader credentials must remain separate. The local single-scope service boundary is not deployed multi-user identity.

## Run the complete local integration

After all intended source changes are committed and every checkout is clean, prepare OmniDev modules with `node tests/prepare.mjs`. In the OmniSight checkout:

```powershell
$env:MGR_OMNIDEV_ROOT = 'C:/absolute/MGR-OMNIDEV-SWARM'
$env:MGR_CODE_MONSTER_ROOT = 'C:/absolute/MGR-CODE-MONSTER'
node scripts/verify-trilogy-job.mjs --publication --require-clean
```

This runs actual local Git candidates, SQLite and HTTP across the three implementations. It checks the scoped reader, signed proof, replay, revocation, source preservation and exact-candidate draft behavior. The signer/service credentials and GitHub provider boundary are disposable fixtures. The integration creates no real provider draft, uses no paid model and qualifies no actual Docker host. Raw receipts contain private source manifests: save them privately. Only a redacted summary belongs in the public OmniDev repository.

## Backpack's place and how to use it

Use Backpack as an optional context companion. Its installed MCP runtime offers self-description, paged embedded directions, readiness checks and a project preparation tool. The host still reasons about source and decides what to do. Operational self-knowledge is not consciousness.

Use a separate reviewed Backpack configuration for Trilogy with only the three intended clone roots, a private data directory and **no execution profiles** for the context trial. Register each project using the owner CLI. Enable record/source tools only when required to store its bounded index and delivered-source ranges; leave `BACKPACK_EXECUTE=0`. This does not change the existing Alpha-Queendom plugin configuration or enroll unrelated MGR repositories.

Begin with `backpack_self`, then `backpack_help` for the actual request formats, `backpack_doctor`, `backpack_scan` and `backpack_prepare` for a registered project. Read the newest handoff using `backpack_read_source`. Inspect its hash, returned range and continuation. A delivered page is not comprehension. Large Bibles and evidence registers may exceed Backpack's scan/read budgets; inspect the skip list and use the canonical documents directly. Never substitute a bounded Backpack inventory for Code Monster's pinned census.

Do not mirror the canonical 174 tasks into an independent Backpack acceptance system. Link to the canonical records and retain their authority. A Backpack brief with no recorded tasks must not become “the Trilogy is complete.” No deployed Tevin adapter or native chat activation follows merely from an installed plugin. Test the actual consumer and current tool catalog separately.

## Failure, cancellation and recovery

- If source, command, permission, signer or candidate changes, stop the affected transition and re-read current state. Never relabel old passing output as proof for the new candidate.
- If the worker has not produced proof, keep the job pending. Do not supply `passed:true` or a synthetic receipt.
- If a request response is lost, reconcile the existing job/candidate/publication identity before retrying. The same bounded sync command resumes the same durable work; it must not invent a new job to conceal uncertainty.
- If publication is uncertain, use the existing read-only reconciliation path. Check exact remote branch/draft identity; no blind duplicate draft creation.
- If a permission/host/browser action is explicitly declined or rejected, preserve the rejection. This wave does not retry the previously declined connected-device probe or browser URL-policy route.
- Preserve failed outputs, source pins and explicit skips. Update dated overlays and newest handoff sections while retaining historical receipts. Repair generated boards from available committed inputs; do not pretend an unpublished historical commit exists remotely.
- Stop local test servers/clients after verification. Keep private configs, keys, SQLite stores and source backups out of release archives and public Git.

## What “ready” means

A source implementation, a local suite pass, a real provider/device result and production acceptance are separate states. The readiness report must name the exact state. Today's local results do not certify the remaining 174 requirements, physical isolation, public hosting, business pricing, live user journeys or all future model behavior. Those require their own executed evidence and owner decisions where applicable.

Continue from the persistent scorecard and current handoff. The useful sequence is: reproduce a real remaining defect or acceptance gap, repair the owning implementation, run meaningful checks, exercise its consumer, preserve proof, update directions and publish a reviewable branch with exact readback.
