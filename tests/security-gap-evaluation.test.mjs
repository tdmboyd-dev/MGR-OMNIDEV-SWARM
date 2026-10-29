import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {securityGapCorpus,securityRuleTitles} from './fixtures/security-gap-corpus.mjs';

const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const url=source=>'data:text/javascript;base64,'+Buffer.from(compile(source)).toString('base64');
const source=readFileSync(new URL('../lib/analyzer.ts',import.meta.url),'utf8');
let runnable=source,helperSource=null;
if(source.includes("'./snapshot-security'")){
 helperSource=readFileSync(new URL('../lib/snapshot-security.ts',import.meta.url),'utf8');
 runnable=source.replace("'./snapshot-security'",JSON.stringify(url(helperSource)));
}
const {analyze}=await import(url(runnable));
const rows=securityGapCorpus.map(entry=>{
 const result=analyze([{path:entry.path,content:entry.content}]);
 return {...entry,detected:result.findings.some(f=>f.title===securityRuleTitles[entry.rule]),result};
});
for(const row of rows)test(row.id,()=>{
 assert.equal(row.detected,row.expected,`${row.rule}: expected ${row.expected}, detected ${row.detected}`);
 if(row.detected){
  const finding=row.result.findings.find(f=>f.title===securityRuleTitles[row.rule]);
  assert.equal(finding.confidence,'heuristic');assert.ok(finding.file&&finding.evidence&&finding.remediation);
 }
});

test('credential evidence does not disclose the literal value',()=>{
 const secret='LOCAL_TEST_VALUE_DO_NOT_DISCLOSE';
 const result=analyze([{path:'src/config.ts',content:'const password = "'+secret+'";'}]);
 assert.ok(result.findings.some(f=>f.title===securityRuleTitles.credential));
 assert.ok(!JSON.stringify(result).includes(secret));
});

test('coverage names supported lexical/data modes and keeps other languages explicitly heuristic',()=>{
 const result=analyze([{path:'src/app.ts',content:'const value = 1;'}, {path:'config.json',content:'{"value":1}'}, {path:'example.py',content:'# eval(example)'}]);
 assert.equal(result.securityAnalysis.contract,'mgr.snapshot-security.v1');assert.equal(result.securityAnalysis.complete,false);
 assert.deepEqual(result.securityAnalysis.files.map(f=>f.mode),['javascript-typescript-lexical','json-literals','generic-text-pattern']);
 assert.match(result.securityAnalysis.files[2].limitations,/not parsed/);
 assert.ok(result.findings.find(f=>f.file==='example.py'&&f.title===securityRuleTitles.eval));
});
test('invalid or oversized source reports missing inspection instead of claiming complete security coverage',()=>{
 for(const file of [{path:'broken.json',content:'{"password":'}, {path:'broken.ts',content:'const text = "unterminated'}, {path:'large.ts',content:' '.repeat(200_001)}]){
  const result=analyze([file]);assert.equal(result.securityAnalysis.complete,false);
  assert.match(result.securityAnalysis.files[0].status,/^not-inspected/);
 }
});
test('nested adversarial calls exhaust a bounded analysis budget and stay explicitly unqualified',()=>{
 const result=analyze([{path:'src/nested.ts',content:'eval('.repeat(1500)+'input'+')'.repeat(1500)}]);
 assert.equal(result.securityAnalysis.complete,false);assert.match(result.securityAnalysis.files[0].status,/^not-inspected/);
});
test('warning points to the real source line after comment-only examples',()=>{
 const result=analyze([{path:'src/api.ts',content:'// eval(example)\n// query("SELECT" + example)\neval(userInput);'}]);
 assert.match(result.findings.find(f=>f.title===securityRuleTitles.eval).evidence,/^Line 3:/);
});
test('generic SQL text fallback retains its qualified line and statement boundaries',()=>{
 for(const [content,expected] of [['query("SELECT" + input)',true],['execute("SELECT" + input)',true],['query("SELECT");\nvalue + offset',false],['query("SELECT")\nvalue + offset',false],['query("SELECT", [base + offset])',true]]){
  const result=analyze([{path:'source.unknown',content}]);
  assert.equal(result.findings.some(f=>f.title===securityRuleTitles.sql),expected);
  assert.equal(result.securityAnalysis.files[0].mode,'generic-text-pattern');
  assert.match(result.securityAnalysis.files[0].limitations,/not parsed/);
 }
});
test('large repeated generic query names remain bounded without inventing concatenation',()=>{
 const result=analyze([{path:'source.unknown',content:'query('.repeat(30_000)}]);
 assert.equal(result.securityAnalysis.files[0].status,'inspected-heuristic');
 assert.ok(!result.findings.some(f=>f.title===securityRuleTitles.sql));
});

const byRule=Object.fromEntries(Object.keys(securityRuleTitles).map(rule=>{
 const cases=rows.filter(r=>r.rule===rule),positives=cases.filter(r=>r.expected).length,negatives=cases.length-positives;
 const falsePositive=cases.filter(r=>!r.expected&&r.detected).length,falseNegative=cases.filter(r=>r.expected&&!r.detected).length;
 return [rule,{cases:cases.length,positives,negatives,falsePositive,falseNegative,falsePositiveRate:negatives?falsePositive/negatives:null,falseNegativeRate:positives?falseNegative/positives:null}];
}));
console.log('SECURITY_GAP_CORPUS_RESULT '+JSON.stringify({schema:'mgr.security-gap-rule-evaluation.v1',sourceSha256:createHash('sha256').update(source).digest('hex'),helperSha256:helperSource?createHash('sha256').update(helperSource).digest('hex'):null,corpusSha256:createHash('sha256').update(JSON.stringify(securityGapCorpus)).digest('hex'),total:rows.length,byRule,qualification:'Hand-labeled local regression inputs. No semantic taint analysis, vulnerability confirmation or production accuracy threshold.',mismatches:rows.filter(r=>r.expected!==r.detected).map(({id,expected,detected})=>({id,expected,detected}))}));
