# Remaining integration plans: specified, not runtime verified

The source repairs already committed have executed tests. The following are implementation plans for remaining integration/hosting work. Code blocks are proposed contracts/algorithms and have not been installed as live adapters.

## Immutable public GitHub snapshot

Target lib/github.ts githubSnapshot. Keep selectSnapshotFiles, per-file and total byte limits, secret/path exclusion and explicit partial coverage. Replace moving default_branch raw fetch with one commit/tree selection followed by immutable blob fetches. The existing lib/repo-audit.ts startAudit/auditStep flow demonstrates this pattern.

```ts
const info = await (await get(base)).json();
const commit = await (await get(base + '/commits/' + encodeURIComponent(info.default_branch))).json();
if (!/^[a-f0-9]{40}$/.test(commit.sha) || !/^[a-f0-9]{40}$/.test(commit.commit?.tree?.sha))
  throw new Error('GitHub returned no immutable revision');
const tree = await (await get(base + '/git/trees/' + commit.commit.tree.sha + '?recursive=1')).json();
if (!Array.isArray(tree.tree)) throw new Error('Invalid source tree');
const selected = selectSnapshotFiles(tree.tree, 100);
for (const entry of selected) {
  if (!/^[a-f0-9]{40}$/.test(entry.sha)) throw new Error('Invalid immutable blob');
  const blob = await (await get(base + '/git/blobs/' + entry.sha)).json();
  if (blob.encoding !== 'base64' || blob.size > 100000) throw new Error('Unexpected blob');
  const bytes = Uint8Array.from(atob(blob.content.replace(/\s/g, '')), c => c.charCodeAt(0));
  const content = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
  // Recheck actual byte limits/binary content, then retain {path,content,blobSha}.
}
// Persist commit.sha and tree SHA in origin; mark tree.truncated/selection exclusions explicit.
```

Required tests: controlled GitHub server moves default branch after tree retrieval; every blob still comes from original tree SHA and stored commit. Deny truncated/malformed tree, wrong encoding, unexpected blob SHA/size, invalid UTF8 and secret case aliases. Verify no raw branch URL is requested and no token is sent outside fixed api.github.com. Run acceptance and route suites after conversion; no real GitHub write is needed.

## Scoped Tevin inspection/proposal adapter

Targets new server-only adapter module + an explicit endpoint, MGR API department gateway and existing ONE owner workflow. Do not wrap unrestricted /api/runtime and expose every action. Start with read/propose capabilities only. Tevin owns approval; the adapter must not create a competing approval engine.

```ts
type Principal = {tenantId:string;actorId:string;workspaceIds:string[];operations:('inspect'|'propose')[]};
type EngineeringRequest = {requestId:string;approvedPreviewDigest:string;workspaceId:string;
  operation:'inspect'|'propose';objective:string;source:{commit:string;files:{path:string;sha256:string;content:string}[]}};
type EngineeringReceipt = {requestId:string;status:'SUCCEEDED'|'FAILED'|'BLOCKED'|'UNKNOWN';
  requestDigest:string;sourceDigest:string;readingLedger:unknown[];patches:unknown[];
  evidenceRefs:string[];externalEffects:[]};
async function admit(principal:Principal, request:EngineeringRequest) {
  if (!principal.workspaceIds.includes(request.workspaceId) || !principal.operations.includes(request.operation))
    throw Object.assign(new Error('Scope denied'),{statusCode:403});
  // Verify each SHA256 over exact UTF8 bytes, safePath and body budgets.
  // Verify owner-approved preview digest using ONE coordinator receipt, not caller assertion.
  // Persist canonical requestDigest before dispatch; same ID+digest returns saved receipt.
  // Conflict409 on changed digest; UNKNOWN requires status reconciliation before retry.
  // inspect returns actual bounded source evidence; propose returns candidate only.
  // No GitHub write, deployment, provider fallback or host elevation in this adapter.
}
```

Credential strategy: dedicated service credential from configured secret store, mapped server-side to one tenant/actor/scope; headers must agree with the configured identity. Never accept arbitrary tenant/actor only because a caller supplied headers. Use existing owner enrollment/configuration rather than automatically enrolling a production workspace.

Required tests: missing/wrong credential401; forged tenant403; unauthorized workspace/operation403; malformed digest400; same request exact replay; changed replay409; crash after durable reservation returns UNKNOWN, then status reconciliation; artifact readback bytes independently hashed by API/ONE. Prove no external provider/GitHub/deploy function called in read/propose flows. Add the registry tools only after these actual local integration receipts pass.

## Production gateway and qualified worker proof

Production routes currently rely on Sites hosting gateway identity. Verify actual deployed origin unauthenticated401/403, correct owner allowed, different owner denied and loopback mock identity unavailable. Test forged Origin/identity headers. Do not infer deployment proof from a local preview.

Worker qualification requires an attached allowed host, immutable image digest, no network by default, constrained resources, source digest/candidate digest and cleanup receipt. Run a benign isolated fixture, denied unsafe path, time/memory limit, cancellation and restart reconciliation. A passing worker-report schema or controlled fixture is not proof that a real Docker host ran. Provider/account execution requires separate configured credentials and budget authorization; avoid automatic fallbacks or repeated chargeable requests after uncertain outcomes.
