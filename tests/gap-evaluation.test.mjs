import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {gapCorpus,gapRuleTitles} from './fixtures/gap-corpus.mjs';

const source=readFileSync(new URL('../lib/analyzer.ts',import.meta.url),'utf8');
const helper=readFileSync(new URL('../lib/snapshot-security.ts',import.meta.url),'utf8');
const helperJs=ts.transpileModule(helper,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const helperUrl='data:text/javascript;base64,'+Buffer.from(helperJs).toString('base64');
const emitted=ts.transpileModule(source.replace("'./snapshot-security'",JSON.stringify(helperUrl)),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {analyze}=await import('data:text/javascript;base64,'+Buffer.from(emitted).toString('base64'));
const rows=gapCorpus.map(entry=>{
 const result=analyze(entry.files),finding=result.findings.find(f=>f.title===gapRuleTitles[entry.rule]);
 return {...entry,detected:!!finding,finding,scope:result.scope};
});

for(const row of rows)test(row.id,()=>{
 assert.equal(row.detected,row.expected,`${row.rule}: expected ${row.expected}, detected ${row.detected}`);
 if(row.finding){
  assert.equal(row.finding.confidence,'heuristic');
  assert.ok(row.finding.file&&row.finding.evidence&&row.finding.remediation);
 }
 assert.match(row.scope,/snapshot/i);
});

const byRule=Object.fromEntries(Object.keys(gapRuleTitles).map(rule=>{
 const measured=rows.filter(row=>row.rule===rule);
 const positives=measured.filter(row=>row.expected).length,negatives=measured.length-positives;
 const falsePositive=measured.filter(row=>!row.expected&&row.detected).length;
 const falseNegative=measured.filter(row=>row.expected&&!row.detected).length;
 return [rule,{cases:measured.length,positives,negatives,truePositive:positives-falseNegative,trueNegative:negatives-falsePositive,falsePositive,falseNegative,falsePositiveRate:negatives?falsePositive/negatives:null,falseNegativeRate:positives?falseNegative/positives:null}];
}));
console.log('GAP_CORPUS_RESULT '+JSON.stringify({schema:'mgr.gap-rule-evaluation.v1',sourceSha256:createHash('sha256').update(source).digest('hex'),helperSha256:createHash('sha256').update(helper).digest('hex'),corpusSha256:createHash('sha256').update(JSON.stringify(gapCorpus)).digest('hex'),total:rows.length,byRule,qualification:'Hand-labeled local regression corpus for image alt presence and test-path recognition only. No production false-positive threshold or semantic accessibility judgment. SQL, eval and credential signals have a separate security corpus; other rules remain unmeasured.',mismatches:rows.filter(row=>row.detected!==row.expected).map(({id,expected,detected})=>({id,expected,detected}))}));
