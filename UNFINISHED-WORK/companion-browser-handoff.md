# Companion browser handoff

## Problem and scope
The owner verified actual account inference and candidate validation, but the manual request download, CLI paths and candidate import created repeated friction. This pass replaces file transfer with an explicit browser-popup exchange. Account credentials remain local and approval remains in OmniDev.

## Capability contract
Start one loopback companion on 127.0.0.1:8765. A queued account job opens the popup with a unique attempt nonce. Ready messages must match exact local origin, popup window and nonce. The Site fetches the existing job request and sends it to that popup. The local page accepts only its original Site opener, exact Site origin and nonce. The owner explicitly selects settings and starts generation. A matching candidate returns to the Site, which invokes the existing source-digest and candidate validation route. Only the existing reviewed apply action can change the snapshot.

## Security and failure handling
Local HTTP checks Host, per-process session token, same-origin mutation headers, size limits and one active operation. No CORS access is granted. The page has a nonce-based script policy and refuses framing. Temporary source/output files are removed after generation, including failure. Foreign messages, duplicate result messages and stale source digests are rejected. Source changes and external writes cannot be requested through the bridge protocol. Provider failures preserve account credentials. A failed or severed popup can use the manual fallback. A local malicious process is outside this trust boundary; this is not remote attestation.

## Verification
28 executed checks in evidence/companion-dashboard.txt cover actual local HTTP and the rendered browser script in a controlled DOM fixture. The existing 75 runtime checks and 80 additional platform checks passed. Typecheck passed. No real Windows popup run is claimed; browser opener isolation, popup policies and native credential security remain qualification items.

## Sources and decisions
MDN Window.postMessage security guidance: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage . Adopt exact targetOrigin, sender origin and source-window validation. Reuse official account Responses contracts already captured in companion-guide.md. No browser-to-local credential transfer, no hosted account tokens, no automatic apply, no native ChatGPT product impersonation.

## Remaining engineering
Native background service installation and secure OS credential storage; durable host pairing; automatic reconnection after original tab closes; multi-account support; cancellation during in-flight provider generation; browser qualification on real Windows; approved hosted account execution. These remain open and are not prerequisites for the tested local prototype.

## Integrated OmniDev controls
Model, effort, profile and generation controls now live in OmniDev. The localhost engine offers exact-origin CORS and header-gated pairing; its ephemeral capability is held in browser memory, while account tokens remain local. Foreign origins and unpaired calls are rejected. Browser local-device permission may be required. A failed Site staging attempt retains the generated candidate for retry without a second model call. 34 fixture checks pass; actual owner Windows integrated browser execution is still unqualified.
