import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const source=readFileSync(new URL('../lib/executive-scorecard.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {executiveScorecard}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const require=createRequire(import.meta.url);
const panelSource=readFileSync(new URL('../components/executive-scorecard.tsx',import.meta.url),'utf8');
const panelCompiled=ts.transpileModule(panelSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
 .replaceAll('"react/jsx-runtime"',JSON.stringify(pathToFileURL(require.resolve('react/jsx-runtime')).href));
const {ExecutiveScorecardPanel}=await import('data:text/javascript;base64,'+Buffer.from(panelCompiled).toString('base64'));
const render=card=>renderToStaticMarkup(createElement(ExecutiveScorecardPanel,{card}));
const names=['Security','Performance','Architecture','Scalability','Reliability','Maintainability','Innovation','Revenue Potential','AI Readiness','Technical Debt','Operational Excellence','Developer Experience','User Experience','Business Health'];
const project={id:'project-a',title:'Selected project',updatedAt:'2026-10-29T10:00:00Z',data:{revision:3,analysis:{scores:{Security:100,Performance:100},findings:[]}}};

test('the original 14 dimensions have methodology, required evidence and an explicit unknown state',()=>{
 const card=executiveScorecard();assert.deepEqual(card.dimensions.map(d=>d.name),names);
 for(const d of card.dimensions){assert.equal(d.status,'unassessed');assert.equal(d.value,null);assert.equal(d.coverage,0);assert.ok(d.methodology.length>30);assert.equal(d.requiredEvidence.length,2);assert.ok(d.nextAction.length>30);assert.ok(d.reason);}
 assert.equal(card.overallScore,null);assert.equal(card.certification,false);
});
test('perfect heuristic scores cannot become executive measurements, evidence or certification',()=>{
 const card=executiveScorecard(project);assert.equal(card.assessedDimensions,0);assert.equal(card.weightedCoverage,0);
 assert.ok(card.dimensions.every(d=>d.value===null&&d.evidence.length===0));assert.equal(card.certification,false);
});
test('actual snapshot findings retain source and revision without becoming measured controls',()=>{
 const p=structuredClone(project);p.data.analysis.findings=[{title:'SQL concatenation',file:'api/orders.ts',category:'Security',severity:'critical'}];
 const card=executiveScorecard(p),security=card.dimensions.find(d=>d.name==='Security');
 assert.equal(security.evidence.length,1);assert.equal(security.evidence[0].recordId,p.id);assert.equal(security.evidence[0].snapshotRevision,3);assert.equal(security.evidence[0].path,'api/orders.ts');
 assert.equal(security.criticalFlags.length,1);assert.equal(security.evidence[0].kind,'snapshot-signal');assert.equal(security.status,'unassessed');assert.equal(card.overallScore,null);
});
test('missing source identity does not attach orphan findings',()=>{
 const p=structuredClone(project);p.id=' ';p.data.analysis.findings=[{title:'test',file:'x',category:'Security',severity:'critical'}];
 const card=executiveScorecard(p);assert.equal(card.source,null);assert.ok(card.dimensions.every(d=>d.evidence.length===0));
});
test('malformed finding collections do not crash the owner dashboard or create evidence',()=>{
 for(const findings of [null,{},42,'all passed',[null,{}, {title:'x',file:'y',category:'Security',severity:7}]]){
  const p=structuredClone(project);p.data.analysis.findings=findings;assert.ok(executiveScorecard(p).dimensions.every(d=>d.evidence.length===0));
 }
});
test('accessibility signals remain a scoped lead, not a UX score or business proxy',()=>{
 const p=structuredClone(project);p.data.analysis.findings=[{title:'Missing alt text',file:'view.tsx',category:'Accessibility',severity:'medium'}];
 const card=executiveScorecard(p);assert.equal(card.dimensions.find(d=>d.name==='User Experience').evidence.length,1);
 assert.equal(card.dimensions.find(d=>d.name==='Business Health').evidence.length,0);assert.equal(card.dimensions.find(d=>d.name==='User Experience').value,null);
});
test('repeated evaluation is deterministic and cannot mutate source records',()=>{
 const original=structuredClone(project);const first=executiveScorecard(project),second=executiveScorecard(project);
 assert.deepEqual(first,second);assert.deepEqual(project,original);
 first.dimensions[0].requiredEvidence.push('altered');assert.equal(executiveScorecard(project).dimensions[0].requiredEvidence.length,2);
});
test('absent or invalid revision stays unknown rather than inventing a pinned source revision',()=>{
 for(const revision of [undefined,-1,0,3.5,Infinity,'3']){const p=structuredClone(project);p.data.revision=revision;assert.equal(executiveScorecard(p).source.revision,null);}
});
test('actual React panel renders fourteen native evidence disclosures and no unsupported measured score',()=>{
 const html=render(executiveScorecard(project));
 assert.equal((html.match(/<details\b/g)||[]).length,14);assert.equal((html.match(/<summary\b/g)||[]).length,14);
 assert.equal((html.match(/>Unassessed</g)||[]).length,14);
 for(const name of names)assert.ok(html.includes(name));
 assert.ok(html.includes('0 of 14 dimensions have qualified measurements.'));
 assert.ok(html.includes('not certifications'));assert.ok(!/<(?:progress|meter)\b/.test(html));assert.ok(!html.includes('NaN'));
 const dir=new URL('../outputs/verification-render/',import.meta.url);mkdirSync(dir,{recursive:true});
 writeFileSync(new URL('executive-static-render.html',dir),'<!doctype html><html lang="en"><meta charset="utf-8"><title>Executive panel static render verification</title><body data-verification-scope="react-static-markup-only">'+html+'</body></html>\n');
});
test('actual React panel preserves security signals and escapes user-controlled project text',()=>{
 const p=structuredClone(project);p.title='<img src=x onerror=alert(1)>';
 p.data.analysis.findings=[{title:'Possible SQL injection',file:'src/api.ts',category:'Security',severity:'critical'}];
 const html=render(executiveScorecard(p));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));
 assert.ok(html.includes('Possible SQL injection'));assert.ok(html.includes('src/api.ts'));assert.ok(html.includes('critical'));
 assert.ok(html.includes('Heuristic source finding'));assert.equal((html.match(/>Unassessed</g)||[]).length,14);
});
test('actual React panel empty state exposes the evidence requirement rather than a fake healthy baseline',()=>{
 const html=render(executiveScorecard(null));assert.ok(html.includes('Select a project to collect evidence'));
 assert.ok(html.includes('Evidence needed:'));assert.ok(html.includes('Next action:'));
 assert.ok(!html.includes('100/100'));assert.equal((html.match(/>Unassessed</g)||[]).length,14);
});
