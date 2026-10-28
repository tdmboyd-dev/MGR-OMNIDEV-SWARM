# Brains and voice implementation — 2026-10-09

## Shipped
A single Brains area stores a default assignment and coding/security/testing/research overrides. Named API brains use separate AES-GCM-encrypted credentials and fixed provider endpoints. ChatGPT account remains a local engine connection. New assigned-brain coding jobs resolve their route; API specialist review routes resolve from persisted job assignments. Removal cannot silently redirect a role. Existing legacy provider APIs stay compatible. Connected API brains are capped at 32. Public status excludes credentials and ciphertext.

Dictate controls are provided for development objectives, mission objectives, memory reasoning and architectural decision fields. Recognition begins only on a user click, stops on user request/unmount, appends final text within field limits and never submits. Browser recognition may process audio remotely; this is disclosed before use. Unsupported browsers keep typing available. Actual microphone permission and service behavior need an owner browser qualification.

## Evidence
Freshly transpiled tests: 75 runtime + 80 platform + 17 brain-routing checks pass against real SQLite and fixture provider HTTP. Type-check passes. Live Claude/OpenAI API qualification needs owner credentials. Account generation was previously owner-qualified. Full orchestration is not inferred from these tests.

## Still unfinished
Local account specialist review protocol and autonomous multi-step Omni Core planning are not implemented by this routing pass. A hosted API review assigned to an account brain explicitly refuses rather than falling back. Consumer Claude subscription authorization is not provided; the Claude adapter uses its API credential. Additional providers require documented adapters. Browser microphone live check, platform usage budgets per brain, connection-change audit history, model pinning and worker runtime verification remain open.

## Acceptance to close remaining work
Implement a typed local review request/response protocol with bounded scheduling and resumable leases; qualify account/API mixed review workflows; exercise voice permissions, denial, unsupported browser and edit-during-dictation in an owner browser. No untested application candidate may be labeled runtime-tested.

Additional adapters: Gemini OpenAI-compatible endpoint and DeepSeek chat completion endpoint, each with independent encrypted keys. Native Claude subscription OAuth restriction verified against https://code.claude.com/docs/en/legal-and-compliance ; provider contracts https://ai.google.dev/gemini-api/docs/openai and https://api-docs.deepseek.com/ . Live API calls still require owner qualification. The spoken name “Qmicate 2” needs identification before an adapter can be selected.

Claude subscription path: use an unmodified user-authenticated Claude Code binary under the documented platform-hosting terms. Do not collect or intermediate Claude.ai OAuth tokens. Implement installation detection, native account handoff, user-owned authentication, documented CLI outputs, task permissions, cancellation and bounded usage; qualify Windows native execution. This adapter is planned, not callable in this pass.
