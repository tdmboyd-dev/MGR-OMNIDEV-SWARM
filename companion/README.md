# OmniDev account companion

This portable local client implements the documented OpenAI open-source Sign in with ChatGPT flow. It is not this chat session installed inside OmniDev, and it does not bypass provider eligibility. Hosted website identity and inference approval remain separate.

## Easier browser workflow

Requires Node 22 or newer. Existing sign-in and settings are preserved.

1. Extract the full Windows ZIP. Double-click **OPEN-COMPANION.cmd** once and keep its window open.
2. In OmniDev Agent runtime, create an account job or open a queued one. Click **Generate with ChatGPT here**.
3. Inside OmniDev, choose model, reasoning level and profile. Click **Generate and stage for review**.
4. The candidate appears in OmniDev automatically and is validated there. Review before applying. No source change, PR, merge or deployment happens automatically.

The dashboard is available at http://127.0.0.1:8765 while the launcher is running. It listens only on this computer. Allow local-device access if your browser asks. The local engine must remain running. The separate browser panel and manual download/import are fallbacks.

The integrated interface pairs only from the exact OmniDev origin using an explicit client header. Its short-lived local capability stays in browser memory. Popup fallback uses exact origins, source-window checks and a per-job nonce. Account credentials remain in the local companion; no account token is sent to the Site. The local API requires a random session token, rejects foreign origins and hostnames, serializes operations and cleans temporary request/output files. One local companion process is supported. Run SIGN-IN.cmd first if the account is not yet connected.

The hosted app cannot attest that this computer is malware-free or that a submitted candidate truly came from the claimed model. Candidate contracts, baseline checks and human review still apply. Higher effort can use more account allowance; there is no supported request-level token cap on this account route.

## Manual fallback and CLI reference

Requires Node 22 or newer on your computer. No API key is requested.

1. Run `node companion/chatgpt.mjs login` and open the displayed link on that same computer. Approve the named app and plan-usage scopes.
2. Run `node companion/chatgpt.mjs models` to list models available to your signed-in account. Run configure to choose your model and reasoning effort.
3. In OmniDev Agent runtime select **ChatGPT companion**, create a job, and download its request.
4. Run `node companion/chatgpt.mjs generate request.json MODEL-ID candidate.json`.
5. Import candidate.json in that job. The hosted app validates baseline and patches before human review. Generation is not runtime testing.
6. Run `node companion/chatgpt.mjs logout` to end the renewable session. Check ChatGPT Settings if remote revocation is not confirmed.

Credentials stay in an owner-only local folder and never appear in the candidate export. One companion process per state directory is supported; do not run concurrent token refreshes. Do not share the state directory. Multi-account UI and native secure credential stores remain future qualification work.

Sources reviewed 2026-10-09: https://developers.openai.com/siwc/token-sharing-open-source/sign-in ; https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference ; https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions

Owner supplied successful sign-in, live model catalog, completed GPT-6.1 Sol inference and imported candidate validation evidence on 2026-10-09. Automated protocol tests use fixtures; the new integrated Windows browser flow awaits a live owner run. If staging fails after generation, retry staging reuses the retained candidate rather than spending another model call.

## Model and reasoning settings
On Windows double-click CHOOSE-MODEL.cmd. Choose a numbered model from the live account catalog, then a supported reasoning level. Selections persist locally and are bound to the signed-in account. No automatic fallback occurs. GENERATE-CANDIDATE.cmd prompts for the downloaded request path and output path, then uses your saved settings.

Light means low; Extra high means xhigh. GPT-6.1 Sol and GPT-6 Astra support low, medium, high, xhigh and max. Other documented models expose only their supported levels; unknown models use Model default until capability support is verified. These are reasoning effort settings, not subscription tiers or a remaining-usage meter. Higher effort may consume more usage and time. Generation runs for at most three minutes; incomplete output is rejected. The ChatGPT account route rejects max_output_tokens, so there is no request-level token cap. Local stream/output size limits still apply; a local timeout is not a billing cap.

Sources: https://developers.openai.com/api/docs/models/gpt-6.1-sol ; https://developers.openai.com/api/docs/models/gpt-6-astra ; https://developers.openai.com/api/docs/models/gpt-5.2 ; https://developers.openai.com/api/docs/models/gpt-5.1 ; https://developers.openai.com/api/docs/models/gpt-5

Operating profiles: Chat style for explanation, Work style for coordinated planning, Codex style for implementation. These are OmniDev prompt/workflow profiles on the selected model. They do not invoke native ChatGPT apps or product-specific tools. The current exported result remains a bounded code candidate; native product handoff and other modalities are separate unfinished integrations.

Diagnostics: updated companion reports safe error categories and HTTP status, with progress checkpoints. Request limit now 2.5 MB, aligned to the hosted 2 MB snapshot plus metadata; this supersedes the original 60 KB companion limit. It never prints tokens, source content, or raw provider error payloads. Existing candidate files are preserved; choose a new output filename for retries.

Account inference wire requirements verified against official preview limitations: input is a message array; max_output_tokens is omitted. https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations

## Background generation
Updated engine jobs run independently of the browser request. Keep the engine running; you may close the browser. Reopen the queued OmniDev job and click Start job to recover completed local output without another model call. Switching OmniDev pages keeps status alive. Turning off the computer or closing the engine interrupts unfinished work; it does not retry paid inference automatically. Job output is stored in the owner-local state jobs directory. Full cloud background execution remains separate.
