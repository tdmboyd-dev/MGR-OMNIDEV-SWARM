#!/usr/bin/env node
/**
 * Read-only projection of the existing MGR backlog and evidence register.
 * This does not promote tasks or introduce a second task authority.
 *
 * node scripts/build-owner-progress.mjs [--wave path/to/wave.json]
 * node scripts/build-owner-progress.mjs --check
 *
 * --check reuses the saved source revision and overlay paths, so a later
 * documentation-only commit does not invalidate an otherwise identical view.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateAcceptanceRegister } from './validate-acceptance-register.mjs';
import {PUBLIC_REPOSITORY,repositoryPath,projectPublicEvidence,validatePublicWave,verifiedRunSummary} from './owner-progress-evidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputStem = 'UNFINISHED-WORK/owner-progress-20261029';
const inputPaths = {
  backlog: 'UNFINISHED-WORK/backlog.json',
  register: 'UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json',
  detail: 'UNFINISHED-WORK/remaining-detail-omnidev-20261029.json',
  upgrades: 'UNFINISHED-WORK/mgr-trilogy-upgrades.json',
  publication: 'UNFINISHED-WORK/mgr-resume-publication-20261029.json',
  bridge: 'UNFINISHED-WORK/mgr-trilogy-bridge-wave-20261029.json',
};
const argv = process.argv.slice(2);
let check = false, requestedRef, publicRef, wavePaths = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === '--check') check = true;
  else if (arg === '--source-ref' && argv[i + 1]) requestedRef = argv[++i];
  else if (arg === '--public-ref' && argv[i + 1]) publicRef = argv[++i];
  else if (arg === '--wave' && argv[i + 1]) wavePaths.push(argv[++i]);
  else throw Error('Unknown or incomplete argument: ' + arg);
}
const prior = check ? JSON.parse(fs.readFileSync(path.join(root, outputStem + '.json'), 'utf8')) : null;
if (check) {
  requestedRef ??= prior.sourceSnapshot.commit;
  publicRef ??= prior.sourceSnapshot.publicRef;
  if (wavePaths.length === 0) wavePaths = prior.overlayPaths;
}
const git = (...args) => execFileSync('git', args, { cwd: root, stdio:['ignore','pipe','pipe'], maxBuffer: 16 * 1024 * 1024 });
const sourceCommit = git('rev-parse', '--verify', (requestedRef ?? 'HEAD') + '^{commit}').toString().trim();
const sourceTree = git('rev-parse', sourceCommit + '^{tree}').toString().trim();
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const inputs = [];
function entriesAt(tree){
  return new Map(git('ls-tree','-r','-z',tree).toString().split('\0').filter(Boolean).map(line=>{
    const split=line.indexOf('\t'),[mode,type,sha]=line.slice(0,split).split(' ');
    return [line.slice(split+1),{mode,type,sha}];
  }));
}
const treeEntries=entriesAt(sourceCommit);
function readBytes(relativePath){
  repositoryPath(relativePath);
  const object=treeEntries.get(relativePath);
  if(!object||object.type!=='blob'||!['100644','100755'].includes(object.mode))throw Error('Committed regular evidence file required at '+sourceCommit+': '+relativePath);
  const bytes=git('cat-file','blob',object.sha);
  if(!inputs.some(input=>input.path===relativePath))inputs.push({path:relativePath,sourceCommit,gitBlob:object.sha,sha256:sha256(bytes),bytes:bytes.length,readFrom:'committed-git-object'});
  return bytes;
}
function read(relativePath) {
  return JSON.parse(readBytes(relativePath));
}
const documents = Object.fromEntries(Object.entries(inputPaths).map(([name, file]) => [name, read(file)]));
const { backlog, register, detail, upgrades, publication, bridge } = documents;
const validation = validateAcceptanceRegister(backlog, register);
if (!validation.valid) throw Error('Canonical register is inconsistent: ' + validation.errors.join(', '));
if (register.criteriaCount !== 441 || upgrades.items.length !== 28) throw Error('Original scope changed; review the generator before changing denominators');
const waves = wavePaths.map(file => ({ file, data: validatePublicWave(read(file)) }));
publicRef ??= publication.confirmedRemoteCheckpoint;
if (!/^[a-f0-9]{40}$/.test(publicRef)) throw Error('Public source reference must be an exact Git commit');
const repositoryUrl = 'https://github.com/'+PUBLIC_REPOSITORY;
let publicTree=null,publicBinding='unavailable';
try{publicTree=git('rev-parse','--verify',publicRef+'^{tree}').toString().trim();publicBinding='available-git-object';}catch{
  if(publication.confirmedRemoteCheckpoint===publicRef&&publication.remoteRefReadBack===true&&publication.remoteCommitTreeReadBack===true&&/^[a-f0-9]{40}$/.test(publication.identicalFileTree||'')){
    try{git('cat-file','-e',publication.identicalFileTree+'^{tree}');publicTree=publication.identicalFileTree;publicBinding='recorded-provider-tree-readback';}catch{}
  }
}
const publicEntries=publicTree?entriesAt(publicTree):new Map(),publishedLinks={};
const blobUrl = file => {
  if(typeof file!=='string')return null;
  const local=treeEntries.get(file),remote=publicEntries.get(file);
  if(!local||local.type!=='blob'||!['100644','100755'].includes(local.mode)||!remote||remote.sha!==local.sha||remote.mode!==local.mode)return null;
  const url=repositoryUrl+'/blob/'+publicRef+'/'+file.split('/').map(encodeURIComponent).join('/');
  publishedLinks[file]=url;return url;
};
const sourceFiles = {};
const evidence = {};
function evidenceIds(items = []) {
  return items.map(item => {
    const value = projectPublicEvidence(item);
    if(value.path){const url=blobUrl(value.path);if(url)value.url=url;else value.linkStatus='Not available at the observed public revision';}
    const key = 'e-' + sha256(JSON.stringify(value)).slice(0, 16);
    evidence[key] = value;
    return key;
  });
}
const byRegister = new Map(register.tasks.map(t => [t.id, t]));
const byDetail = new Map(detail.items.map(t => [t.id, t]));
if (byDetail.size !== backlog.tasks.length || backlog.tasks.some(t => !byDetail.has(t.id))) throw Error('Detailed work record does not cover all original parents');
const taskUpdates = new Map();
for (const { file, data: wave } of waves) {
  for (const update of wave.ownerProgress?.taskUpdates ?? []) {
    if (!byRegister.has(update.id) || !Array.isArray(update.remainingActions) || update.remainingActions.some(x => typeof x !== 'string' || !x.trim())) {
      throw Error('Invalid scoped remaining-work update: ' + update.id);
    }
    taskUpdates.set(update.id, { ...update, report: file });
  }
}
const overlayClauses = [
  ...bridge.clauseMapping.map(mapping => ({ ...mapping, report: inputPaths.bridge })),
  ...waves.flatMap(({ file, data }) => (data.clauseMapping ?? []).map(mapping => ({ ...mapping, report: file }))),
];
const knownClauses = new Set(register.tasks.flatMap(t => t.acceptance.map(a => a.criterionId)));
for (const item of overlayClauses) if (!knownClauses.has(item.criterionId)) throw Error('Overlay names an unknown acceptance clause: ' + item.criterionId);
const countBy = (items, field) => items.reduce((out, item) => { const key = typeof field === 'function' ? field(item) : item[field]; out[key] = (out[key] ?? 0) + 1; return out; }, {});
const completed = [
  ...waves.flatMap(({ file, data }) => (data.ownerProgress?.completed ?? []).map(item => ({
    title: item.title, observed: item.observed, taskIds: item.taskIds ?? [],
    evidenceIds: evidenceIds([file, ...(item.evidence ?? [])]), remaining: item.remaining ?? [],
  }))),
  { title: 'Worker results survive the trip back to the app', observed: 'Valid escaped output fits the bounded HTTP request; failure diagnostics remain inside the output allowance.', taskIds: ['RUN-01', 'RUN-03', 'QA-02'], evidenceIds: evidenceIds([inputPaths.publication, 'UNFINISHED-WORK/evidence/resume-20261029/run/workerReportTransport.log', 'UNFINISHED-WORK/evidence/resume-20261029/run/workerFailureOutput.log']), remaining: ['Real Docker-host isolation and crash/recovery qualification remain separate.'] },
  { title: 'The worker download contains the tested files', observed: 'Nine committed worker source files and a manifest are packaged reproducibly; the previously missing proof module is included.', taskIds: ['RUN-01', 'REL-02'], evidenceIds: evidenceIds(['UNFINISHED-WORK/evidence/resume-20261029/worker-package-verification.json']), remaining: ['Installation and actual execution on an authorized physical worker host remain unqualified.'] },
  { title: 'One job passes through all three apps locally', observed: 'Ten checks exercise Git candidates, SQLite, local HTTP, signed fixture output, restart replay, tamper rejection and revoked visibility.', taskIds: ['RUN-03', 'DEV-01', 'QA-02', 'UX-03'], evidenceIds: evidenceIds(['UNFINISHED-WORK/evidence/resume-20261029/integration-resumed.json']), remaining: ['The signed fixture is not an independently operated production signer; deployed identities and browser journeys still need proof.'] },
];
const tasks = backlog.tasks.map(task => {
  const registered = byRegister.get(task.id), detailed = byDetail.get(task.id);
  const update = taskUpdates.get(task.id);
  const sourcePaths = task.source_files ?? [];
  for (const file of sourcePaths) if (!sourceFiles[file]) {
    const object = treeEntries.get(file);
    sourceFiles[file] = object?.type === 'blob' ? {
      path: file, present: true, gitBlob: object.sha,
      sha256: sha256(git('cat-file', 'blob', object.sha)),
      url: blobUrl(file),
    } : { path: file, present: false, url: blobUrl(file) };
  }
  return {
    id: task.id, title: task.title, priority: task.priority, area: task.area,
    recordedStatus: task.status, finalAcceptance: registered.overall,
    recordedImplementation: detailed.existingState,
    currentScopedState: update?.currentState ?? null,
    taskUpdateEvidenceIds: update ? evidenceIds([update.report, ...(update.evidence ?? [])]) : [],
    pendingActions: update?.remainingActions ?? detailed.pendingActions,
    priorPendingActions: update ? detailed.pendingActions : [],
    originalWork: task.work,
    dependencies: task.dependencies ?? [],
    sourcePaths,
    sourcePresent: sourcePaths.length > 0 && sourcePaths.every(file => sourceFiles[file].present),
    evidenceIds: evidenceIds(task.evidence),
    completedHere: completed.map((item, index) => item.taskIds.includes(task.id) ? index : -1).filter(index => index >= 0),
    additionalAuditRequirements: detailed.additionalAuditRequirements ?? [],
    acceptance: registered.acceptance.map(clause => ({
      id: clause.criterionId, requirement: clause.requirement, finalStatus: clause.status,
      finalVerificationLevel: clause.verificationLevel ?? null,
      finalEvidenceIds: evidenceIds(clause.evidence),
      finalSourceCommit: clause.sourceCommit, blocker: clause.blocker,
      localStatus: clause.localVerification?.status ?? 'NOT_RECORDED',
      localObserved: clause.localVerification?.observed ?? null,
      localRemaining: clause.localVerification?.remaining ?? null,
      localSourceCommit: clause.localVerification?.sourceCommit ?? null,
      localEvidenceIds: evidenceIds(clause.localVerification?.evidence),
      additionalEvidence: overlayClauses.filter(item => item.criterionId === clause.criterionId).map(item => ({
        observed: item.observed, remaining: item.remaining,
        sourceCommit: item.sourceCommit ?? null, status: item.status,
        evidenceIds: evidenceIds([item.report, ...(item.evidence ?? [])]),
      })),
    })),
  };
});
for (const item of completed) for (const id of item.taskIds) if (!byRegister.has(id)) throw Error('Completed behavior names unknown parent: ' + id);
const clauses = tasks.flatMap(task => task.acceptance);
const statuses = countBy(tasks, 'recordedStatus');
const summaries = {
  originalParents: tasks.length, acceptanceClauses: clauses.length, separateUpgrades: upgrades.items.length,
  recordedParentStates: statuses,
  linkedToCommittedSource: tasks.filter(task => task.sourcePresent).length,
  withoutCommittedSourceLink: tasks.filter(task => !task.sourcePresent).length,
  sourceReferences: tasks.reduce((sum, task) => sum + task.sourcePaths.length, 0),
  uniqueSourcePaths: Object.keys(sourceFiles).length,
  missingSourceReferences: Object.values(sourceFiles).filter(file => !file.present).map(file => file.path),
  finalClauseStates: countBy(clauses, 'finalStatus'),
  localClauseStates: countBy(clauses, 'localStatus'),
  fullyAcceptedParents: tasks.filter(task => task.finalAcceptance === 'CERTIFIED').length,
  recordedUpgradeStates: countBy(upgrades.items, 'status'),
};
if (summaries.missingSourceReferences.length) throw Error('Previously linked source is missing from the selected commit');
const verifiedWaves=waves.filter(({data})=>data.fullVerification).map(({data:wave})=>{
  const proof=wave.fullVerification;
  return verifiedRunSummary(read(proof.report),{reportPath:proof.report,readBytes,claimedCounts:proof,expectedSourceCommit:wave.sourceCommit});
});
const fallbackReport='UNFINISHED-WORK/evidence/resume-20261029/run/report.json';
const oldCounts=publication.verification.fullProfiles;
const verification=verifiedWaves.at(-1)??verifiedRunSummary(read(fallbackReport),{reportPath:fallbackReport,readBytes,
  claimedCounts:{passedProfiles:oldCounts.passed,failedProfiles:oldCounts.failed,blockedProfiles:oldCounts.blocked},expectedSourceCommit:publication.testedRuntimeCommit});
for(const file of [verification.report,...Object.values(inputPaths)])blobUrl(file);
const dates = [publication.recordedAt, ...waves.map(x => x.data.recordedAt ?? x.data.createdAt)].filter(Boolean);
if (!dates.length || dates.some(value => typeof value !== 'string' || !Number.isFinite(Date.parse(value)))) {
  throw Error('Progress evidence requires valid recorded timestamps');
}
dates.sort((a, b) => Date.parse(a) - Date.parse(b));
const evidenceDate = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago',
}).format(new Date(dates.at(-1)));
const data = {
  schema: 'mgr.owner-progress-view.v1', derivedOnly: true,
  evidenceAsOf: dates.at(-1), sourceSnapshot: { commit: sourceCommit, tree: sourceTree, publicRef, publicTree,publicBinding },
  overlayPaths: wavePaths, inputs, summaries, verification,
  countingRules: [
    'The 174 original requirements and 28 additive upgrades are separate denominators.',
    'Recorded open does not mean missing code; recorded implemented does not mean accepted.',
    'Committed source, local test coverage and final acceptance are separate measures and must not be added together.',
    'The one historical VERIFIED clause covers source integrity only, not the whole product or its parent.',
    'Named local clause results overlap with full test profiles; no unique-test total is inferred.',
    'Concrete remaining actions come from the detailed work record. Original work and exact acceptance wording are retained; latest scoped evidence is displayed beside them.',
    'This view never mutates the backlog, acceptance register, upgrade register or their historical statuses.',
  ],
  completed, tasks, upgrades: upgrades.items, evidence, sourceFiles,publishedLinks,
};
const percent = (count, total) => (count / total * 100).toFixed(1);
const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const scriptJson = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const fileLink=(file,label)=>{const url=blobUrl(file);return url?'<a href="'+h(url)+'" target="_blank" rel="noopener noreferrer">'+h(label)+'</a>':'<span>'+h(label)+' (not linked at the observed public revision)</span>';};
const markdownLink=(file,label)=>{const url=blobUrl(file);return url?'['+label+']('+url+')':label+' (public link unavailable)';};
const implemented = statuses.implemented_unverified ?? 0;
const originalOpen = tasks.length - implemented - summaries.fullyAcceptedParents;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640" role="img" aria-labelledby="title desc">
<title id="title">MGR original work: measured progress</title><desc id="desc">${summaries.linkedToCommittedSource} of ${tasks.length} requirements have source links; ${implemented} are recorded as implemented but unaccepted; ${summaries.fullyAcceptedParents} are fully accepted. ${verification.passedProfiles} of ${verification.totalProfiles} local test groups passed. These measures overlap and are not an overall app completion score.</desc>
<rect width="1280" height="640" rx="22" fill="#0c1424"/>
<g font-family="Arial, sans-serif"><text x="48" y="64" fill="#78e2c4" font-size="18" font-weight="700">MGR · WORK YOU CAN CHECK</text>
<text x="48" y="112" fill="#f3f7ff" font-size="34" font-weight="700">174 requirements. Every item stays visible.</text>
<text x="48" y="148" fill="#b9c8dd" font-size="18">441 exact acceptance checks · 28 separate upgrades · ${h(evidenceDate)}</text>
${[
  { y: 205, label: 'Requirements with committed source', value: summaries.linkedToCommittedSource, total: tasks.length, color: '#57b3ff', note: 'Code is located; this does not establish completion.' },
  { y: 310, label: 'Recorded implemented; acceptance still open', value: implemented, total: tasks.length, color: '#f4bd58', note: 'An existing implementation still needs its full acceptance evidence.' },
  { y: 415, label: 'Original requirements fully accepted', value: summaries.fullyAcceptedParents, total: tasks.length, color: '#56d5a7', note: 'No parent has all required final acceptance proof recorded.' },
].map(row => `<text x="48" y="${row.y}" fill="#f3f7ff" font-size="20">${row.label}</text><text x="1190" y="${row.y}" text-anchor="end" fill="${row.color}" font-size="24" font-weight="700">${row.value}/${row.total} · ${percent(row.value, row.total)}%</text><rect x="48" y="${row.y + 18}" width="1142" height="16" rx="8" fill="#25334b"/><rect x="48" y="${row.y + 18}" width="${1142 * row.value / row.total}" height="16" rx="8" fill="${row.color}"/><text x="48" y="${row.y + 61}" fill="#b9c8dd" font-size="16">${row.note}</text>`).join('')}
<rect x="48" y="518" width="1142" height="75" rx="12" fill="#152c32"/>
<text x="70" y="550" fill="#78e2c4" font-size="22" font-weight="700">${verification.passedProfiles}/${verification.totalProfiles} local test groups passed · ${percent(verification.passedProfiles, verification.totalProfiles)}%</text>
<text x="70" y="578" fill="#d3e3df" font-size="16">Test pass rate is separate from product completion. Source and evidence are linked in the full view.</text>
</g></svg>`;

let html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; connect-src 'none'">
<title>MGR — exact work and progress</title><style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#edf3ff;background:#0c1424;line-height:1.55;font-size:16px;--muted:#b9c8dd;--panel:#142036;--line:#31425e;--green:#78e2c4;--amber:#f4bd58;--blue:#80bdff;--red:#ff9da8}*{box-sizing:border-box}body{margin:0}main{max-width:1320px;margin:auto;padding:38px 34px 80px}a{color:#9bc9ff;text-underline-offset:3px;overflow-wrap:anywhere}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #f4bd58;outline-offset:4px}h1,h2,h3,p{margin:0}h1{font-size:clamp(2rem,4vw,3.2rem);line-height:1.16;letter-spacing:-.035em;max-width:980px;margin:12px 0 16px}h2{font-size:1.5rem;margin-bottom:14px}h3{font-size:1rem}.eyebrow{text-transform:uppercase;font-weight:750;font-size:.8rem;letter-spacing:.15em;color:var(--green)}.intro{max-width:1000px;color:var(--muted);font-size:1.08rem}.stamp{margin-top:18px;font-size:.82rem;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.metric,.panel,.result{border:1px solid var(--line);background:var(--panel);border-radius:16px;padding:22px}.metrics{margin:28px 0 18px}.metric .value{display:block;font-size:2.25rem;line-height:1.2;font-weight:750;margin:11px 0}.metric p,.result p,.small{color:var(--muted);font-size:.88rem}.blue{color:var(--blue)}.amber{color:var(--amber)}.green{color:var(--green)}.red{color:var(--red)}.meter{height:10px;background:#283750;border-radius:10px;overflow:hidden;margin:14px 0}.meter>span{height:100%;display:block;background:var(--blue)}.banner{padding:16px 20px;background:#152c32;border:1px solid #355f56;border-radius:12px;color:#d9f2e9;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}.banner strong{color:var(--green)}section{margin-top:36px}.section-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}.results{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.result h3{color:var(--green);margin-bottom:10px}.result ul{padding-left:18px;font-size:.84rem;color:var(--muted);margin-bottom:0}.two{display:grid;grid-template-columns:1.15fr 1fr;gap:18px}.stack{display:flex;height:22px;border-radius:9px;overflow:hidden;background:#293751;margin:20px 0}.stack .ready{background:#e9b454}.stack .open{background:#8d9baf}.legend{display:flex;gap:20px;flex-wrap:wrap;font-size:.88rem;color:var(--muted)}.dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}.clause-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.clause-grid strong{font-size:1.4rem;display:block;color:#f1f6ff}.controls{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin:18px 0 12px}label{font-size:.84rem;color:var(--muted);display:block}input,select{display:block;width:100%;font:inherit;color:#edf3ff;background:#111b2d;border:1px solid #50617c;border-radius:8px;padding:11px 12px;margin-top:5px;min-height:46px}input::placeholder{color:#9badc5}.actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:18px 0}.buttons{display:flex;gap:8px;flex-wrap:wrap}button{cursor:pointer;color:#e4eeff;background:#23334d;border:1px solid #526680;border-radius:7px;font:inherit;font-size:.84rem;padding:9px 12px;min-height:40px}button:hover{background:#2c4264}.task{border:1px solid var(--line);border-radius:12px;background:#121e32;margin:10px 0;overflow:hidden}.task>summary{cursor:pointer;list-style:none;display:grid;grid-template-columns:83px 1fr auto;align-items:center;gap:14px;padding:18px}.task>summary::-webkit-details-marker{display:none}.task>summary::after{content:'+';font-size:1.4rem;grid-column:3;grid-row:1;color:var(--blue)}.task[open]>summary::after{content:'−'}.task[open]>summary{border-bottom:1px solid var(--line)}.task-id{font-size:.84rem;font-weight:750;color:var(--blue)}.task-title{font-size:1rem;font-weight:680}.task-meta{font-size:.8rem;color:var(--muted);font-weight:400;margin-top:4px}.task-body{padding:22px}.task-body h3{margin:20px 0 8px}.task-body h3:first-child{margin-top:0}.task-body p,.task-body li{font-size:.92rem}.task-body ul,.task-body ol{padding-left:22px;margin:10px 0 20px}.task-body li{margin:7px 0}.pill{border:1px solid #526680;border-radius:20px;padding:3px 8px;display:inline-block;font-size:.74rem;color:#cbdaf0;margin:2px 6px 2px 0}.pill.local{border-color:#427b6a;color:#9be5ce}.pill.partial{border-color:#957440;color:#f4d097}.criterion{background:#0c1628;border-left:3px solid #426791;border-radius:0 8px 8px 0;padding:16px;margin:14px 0}.criterion h4{margin:0 0 9px;font-size:.94rem}.criterion p{margin:9px 0}.criterion .id{color:var(--blue);font-size:.78rem;margin-bottom:7px}.sources{overflow-wrap:anywhere;font-size:.84rem}.sources a{margin-right:12px}.evidence-links{font-size:.8rem;display:flex;gap:9px;flex-wrap:wrap;margin-top:8px}.nested{margin-top:14px;font-size:.85rem}.nested summary{cursor:pointer;color:#bacbe2}.history{font-size:.82rem;color:#b4c3d8;border-left:3px solid #5e6c83;padding-left:12px}.new-proof{border:1px solid #3b715f;background:#122a2c;border-radius:10px;padding:14px;margin:15px 0}.new-proof h3{color:var(--green);margin:0 0 8px}.empty{padding:35px;border:1px dashed #526680;border-radius:12px;color:var(--muted)}.foot{border-top:1px solid var(--line);padding-top:24px;font-size:.85rem;color:var(--muted)}.foot ol{padding-left:22px}.foot li{margin:10px 0}[hidden]{display:none!important}.skip{position:absolute;left:8px;top:-100px;background:#142036;padding:12px}.skip:focus{top:8px}.noscript{padding:22px;background:#362519;color:#ffddbc}
@media(max-width:820px){main{padding:26px 18px 55px}.grid,.two{grid-template-columns:1fr}.metrics{gap:12px}.metric{padding:18px}.metric .value{font-size:1.9rem}.controls{grid-template-columns:1fr}.task>summary{grid-template-columns:70px 1fr auto;gap:9px;padding:16px 12px}.task-body{padding:16px}.intro{font-size:1rem}.clause-grid{gap:10px}}@media print{:root{color:#111;background:white}main{max-width:none;padding:0}.controls,.actions,.skip{display:none}.task{break-inside:avoid}a{color:#174e86}.panel,.metric,.result,.task,.criterion,.new-proof{background:white;border-color:#aaa}.small,.intro,.stamp,.metric p,.result p,.task-meta,.history,.foot{color:#444}}
</style></head><body><a class="skip" href="#work">Skip to every work item</a><main>
<header><p class="eyebrow">MGR · exact work and evidence</p><h1>See the work. Check the proof.<br>Know the next action.</h1><p class="intro">Every original requirement is below, with its exact acceptance checks, concrete remaining actions, existing source and saved test evidence. New results sit beside the original requirements so completed work stays credited.</p><p class="stamp">${tasks.length} original requirements · ${clauses.length} exact acceptance checks · ${upgrades.items.length} separate upgrades · Evidence through ${h(evidenceDate)}</p></header>
<div class="grid metrics" id="progress-overview">
<article class="metric"><h3>Committed source located</h3><strong class="value blue">${summaries.linkedToCommittedSource}/${tasks.length} <span class="small">${percent(summaries.linkedToCommittedSource, tasks.length)}%</span></strong><div class="meter"><span style="width:${percent(summaries.linkedToCommittedSource, tasks.length)}%"></span></div><p>Requirements with linked code in the selected commit. Source presence is one step toward a working result.</p></article>
<article class="metric"><h3>Recorded implemented</h3><strong class="value amber">${implemented}/${tasks.length} <span class="small">${percent(implemented, tasks.length)}%</span></strong><div class="meter"><span style="width:${percent(implemented, tasks.length)}%;background:var(--amber)"></span></div><p>Implementation is recorded; the complete acceptance proof is still open. Other open items can also contain working code.</p></article>
<article class="metric"><h3>Fully accepted original requirements</h3><strong class="value green">${summaries.fullyAcceptedParents}/${tasks.length} <span class="small">${percent(summaries.fullyAcceptedParents, tasks.length)}%</span></strong><div class="meter"><span style="width:${percent(summaries.fullyAcceptedParents, tasks.length)}%;background:var(--green)"></span></div><p>A whole requirement closes only when all of its original acceptance conditions have the required evidence.</p></article>
</div><div class="banner"><strong>${verification.passedProfiles}/${verification.totalProfiles} last verified local test groups passed · ${percent(verification.passedProfiles, verification.totalProfiles)}%</strong><span class="small">Test pass rate and product completion are different measures.</span>${fileLink(verification.report,"Open test receipt")}</div>
<section><h2>Completed behavior, with its limits</h2><div id="completed" class="results"></div></section>
<section class="two"><article class="panel"><h2>Original requirement record</h2><p class="small">These states retain the original acceptance decision. They are not a fresh estimate of missing code.</p><div class="stack" role="img" aria-label="${implemented} implemented awaiting acceptance; ${originalOpen} otherwise open; ${summaries.fullyAcceptedParents} fully accepted"><span class="ready" style="width:${percent(implemented, tasks.length)}%"></span><span class="open" style="width:${percent(originalOpen, tasks.length)}%"></span></div><div class="legend"><span><i class="dot" style="background:#e9b454"></i>${implemented} implemented · ${percent(implemented, tasks.length)}%</span><span><i class="dot" style="background:#8d9baf"></i>${originalOpen} otherwise open · ${percent(originalOpen, tasks.length)}%</span></div></article><article class="panel"><h2>Local clause evidence recorded</h2><div class="clause-grid"><div><strong>${summaries.localClauseStates.VERIFIED ?? 0}</strong><span class="small">Exact local contract reproduced</span></div><div><strong>${summaries.localClauseStates.PARTIAL ?? 0}</strong><span class="small">Partial local evidence</span></div><div><strong>${summaries.localClauseStates.NOT_REPRODUCED ?? 0}</strong><span class="small">Not reproduced in the register</span></div><div><strong>${summaries.localClauseStates.NOT_RECORDED ?? 0}</strong><span class="small">No local clause result recorded</span></div></div><p class="small" style="margin-top:18px">All ${clauses.length} clauses are included. Additional wave evidence appears beside each matching clause. One historical final clause verifies source integrity only.</p></article></section>
<section id="work"><div class="section-head"><div><h2>Every item, without the hand-waving</h2><p class="small">Open any row for exact remaining actions, acceptance wording and evidence. Search also checks the actions and acceptance text.</p></div><button id="download-markdown" type="button">Download the complete plain-text view</button></div><div class="controls"><label for="search">Search IDs, capabilities or exact work<input id="search" type="search" placeholder="Try DEV-02, Docker, accessibility or GitLab" autocomplete="off"></label><label for="scope">Show<select id="scope"><option value="original">174 original requirements</option><option value="upgrades">28 separate upgrades</option><option value="all">All 202 items</option></select></label><label for="filter">Filter<select id="filter"><option value="all">Every item</option><option value="P0">Priority P0</option><option value="no-source">No committed source link</option><option value="implemented">Recorded implemented</option><option value="local">Has local clause proof</option><option value="new-results">Has completed behavior above</option><option value="connector">Named integrations</option></select></label></div><div class="actions"><p id="result-count" role="status" aria-live="polite"></p><div class="buttons"><button id="expand" type="button">Open all shown</button><button id="collapse" type="button">Close all shown</button><button id="reset" type="button">Clear filters</button></div></div><div id="rows"></div><noscript><p class="noscript">Enable JavaScript to filter and download this view. The exact acceptance register is linked under Original records below.</p></noscript></section>
<section class="foot"><h2>How to read these numbers</h2><ol>${data.countingRules.map(rule => '<li>' + h(rule) + '</li>').join('')}</ol><p>Source snapshot: <code>${h(sourceCommit)}</code>. The source lookup was checked against Git objects; the view never marks a requirement complete. Original records: ${fileLink(inputPaths.backlog,"backlog")}, ${fileLink(inputPaths.register,"exact acceptance register")}, ${fileLink(inputPaths.upgrades,"separate upgrades")}. <button id="download-data" type="button">Download the derived data</button>.</p></section>
</main><script id="progress-data" type="application/json">${scriptJson}</script><script>
'use strict';
const data=JSON.parse(document.getElementById('progress-data').textContent);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const repo='${repositoryUrl}',publicRef=data.sourceSnapshot.publicRef;
function safeUrl(value){if(typeof value!=='string')return null;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&value.startsWith(repo+'/blob/'+publicRef+'/')?url.href:null}catch{return null}}
function sourceUrl(file){return safeUrl(data.publishedLinks[file])}
function refs(ids=[]){return '<div class="evidence-links">'+ids.map(id=>{const item=data.evidence[id];if(!item)return '';const url=item.path?sourceUrl(item.path):null;const label=item.path?item.path.split('/').at(-1):item.kind||'Evidence';return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':'<span>'+esc(label)+(item.reason?' — '+esc(item.reason):item.linkStatus?' — '+esc(item.linkStatus):'')+'</span>'}).join('')+'</div>'}
function list(items=[]){return '<ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>'}
function resultCard(item){return '<article class="result"><h3>'+esc(item.title)+'</h3><p>'+esc(item.observed)+'</p>'+refs(item.evidenceIds)+(item.remaining.length?list(item.remaining):'')+'</article>'}
document.getElementById('completed').innerHTML=data.completed.map(resultCard).join('');
const labels={open:'Open acceptance',implemented_unverified:'Implemented; acceptance open',in_progress:'In progress',blocked:'Blocked',completed_verified:'Fully accepted',verified:'Fully accepted',deferred:'Deferred'};
function clauseCard(item){let extra=item.additionalEvidence.map(proof=>'<div class="new-proof"><h3>Additional recorded behavior</h3><p>'+esc(proof.observed)+'</p>'+(proof.remaining?'<p><strong>Still to prove:</strong> '+esc(proof.remaining)+'</p>':'')+refs(proof.evidenceIds)+'</div>').join('');return '<article class="criterion"><p class="id">'+esc(item.id)+'</p><h4>'+esc(item.requirement)+'</h4><span class="pill">Final acceptance: '+esc(item.finalStatus)+'</span><span class="pill '+(item.localStatus==='VERIFIED'?'local':item.localStatus==='PARTIAL'?'partial':'')+'">Local result: '+esc(item.localStatus.replaceAll('_',' '))+'</span>'+(item.finalVerificationLevel?'<p><strong>Recorded final proof covers:</strong> '+esc(item.finalVerificationLevel)+'</p>':'')+(item.localObserved?'<p><strong>Already demonstrated:</strong> '+esc(item.localObserved)+'</p>':'')+'<p><strong>Remaining proof:</strong> '+esc(item.localRemaining||item.blocker||'No remaining blocker recorded for this clause; this does not close the whole parent requirement.')+'</p>'+refs([...item.localEvidenceIds,...item.finalEvidenceIds])+extra+'</article>'}
function taskCard(item){
 const proofCount=item.acceptance.filter(c=>c.localStatus==='VERIFIED'||c.localStatus==='PARTIAL'||c.additionalEvidence.length).length;
 const update=item.currentScopedState?'<div class="new-proof"><h3>Current scoped result</h3><p>'+esc(item.currentScopedState)+'</p>'+refs(item.taskUpdateEvidenceIds)+'</div>':'';
 const history=item.priorPendingActions.length?'<h3>Earlier remaining-action wording</h3><p class="small">Retained history; superseded by the scoped update above.</p>'+list(item.priorPendingActions):'';
 return '<details class="task" id="task-'+esc(item.id)+'"><summary><span class="task-id">'+esc(item.id)+'</span><div><div class="task-title">'+esc(item.title)+'</div><div class="task-meta">'+esc(item.priority)+' · '+esc(labels[item.recordedStatus]||item.recordedStatus)+' · '+item.acceptance.length+' exact checks · '+(item.sourcePresent?'Source linked':'Source not yet linked')+'</div></div></summary><div class="task-body">'
  +update+item.completedHere.map(index=>'<div class="new-proof"><h3>'+esc(data.completed[index].title)+'</h3><p>'+esc(data.completed[index].observed)+'</p>'+refs(data.completed[index].evidenceIds)+'</div>').join('')
  +'<h3>Specific work / qualification still recorded</h3>'+list(item.pendingActions)+'<p class="small">'+proofCount+' of '+item.acceptance.length+' clauses have at least some local or additional evidence. Exact scope is shown below; this is not a completion percentage.</p><h3>Exact original acceptance checks</h3>'+item.acceptance.map(clauseCard).join('')
  +'<h3>Committed source locations</h3>'+(item.sourcePaths.length?'<div class="sources">'+item.sourcePaths.map(file=>sourceUrl(file)?'<a href="'+esc(sourceUrl(file))+'" target="_blank" rel="noopener noreferrer">'+esc(file)+'</a>':'<span>'+esc(file)+' (public link unavailable)</span>').join(' ')+'</div>':'<p>No source is linked in the canonical record. A catalog entry alone does not establish an operational adapter.</p>')
  +'<details class="nested"><summary>Original work, dependencies and earlier implementation note</summary><h3>Original work statements</h3>'+list(item.originalWork)+'<h3>Earlier implementation note</h3><p class="history">'+esc(item.recordedImplementation)+'</p>'+history+'<p><strong>Dependencies:</strong> '+esc(item.dependencies.join(', ')||'None recorded')+'</p>'+refs(item.evidenceIds)
  +(item.additionalAuditRequirements.length?'<h3>Additional audit requirements</h3>'+item.additionalAuditRequirements.map(x=>'<p><strong>'+esc(x.id)+': '+esc(x.title)+'</strong><br>'+esc(x.resolution_and_acceptance)+'</p>').join(''):'')+'</details></div></details>';
}
function upgradeCard(item){return '<details class="task" id="task-'+esc(item.id)+'"><summary><span class="task-id">'+esc(item.id)+'</span><div><div class="task-title">'+esc(item.title)+'</div><div class="task-meta">'+esc(item.priority)+' · Additive upgrade · Recorded '+esc(item.status.replaceAll('_',' ').toLowerCase())+'</div></div></summary><div class="task-body"><h3>Exact acceptance requirement</h3><p>'+esc(item.acceptance)+'</p><p><strong>Dependencies:</strong> '+esc(item.dependencies.join(', ')||'None recorded')+'</p>'+(item.evidence?'<h3>Recorded evidence</h3>'+list(item.evidence):'<p>No final acceptance evidence is recorded for this upgrade. Its recorded planning state does not establish that every underlying component is absent.</p>')+(item.limits?'<p><strong>Remaining qualification:</strong> '+esc(item.limits)+'</p>':'')+'</div></details>'}
const search=document.getElementById('search'),scope=document.getElementById('scope'),filter=document.getElementById('filter'),rows=document.getElementById('rows');
const originals=data.tasks.map(item=>({kind:'original',item,haystack:[item.id,item.title,item.priority,...item.pendingActions,...item.originalWork,...item.acceptance.map(x=>x.requirement)].join(' ').toLocaleLowerCase()}));
const upgrades=data.upgrades.map(item=>({kind:'upgrade',item,haystack:[item.id,item.title,item.priority,item.acceptance].join(' ').toLocaleLowerCase()}));
function render(){const terms=search.value.trim().toLocaleLowerCase().split(/\\s+/).filter(Boolean);let all=scope.value==='all'?[...originals,...upgrades]:scope.value==='upgrades'?upgrades:originals;const shown=all.filter(({kind,item,haystack})=>terms.every(term=>haystack.includes(term))&&(filter.value==='all'||filter.value==='P0'&&item.priority==='P0'||filter.value==='no-source'&&kind==='original'&&!item.sourcePresent||filter.value==='implemented'&&kind==='original'&&item.recordedStatus==='implemented_unverified'||filter.value==='local'&&kind==='original'&&item.acceptance.some(x=>['VERIFIED','PARTIAL'].includes(x.localStatus)||x.additionalEvidence.length)||filter.value==='new-results'&&kind==='original'&&item.completedHere.length||filter.value==='connector'&&item.id.startsWith('CONN-')));document.getElementById('result-count').textContent=shown.length+' of '+all.length+' items shown';rows.innerHTML=shown.length?shown.map(({kind,item})=>kind==='original'?taskCard(item):upgradeCard(item)).join(''):'<p class="empty">No items match. Clear the filters or search for a task ID.</p>'}
search.addEventListener('input',render);scope.addEventListener('change',render);filter.addEventListener('change',render);
document.getElementById('expand').addEventListener('click',()=>rows.querySelectorAll('.task').forEach(x=>x.open=true));
document.getElementById('collapse').addEventListener('click',()=>rows.querySelectorAll('.task').forEach(x=>x.open=false));
document.getElementById('reset').addEventListener('click',()=>{search.value='';scope.value='original';filter.value='all';render();search.focus()});
function download(name,content,type){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.getElementById('download-data').addEventListener('click',()=>download('mgr-owner-progress.json',JSON.stringify(data,null,2)+'\\n','application/json'));
document.getElementById('download-markdown').addEventListener('click',()=>download('mgr-owner-progress.md',JSON.parse(document.getElementById('progress-markdown').textContent),'text/markdown'));
render();
</script></body></html>\n`;

const markdown = [
  '# MGR — exact work and progress', '',
  `This is a derived view of **${tasks.length} original requirements, ${clauses.length} exact acceptance clauses and ${upgrades.items.length} separate upgrades**. It does not modify their recorded statuses.`, '',
  '## Measured progress', '',
  '| Measure | Count | Percentage | What it means |', '|---|---:|---:|---|',
  `| Requirements with committed source | ${summaries.linkedToCommittedSource}/${tasks.length} | ${percent(summaries.linkedToCommittedSource, tasks.length)}% | Code location verified; not full acceptance. |`,
  `| Recorded implemented, acceptance open | ${implemented}/${tasks.length} | ${percent(implemented, tasks.length)}% | Existing implementation still needs its complete proof. |`,
  `| Original requirements fully accepted | ${summaries.fullyAcceptedParents}/${tasks.length} | ${percent(summaries.fullyAcceptedParents, tasks.length)}% | Every original acceptance condition is satisfied. |`,
  `| Last verified local test groups passed | ${verification.passedProfiles}/${verification.totalProfiles} | ${percent(verification.passedProfiles, verification.totalProfiles)}% | Test pass rate; not product completion. |`, '',
  `Source snapshot: \`${sourceCommit}\`. Latest full local report: ${markdownLink(verification.report,'test receipt')}.`, '',
  '## Completed behavior and saved proof', '',
  ...completed.flatMap(item => [
    `### ${item.title}`, '', item.observed, '',
    `Related original IDs: ${item.taskIds.join(', ')}.`, '',
    ...item.evidenceIds.map(id => '- Evidence: ' + (evidence[id].path ?? evidence[id].url ?? evidence[id].kind)),
    ...item.remaining.map(note => '- Remaining qualification: ' + note), '',
  ]),
  '## All 174 original requirements', '',
  ...tasks.flatMap(task => [
    `### ${task.id} — ${task.title}`, '',
    `**${task.priority} · Recorded ${task.recordedStatus} · ${task.finalAcceptance}**`, '',
    '**Specific remaining actions / qualification recorded**', '',
    ...(task.currentScopedState ? ['Current scoped result: ' + task.currentScopedState, '', ...task.taskUpdateEvidenceIds.map(id => '- Evidence: ' + (evidence[id].path ?? evidence[id].url ?? evidence[id].kind)), ''] : []),
    ...task.pendingActions.map(action => '- ' + action), '',
    '**Exact original acceptance**', '',
    ...task.acceptance.flatMap(clause => [
      `#### ${clause.id}`, '', clause.requirement, '',
      `Final state: **${clause.finalStatus}**${clause.finalVerificationLevel ? ' (' + clause.finalVerificationLevel + ')' : ''}. Local result: **${clause.localStatus}**.`, '',
      ...(clause.localObserved ? ['Already demonstrated: ' + clause.localObserved, ''] : []),
      'Remaining proof: ' + (clause.localRemaining ?? clause.blocker ?? 'No remaining blocker recorded for this clause; the full parent remains separate.'), '',
      ...clause.additionalEvidence.flatMap(item => ['Additional recorded behavior: ' + item.observed, '', 'Remaining scope: ' + item.remaining, '', ...item.evidenceIds.map(id => '- Evidence: ' + (evidence[id].path ?? evidence[id].url ?? evidence[id].kind)), '']),
      ...[...clause.localEvidenceIds, ...clause.finalEvidenceIds].map(id => '- Evidence: ' + (evidence[id].path ?? evidence[id].url ?? evidence[id].kind)), '',
    ]),
    '**Original work statements**', '', ...task.originalWork.map(action => '- ' + action), '',
    'Earlier implementation note: ' + task.recordedImplementation, '',
    ...(task.priorPendingActions.length ? ['Earlier remaining-action wording (retained history; superseded by the scoped update above)', '', ...task.priorPendingActions.map(action => '- ' + action), ''] : []),
    'Dependencies: ' + (task.dependencies.join(', ') || 'None recorded') + '.', '',
    'Source: ' + (task.sourcePaths.map(file => markdownLink(file,file)).join(', ') || 'No committed source link in the canonical record.') + '.', '',
    ...task.additionalAuditRequirements.flatMap(item => [`Additional audit ${item.id}: ${item.title}`, '', item.resolution_and_acceptance, '']),
  ]),
  '## Separate 28 additive upgrades', '',
  ...upgrades.items.flatMap(item => [
    `### ${item.id} — ${item.title}`, '',
    `**${item.priority} · Recorded ${item.status}**`, '',
    'Exact acceptance: ' + item.acceptance, '',
    'Dependencies: ' + (item.dependencies.join(', ') || 'None recorded') + '.', '',
    ...(item.evidence ?? []).map(value => '- Recorded evidence: ' + value),
    ...(item.limits ? ['Remaining qualification: ' + item.limits, ''] : []),
    'The recorded upgrade state is preserved; it is not a claim that all underlying implementation is absent.', '',
  ]),
  '## Counting and provenance', '', ...data.countingRules.map(rule => '- ' + rule), '',
  ...inputs.map(input => `- ${input.path}: SHA-256 \`${input.sha256}\`.`), '',
].join('\n');

html=html.replace('<script id="progress-data"', '<script id="progress-markdown" type="application/json">'+JSON.stringify(markdown).replace(/</g,'\\u003c')+'</script><script id="progress-data"');

const outputs = new Map([
  [outputStem + '.json', JSON.stringify(data, null, 2) + '\n'],
  [outputStem + '.html', html],
  ['public/owner-progress.html',html],
  [outputStem + '.md', markdown],
  [outputStem + '.svg', svg + '\n'],
]);
const receipts = [];
for (const [relative, content] of outputs) {
  const target = path.join(root, relative);
  if (check) {
    if (fs.readFileSync(target, 'utf8') !== content) throw Error('Derived view is stale: ' + relative);
  } else {fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target, content);}
  receipts.push({ path: relative, bytes: Buffer.byteLength(content), sha256: sha256(content) });
}
console.log(JSON.stringify({ checked: check, derivedOnly: true, sourceCommit, summaries, outputs: receipts }, null, 2));
