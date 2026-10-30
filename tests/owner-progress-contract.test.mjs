import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isCompleteProgressBoard,isCompleteProgressData} from '../lib/owner-progress-contract.mjs';

const board=readFileSync(new URL('../public/owner-progress.html',import.meta.url),'utf8');
const original=JSON.parse(board.match(/<script id="progress-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const changed=change=>{const data=JSON.parse(JSON.stringify(original));change(data);return data;};
const encode=data=>'<!doctype html><html><script id="progress-markdown" type="application/json">"# Saved work and progress"</script><script id="progress-data" type="application/json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script></html>';
const reject=changes=>{for(const [name,change] of changes){const data=changed(change);assert.equal(isCompleteProgressData(data),false,name);assert.equal(isCompleteProgressBoard(encode(data)),false,name+' in HTML');}};

test('the committed board and its complete data remain valid without mutation',()=>{
 const before=JSON.stringify(original);
 assert.equal(isCompleteProgressBoard(board),true);
 assert.equal(isCompleteProgressData(original),true);
 assert.equal(JSON.stringify(original),before);
});

test('missing, duplicated, oversized or truncated board envelopes fail closed',()=>{
 for(const html of [null,42,'',board.slice(0,-30),'<html>temporary error</html>',
  '<!doctype html><html><script id="progress-data" type="application/json">null</script></html>',
  encode(original).replace('</html>','<script id="progress-data" type="application/json">{}</script></html>'),
  '<!doctype html><html>'+' '.repeat(4000000)+'</html>']){
  assert.equal(isCompleteProgressBoard(html),false);
 }
});

test('all original and upgrade identities stay unique and separately counted',()=>reject([
 ['missing original',d=>d.tasks.pop()],
 ['duplicate original',d=>d.tasks[1].id=d.tasks[0].id],
 ['missing upgrade',d=>d.upgrades.pop()],
 ['duplicate upgrade',d=>d.upgrades[1].id=d.upgrades[0].id],
 ['upgrade collides with original',d=>d.upgrades[0].id=d.tasks[0].id],
 ['invalid upgrade dependency list',d=>d.upgrades[0].dependencies=null],
 ['missing upgrade acceptance',d=>d.upgrades[0].acceptance='']
]));

test('displayed counts must agree with the detailed records',()=>reject([
 ['invented accepted parents',d=>d.summaries.fullyAcceptedParents=174],
 ['wrong source linked count',d=>d.summaries.linkedToCommittedSource++],
 ['wrong unlinked count',d=>d.summaries.withoutCommittedSourceLink++],
 ['wrong source references',d=>d.summaries.sourceReferences++],
 ['wrong unique sources',d=>d.summaries.uniqueSourcePaths++],
 ['wrong parent states',d=>d.summaries.recordedParentStates.open++],
 ['wrong final clause states',d=>d.summaries.finalClauseStates.UNVERIFIED++],
 ['wrong local clause states',d=>d.summaries.localClauseStates.NOT_RECORDED++],
 ['wrong upgrade states',d=>d.summaries.recordedUpgradeStates.PLANNED++],
 ['unsupported extra state total',d=>d.summaries.recordedParentStates.unsupported=0]
]));

test('each clause retains its parent and complete renderer data',()=>reject([
 ['wrong clause owner',d=>d.tasks[0].acceptance[0].id='WRONG/AC-01'],
 ['duplicated clause',d=>d.tasks[0].acceptance[1].id=d.tasks[0].acceptance[0].id],
 ['empty requirement',d=>d.tasks[0].acceptance[0].requirement=' '],
 ['missing local state',d=>d.tasks[0].acceptance[0].localStatus=null],
 ['missing additional evidence',d=>d.tasks[0].acceptance[0].additionalEvidence=null],
 ['certified without full proof',d=>{d.tasks[0].finalAcceptance='CERTIFIED';d.summaries.fullyAcceptedParents=1;}]
]));

test('missing arrays and stale completion references cannot enter the renderer',()=>reject([
 ['missing pending actions',d=>d.tasks[0].pendingActions=null],
 ['missing original work',d=>d.tasks[0].originalWork=null],
 ['missing historical actions',d=>d.tasks[0].priorPendingActions=null],
 ['missing task dependencies',d=>d.tasks[0].dependencies=null],
 ['unknown completion index',d=>d.tasks[0].completedHere=[99999]],
 ['unrelated completion reference',d=>d.tasks[0].completedHere=[d.completed.findIndex(item=>!item.taskIds.includes(d.tasks[0].id))]],
 ['incomplete audit requirement',d=>d.tasks[0].additionalAuditRequirements=[{}]],
 ['missing completed remaining actions',d=>d.completed[0].remaining=null]
]));

test('evidence and source references must resolve to the provided maps',()=>reject([
 ['unknown task proof',d=>d.tasks[0].evidenceIds=['missing-proof']],
 ['unknown clause proof',d=>d.tasks[0].acceptance[0].localEvidenceIds=['missing-proof']],
 ['missing source',d=>delete d.sourceFiles[d.tasks[0].sourcePaths[0]]],
 ['bad source identity',d=>d.sourceFiles[d.tasks[0].sourcePaths[0]].gitBlob='main'],
 ['wrong source present flag',d=>d.tasks[0].sourcePresent=!d.tasks[0].sourcePresent],
 ['unreferenced source entry',d=>d.sourceFiles['extra.js']={path:'extra.js',present:false}]
]));

test('referenced evidence must provide renderable labels without hiding restricted or unavailable proof',()=>{
 const evidenceId=original.completed[0].evidenceIds[0];
 reject([
  ['object evidence path',d=>d.evidence[evidenceId].path={unexpected:'object'}],
  ['array evidence path',d=>d.evidence[evidenceId].path=['evidence.json']],
  ['empty evidence path',d=>d.evidence[evidenceId].path=''],
  ['null evidence path',d=>d.evidence[evidenceId].path=null],
  ['object evidence label',d=>d.evidence[evidenceId].kind={}],
  ['object unavailable reason',d=>d.evidence[evidenceId].reason={}],
  ['array link state',d=>d.evidence[evidenceId].linkStatus=[]],
 ]);
 for(const reference of [
  {kind:'restricted-reference',withheld:true,reason:'Private evidence is withheld.'},
  {kind:'unavailable-reference',reason:'No public reference is recorded.'},
  {path:'evidence/not-yet-published.json',linkStatus:'Not available at the observed public revision'},
 ])assert.equal(isCompleteProgressData(changed(d=>{d.evidence[evidenceId]=reference;})),true);
});

test('the markdown download requires one nonempty string payload',()=>{
 const pattern=/<script id="progress-markdown" type="application\/json">[\s\S]*?<\/script>/;
 const block=board.match(pattern)[0];
 const malformed=[board.replace(pattern,''),board.replace(block,block+block)];
 for(const payload of ['null','{}','[]','42','true','""','"   "','not-json']){
  malformed.push(board.replace(pattern,()=>'<script id="progress-markdown" type="application/json">'+payload+'</script>'));
 }
 for(const html of malformed)assert.equal(isCompleteProgressBoard(html),false);
 assert.equal(isCompleteProgressBoard(board),true);
});

test('local pass totals and source identity remain internally consistent',()=>reject([
 ['invented passes',d=>d.verification.passedProfiles=999],
 ['negative failures',d=>d.verification.failedProfiles=-1],
 ['inconsistent total',d=>d.verification.totalProfiles++],
 ['unpinned test source',d=>d.verification.sourceCommit='main'],
 ['unpinned board source',d=>d.sourceSnapshot.commit='main'],
 ['invalid evidence date',d=>d.evidenceAsOf='not-a-date']
]));

test('valid failed and blocked local profiles do not hide the board',()=>{
 const data=changed(d=>{d.verification.passedProfiles=d.verification.totalProfiles-2;d.verification.failedProfiles=1;d.verification.blockedProfiles=1;});
 assert.equal(isCompleteProgressData(data),true);
 assert.equal(isCompleteProgressBoard(encode(data)),true);
});

test('invalid top-level payloads return false instead of throwing',()=>{
 for(const data of [null,[],{},true,42,'board',{...original,evidence:null},{...original,sourceSnapshot:null}]){
  assert.equal(isCompleteProgressData(data),false);
 }
});
