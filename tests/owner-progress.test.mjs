import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script,createContext} from 'node:vm';
import {PUBLIC_REPOSITORY,repositoryPath,projectPublicEvidence,validatePublicWave,verifiedRunSummary} from '../scripts/owner-progress-evidence.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
const hash=value=>createHash('sha256').update(value).digest('hex');
const revision='a'.repeat(40);
function runReport(){
  const output=Buffer.from('PASS actual regression output\n'),reportPath='evidence/run/report.json';
  const report={schema:'mgr.full-verification.v1',completed:true,sourceCommit:revision,requestedProfiles:['working','failed','blocked'],
    runs:[{profile:'working',passed:true,sourceCommit:revision,sourceCommitAfter:revision,sourceUnchanged:true,exitCode:0,signal:null,truncated:false,processClosed:true,outputObserved:true,capturedBytes:output.length,totalOutputBytes:output.length,outputSha256:hash(output),outputFile:'working.log'},
      {profile:'failed',passed:false,reason:'assertion failed'},{profile:'blocked',passed:false,blocked:true,reason:'source changed'}],
    summary:{passedProfiles:1,failedProfiles:1,blockedProfiles:1,totalProfiles:3},localRegressionPassed:false};
  return {report,options:{reportPath,expectedSourceCommit:revision,readBytes:file=>{assert.equal(file,'evidence/run/working.log');return output;}}};
}

test('progress totals come from actual unique execution receipts with matching saved output',()=>{
  const {report,options}=runReport(),result=verifiedRunSummary(report,options);
  assert.deepEqual({passed:result.passedProfiles,failed:result.failedProfiles,blocked:result.blockedProfiles,total:result.totalProfiles},{passed:1,failed:1,blocked:1,total:3});
  assert.equal(result.sourceCommit,revision);
});

test('claimed passing counts and percentages cannot override the executed run',()=>{
  const {report,options}=runReport();
  for(const claimedCounts of [{passedProfiles:99},{totalProfiles:1},{failedProfiles:0},{blockedProfiles:-1}]){
    assert.throws(()=>verifiedRunSummary(report,{...options,claimedCounts}),/summary differs/);
  }
  for(const change of [
    value=>value.summary.passedProfiles=3,
    value=>value.summary.totalProfiles=0,
    value=>value.localRegressionPassed=true,
    value=>value.requestedProfiles[1]='working',
  ]){const altered=clone(report);change(altered);assert.throws(()=>verifiedRunSummary(altered,options));}
});

test('missing, modified, truncated or wrong-source output cannot become a passing progress receipt',()=>{
  const {report,options}=runReport();
  assert.throws(()=>verifiedRunSummary(report,{...options,readBytes:()=>Buffer.from('changed')}),/output hash or byte count/);
  assert.throws(()=>verifiedRunSummary(report,{...options,expectedSourceCommit:'b'.repeat(40)}),/source commit/);
  for(const change of [
    value=>delete value.runs[0].outputFile,
    value=>value.runs[0].truncated=true,
    value=>value.runs[0].sourceCommitAfter='b'.repeat(40),
    value=>value.runs[0].exitCode=1,
    value=>value.runs[0].outputFile='../../outside.log',
    value=>value.completed=false,
  ]){const altered=clone(report);change(altered);assert.throws(()=>verifiedRunSummary(altered,options));}
});

test('public evidence exports a bounded reference and excludes arbitrary bodies, credentials and unsafe URLs',()=>{
  const projected=projectPublicEvidence({kind:'executed-local-output',path:'evidence/run.log',sourceRevision:revision,sha256:'c'.repeat(64),
    token:'credential-secret-needle',outputBase64:'private-output-needle',files:[{content:'private-source-needle'}],argv:['--token','credential-secret-needle'],url:'javascript:alert(1)'});
  assert.deepEqual(projected,{kind:'executed-local-output',path:'evidence/run.log',sourceRevision:revision,sha256:'c'.repeat(64)});
  for(const url of ['javascript:alert(1)','data:text/html,<script>bad()</script>','https://outside.example/?token=secret','https://github.com/other/private/blob/main/key']){
    const value=projectPublicEvidence({url,token:'secret'});
    assert.ok(!JSON.stringify(value).includes(url));assert.equal(value.url,undefined);
  }
});

test('private companion references are omitted without leaking their names or source paths',()=>{
  for(const item of [
    {repo:'private-owner/hidden-companion',path:'private-code/internal.ts',sourceRevision:revision},
    {repository:'private-owner/hidden-companion',path:'private-code/internal.ts'},
    {visibility:'private',path:'private-code/internal.ts'},
    {private:true,path:'private-code/internal.ts'},
    {path:'.env.production'},
    {path:'keys/signer.pem'},
  ]){const value=projectPublicEvidence(item);assert.equal(value.withheld,true);assert.equal(value.path,undefined);assert.ok(!JSON.stringify(value).includes('hidden-companion'));assert.ok(!JSON.stringify(value).includes('private-code'));}
  assert.throws(()=>validatePublicWave({repository:'private-owner/hidden-companion'}),/public repository/);
  assert.throws(()=>validatePublicWave({repository:PUBLIC_REPOSITORY,visibility:'private'}),/public repository/);
  assert.throws(()=>validatePublicWave({}),/explicitly/);
  assert.equal(validatePublicWave({repository:PUBLIC_REPOSITORY}).repository,PUBLIC_REPOSITORY);
});

test('evidence references reject escaping paths on either operating system',()=>{
  for(const value of ['/tmp/a','C:\\private\\a','../a','evidence/../../a','a\\b','a//b','a/./b','a\0b'])assert.throws(()=>repositoryPath(value));
  assert.equal(repositoryPath('UNFINISHED-WORK/evidence/output.log'),'UNFINISHED-WORK/evidence/output.log');
});

function checkout(){
  const root=resolve(fileURLToPath(new URL('..',import.meta.url))),temporary=mkdtempSync(join(tmpdir(),'omni-progress-'));
  const run=(command,args,cwd=temporary)=>execFileSync(command,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:20*1024*1024});
  run('git',['clone','--quiet','--shared',root,temporary]);
  for(const file of ['scripts/build-owner-progress.mjs','scripts/owner-progress-evidence.mjs'])copyFileSync(join(root,file),join(temporary,file));
  const git=(...args)=>run('git',args).trim();
  const source=git('rev-parse','HEAD'),stem=join(temporary,'UNFINISHED-WORK/owner-progress-20261029');
  return {root:temporary,source,git,run,stem,generate:(...args)=>run(process.execPath,['scripts/build-owner-progress.mjs','--source-ref',source,'--public-ref',source,...args]),read:extension=>readFileSync(stem+'.'+extension,'utf8'),clean:()=>rmSync(temporary,{recursive:true,force:true})};
}

test('the generated public app view preserves all 441 clauses and ignores uncommitted input edits',()=>{
  const f=checkout();
  try{
    const original=JSON.parse(f.git('show',f.source+':UNFINISHED-WORK/backlog.json'));
    f.generate();
    const first=f.read('json'),data=JSON.parse(first),html=f.read('html');
    assert.equal(data.tasks.length,174);assert.equal(data.upgrades.length,28);assert.equal(data.tasks.flatMap(t=>t.acceptance).length,441);
    for(const task of original.tasks){const derived=data.tasks.find(t=>t.id===task.id);assert.deepEqual(derived.acceptance.map(c=>c.requirement),task.acceptance);assert.deepEqual(derived.originalWork,task.work);assert.equal(derived.recordedStatus,task.status);}
    assert.ok(data.inputs.every(input=>input.sourceCommit===f.source&&input.readFrom==='committed-git-object'&&/^[a-f0-9]{40}$/.test(input.gitBlob)));
    assert.equal(html,readFileSync(join(f.root,'public/owner-progress.html'),'utf8'));
    const encoded=html.match(/<script id="progress-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
    assert.deepEqual(JSON.parse(encoded),data);
    assert.equal(JSON.parse(html.match(/<script id="progress-markdown" type="application\/json">([\s\S]*?)<\/script>/)[1]),f.read('md'));
    const changed=clone(original);changed.tasks[0].title='Uncommitted private change must not be exported';
    writeFileSync(join(f.root,'UNFINISHED-WORK/backlog.json'),JSON.stringify(changed));
    f.generate();assert.equal(f.read('json'),first);assert.ok(!f.read('html').includes(changed.tasks[0].title));
    f.generate('--check');
  }finally{f.clean();}
});

test('public source links are withheld when their selected blob differs from the cited public revision',()=>{
  const f=checkout();
  try{
    const file='lib/github-account.ts',full=join(f.root,file);
    writeFileSync(full,readFileSync(full,'utf8')+'\n// progress provenance regression\n');
    f.git('add','--',file);f.git('-c','user.name=Progress Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','fixture changed source');
    const head=f.git('rev-parse','HEAD');
    f.run(process.execPath,['scripts/build-owner-progress.mjs','--source-ref',head,'--public-ref',f.source]);
    const data=JSON.parse(f.read('json'));
    assert.equal(data.sourceFiles[file].present,true);
    assert.equal(data.sourceFiles[file].url,null);
    assert.equal(data.publishedLinks[file],undefined);
    assert.equal(data.sourceSnapshot.commit,head);
    assert.equal(data.sourceSnapshot.publicRef,f.source);
  }finally{f.clean();}
});

test('a newer committed overlay updates the visible evidence date in the owner timezone',()=>{
  const f=checkout();
  try{
    const file='UNFINISHED-WORK/progress-date-fixture.json';
    writeFileSync(join(f.root,file),JSON.stringify({repository:PUBLIC_REPOSITORY,recordedAt:'2026-10-31T02:00:00.000Z'}));
    f.git('add','--',file);f.git('-c','user.name=Progress Fixture','-c','user.email=fixture@example.invalid','commit','--quiet','-m','fixture newer progress evidence');
    const head=f.git('rev-parse','HEAD');
    f.run(process.execPath,['scripts/build-owner-progress.mjs','--source-ref',head,'--public-ref',f.source,'--wave',file]);
    assert.equal(JSON.parse(f.read('json')).evidenceAsOf,'2026-10-31T02:00:00.000Z');
    assert.ok(f.read('html').includes('Evidence through October 30, 2026'));
    assert.ok(f.read('svg').includes('October 30, 2026'));
    f.run(process.execPath,['scripts/build-owner-progress.mjs','--check']);
  }finally{f.clean();}
});

test('the actual generated filter script searches full acceptance wording and preserves separate scopes',()=>{
  const f=checkout();
  try{
    f.generate();const html=f.read('html'),data=JSON.parse(f.read('json'));
    const nodes=new Map(),element=id=>{
      if(!nodes.has(id))nodes.set(id,{value:id==='scope'?'original':id==='filter'?'all':'',textContent:'',innerHTML:'',listeners:{},addEventListener(type,listener){this.listeners[type]=listener;},querySelectorAll(){return [];},focus(){}});
      return nodes.get(id);
    };
    element('progress-data').textContent=JSON.stringify(data);
    const script=html.match(/<script>\s*('use strict';[\s\S]*?)<\/script>/)[1];
    const context=createContext({document:{getElementById:element},URL,Blob,setTimeout,console});
    new Script(script).runInContext(context);
    assert.equal(element('result-count').textContent,'174 of 174 items shown');
    element('search').value='AUTH-01';element('search').listeners.input();
    assert.equal(element('result-count').textContent,'1 of 174 items shown');
    assert.ok(element('rows').innerHTML.includes(data.tasks.find(t=>t.id==='AUTH-01').acceptance[0].requirement));
    element('search').value='nonexistent-query-needle';element('search').listeners.input();assert.equal(element('result-count').textContent,'0 of 174 items shown');
    element('search').value='';element('scope').value='upgrades';element('scope').listeners.change();assert.equal(element('result-count').textContent,'28 of 28 items shown');
    element('scope').value='all';element('scope').listeners.change();assert.equal(element('result-count').textContent,'202 of 202 items shown');
    element('reset').listeners.click();assert.equal(element('scope').value,'original');assert.equal(element('result-count').textContent,'174 of 174 items shown');
  }finally{f.clean();}
});
