import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const resolved=name=>pathToFileURL(require.resolve(name)).href;
function compile(path,imports={}) {
  const source=readFileSync(new URL('../'+path,import.meta.url),'utf8');
  let js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  for(const [name,url] of Object.entries({'react':resolved('react'),'react/jsx-runtime':resolved('react/jsx-runtime'),'lucide-react':resolved('lucide-react'),...imports})) {
    js=js.replaceAll("'"+name+"'",JSON.stringify(url)).replaceAll('"'+name+'"',JSON.stringify(url));
  }
  return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
}
const planningUrl=compile('lib/workspace-planning.ts');
const {buildFuturePlan}=await import(planningUrl);
const uiUrl=compile('components/planning-workspace.tsx',{'@/lib/workspace-planning':planningUrl});
const {FuturePlanRecord,FuturePlanningWorkspace}=await import(uiUrl);
const decisionUrl=compile('components/decision-record.tsx');
const {DecisionRecord}=await import(decisionUrl);
const intelligenceUrl=compile('components/intelligence-workspace.tsx',{'@/lib/workspace-planning':planningUrl,'@/components/decision-record':decisionUrl,'@/components/voice-input':compile('components/voice-input.tsx')});
const {IntelligenceWorkspace,SearchEvidenceHit}=await import(intelligenceUrl);
const render=(component,props)=>renderToStaticMarkup(createElement(component,props));
const noop=()=>{};
const project={id:'project-a',kind:'project',title:'Checkout <script>unsafe()</script>',projectId:'',status:'imported',createdAt:'2026-10-29T10:00:00Z',updatedAt:'2026-10-29T10:00:00Z',data:{revision:2,files:[{path:'src/pay.ts',content:'eval(input);'}],analysis:{findings:[]}}};
const finding={id:'finding-a',kind:'finding',title:'Dynamic execution',projectId:project.id,status:'open',createdAt:project.createdAt,updatedAt:project.updatedAt,data:{severity:'critical',category:'Security',file:'src/pay.ts',evidence:'Unvalidated input reaches execution',remediation:'Validate input and remove unsafe execution'}};
const records=[project,finding];
const data=await buildFuturePlan(project,records);
const plan={id:'plan-a',kind:'roadmap',title:'Checkout future plan',projectId:project.id,status:'proposed',createdAt:project.createdAt,updatedAt:project.updatedAt,data:{...data,version:1}};
const props={plan,selectedProjectId:project.id,onEvaluate:noop,onSelectProject:noop};
function elements(node) {
  if(Array.isArray(node))return node.flatMap(elements);
  if(!node||typeof node!=='object'||!node.props)return [];
  return [node,...elements(node.props.children)];
}

test('actual plan renderer exposes evidence, original milestones, tradeoffs and uncertainty for all four horizons',()=>{
  const html=render(FuturePlanRecord,props);
  for(const h of plan.data.horizons){assert.ok(html.includes(h.version));assert.ok(html.includes(h.title));assert.ok(html.includes(h.milestone.measure));}
  for(const phrase of ['What we are testing:','Evidence behind this proposal','Still unknown','Depends on:','Tradeoffs','Undo plan:','Stop when:','Confidence is unassessed.'])assert.ok(html.includes(phrase),phrase);
  assert.ok(html.includes('src/pay.ts'));assert.ok(html.includes(plan.data.contractDigest));assert.equal((html.match(/aria-label="Record outcome for /g)||[]).length,4);
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
});

test('aggregate and wrong-project views disable each outcome control and offer the explicit owning project',()=>{
  for(const selectedProjectId of [undefined,'project-b']) {
    const tree=FuturePlanRecord({...props,selectedProjectId});const all=elements(tree);
    const controls=all.filter(e=>e.type==='button'&&e.props['aria-label']?.startsWith('Record outcome for '));
    assert.equal(controls.length,4);assert.ok(controls.every(b=>b.props.disabled));
    const html=render(FuturePlanRecord,{...props,selectedProjectId});assert.ok(html.includes('Select this project to record outcomes'));
  }
  let selected;const tree=FuturePlanRecord({...props,selectedProjectId:undefined,onSelectProject:id=>{selected=id}});
  elements(tree).find(e=>e.type==='button'&&!e.props['aria-label']).props.onClick();assert.equal(selected,project.id);
});

test('enabled horizon control passes the exact chosen plan and horizon to the evaluation form',()=>{
  let chosen;const tree=FuturePlanRecord({...props,onEvaluate:(plan,horizon)=>{chosen={plan,horizon}}});
  const control=elements(tree).find(e=>e.type==='button'&&e.props['aria-label']==='Record outcome for V5 in Checkout future plan');
  assert.equal(control.props.disabled,false);control.props.onClick();assert.equal(chosen.plan,plan);assert.equal(chosen.horizon,'V5');
});

test('earlier templates remain readable without offering unsupported outcome recording',()=>{
  const legacy={...plan,data:{horizons:[{version:'V2',title:'Earlier design',scope:'Old scope'}],method:'Earlier template'}};
  const html=render(FuturePlanRecord,{...props,plan:legacy});assert.ok(html.includes('Earlier design'));
  assert.ok(html.includes('Generate a new evidence-based plan'));assert.ok(!html.includes('Record observed outcome'));
});

test('recorded evaluation preserves the original hypothesis and visibly separates changed source and observation',()=>{
  const observed={...plan,data:{...plan.data,revision:2,evaluations:[{id:'evaluation-a',horizon:'V2',conclusion:'inconclusive',actualOutcome:'Only one failure path reproduced',evidence:'Run 2026-10-29, bounded local test',recordedAt:project.updatedAt,verification:'Owner-recorded observation, not independent verification.',plannedSourceDigest:plan.data.source.sourceDigest,observedSource:{...plan.data.source,sourceDigest:'new-source'}}]}};
  const html=render(FuturePlanRecord,{...props,plan:observed});assert.ok(html.includes(plan.data.horizons[0].hypothesis.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));
  assert.ok(html.includes('Recorded outcome: inconclusive'));assert.ok(html.includes('Only one failure path reproduced'));assert.ok(html.includes('Original proposal preserved:'));assert.ok(html.includes('The project changed between the proposal and this observation'));
});

test('future screen requires explicit project selection even when other projects exist in records',()=>{
  const base={records,plans:[plan],busy:false,onAction:async()=>{},onRefresh:async()=>{},onSelectProject:noop};
  const all=render(FuturePlanningWorkspace,base);assert.match(all,/<button[^>]*disabled=""[^>]*>Generate evidence-based plan<\/button>/);
  assert.ok(all.includes('All projects is a browsing view.'));
  const chosen=render(FuturePlanningWorkspace,{...base,project});assert.match(chosen,/<button type="button" class="primary-btn">Generate evidence-based plan<\/button>/);
  assert.ok(chosen.includes('Selected project: Checkout'));
});

const decision={id:'decision-a',kind:'decision',projectId:project.id,title:'Isolate <img src=x>',status:'evaluated',createdAt:project.createdAt,updatedAt:project.updatedAt,data:{revision:3,reason:'Preserve the original',alternatives:'Direct edit',risks:'More setup',expectedOutcome:'Isolated change passes',actualOutcome:'Corrected after another observation',lessons:'Qualify deployment separately',source:plan.data.source},history:[{id:'history-a',kind:'memory',createdAt:project.updatedAt,data:{previous:{revision:2,actualOutcome:'Earlier result',lessons:'Earlier lesson'},next:{revision:3,actualOutcome:'Corrected after another observation',lessons:'Qualify deployment separately'}}}]};

test('actual decision renderer shows expected and observed results with readable correction history and escaped input',()=>{
  const html=render(DecisionRecord,{decision,projectTitle:project.title,onEdit:noop});
  for(const phrase of ['Expected outcome:','Observed outcome:','Lesson learned:','Preserved outcome history','Earlier result','Earlier lesson','Corrected after another observation','owner-recorded observations'])assert.ok(html.includes(phrase));
  assert.ok(html.includes('does not independently verify'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));
  let selected;const tree=DecisionRecord({decision,projectTitle:project.title,onEdit:item=>{selected=item}});
  elements(tree).find(e=>e.type==='button').props.onClick();assert.equal(selected,decision);
});

test('unevaluated decision shows missing outcome rather than a successful result',()=>{
  const pending={...decision,status:'recorded',data:{...decision.data,actualOutcome:null,lessons:null},history:[]};
  const html=render(DecisionRecord,{decision:pending,projectTitle:'Workspace decision',onEdit:noop});assert.ok(html.includes('No outcome recorded yet.'));assert.ok(html.includes('Awaiting an observation.'));assert.ok(!html.includes('Preserved outcome history'));
});

test('search hit renderer identifies the historical revision and separates original from observed source without claiming verification',()=>{
  const hit={id:'history-a',kind:'memory',title:'Earlier <script>result</script>',excerpt:'The first observation remains available.',
    citation:{recordId:'history-a',updatedAt:project.updatedAt,projectId:project.id,
      lineage:{kind:'decision-outcome',decisionId:'decision-a',revision:2,previousRevision:1},
      source:{projectId:project.id,revision:0,sourceDigest:'original-source'},observedSource:{projectId:project.id,revision:1,sourceDigest:'observed-source'},
      provenance:'Recorded source context, not independent proof of the observation.'},limitations:'Owner-recorded outcome; validate its evidence.'};
  const html=render(SearchEvidenceHit,{hit});
  for(const phrase of ['Decision revision:</b> 2','previous revision 1','Original decision context:','Workspace when the observation was recorded:','original-source','observed-source','Both versions remain attached.','not independent proof','Owner-recorded outcome'])assert.ok(html.includes(phrase),phrase);
  assert.ok(html.includes('snapshot revision 0'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
});

test('search hit renderer preserves the cited plan version and original proposal identity',()=>{
  const hit={id:'plan-b',kind:'roadmap',title:'Next proposal',excerpt:'A retained planning hypothesis',
    citation:{recordId:'plan-b',updatedAt:project.updatedAt,lineage:{kind:'future-plan',planId:'plan-b',planVersion:2,revision:3,previousPlanId:'plan-a',contractDigest:'frozen-contract'},source:{projectId:project.id,revision:2,sourceDigest:'proposal-source'}},limitations:'Hypothesis; not a guaranteed future.'};
  const html=render(SearchEvidenceHit,{hit});
  for(const phrase of ['Plan version:</b> 2','record revision 3','Original proposal context:','frozen-contract','Earlier plan record:','plan-a','not a guaranteed future'])assert.ok(html.includes(phrase),phrase);
  assert.ok(!html.includes('Decision revision:'));
});

test('older search results without lineage show missing source context instead of inventing a revision',()=>{
  const html=render(SearchEvidenceHit,{hit:{id:'note-a',kind:'memory',title:'Retained note',excerpt:'Earlier free-text context',citation:{recordId:'note-a',updatedAt:project.updatedAt}}});
  assert.ok(html.includes('No source version is attached to this search citation.'));
  assert.ok(html.includes('not been independently verified'));assert.ok(!html.includes('Decision revision:'));assert.ok(!html.includes('Plan version:'));
});

test('actual intelligence screen identifies selected or unassigned decision scope and preserves recovery controls',()=>{
  const selected=render(IntelligenceWorkspace,{project,records,onUpdate:async()=>{}});
  const all=render(IntelligenceWorkspace,{records,onUpdate:async()=>{}});
  assert.ok(selected.includes('Searching records for Checkout'));assert.ok(selected.includes('This decision will be attached to Checkout'));
  assert.ok(all.includes('This will be a workspace decision with no project attached.'));assert.ok(!all.includes('This decision will be attached to Checkout'));
  for(const html of [selected,all]){assert.ok(html.includes('Decisions, outcomes and lessons'));assert.ok(html.includes('Download workspace backup'));assert.ok(html.includes('Validate a backup'));assert.ok(html.includes('No matching evidence')===false);}
  const dir=new URL('../outputs/verification-render/',import.meta.url);mkdirSync(dir,{recursive:true});
  writeFileSync(new URL('planning-ui.html',dir),'<!doctype html><html lang="en"><meta charset="utf-8"><title>Planning and decision UI static verification</title><body data-verification-scope="react-static-markup-and-control-callbacks-only">'+render(FuturePlanRecord,props)+render(DecisionRecord,{decision,projectTitle:project.title,onEdit:noop})+selected+'</body></html>\n');
});
