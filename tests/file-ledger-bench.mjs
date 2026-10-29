import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from 'typescript';

// Isolated deterministic ledger unit test. The production hashing and analyzer
// contracts are represented by test doubles; higher-level integration tests
// still validate the real import graph and database.
let source=await readFile(new URL('../lib/file-ledger.ts',import.meta.url),'utf8');
source=source.replace("import {fingerprint} from './control-plane';",'')
  .replace("import {analyze} from './analyzer';",'');
source=`const fingerprint=async content=>{const crypto=await import('node:crypto');return crypto.createHash('sha256').update(content).digest('hex')};\nconst analyze=files=>({findings:files.filter(f=>f.content.includes('eval(')).map(f=>({file:f.path,path:f.path}))});\n`+source;
const transpiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {fileLedger}=await import('data:text/javascript;base64,'+Buffer.from(transpiled).toString('base64'));
const files=Array.from({length:3000},(_,i)=>({path:`src/file-${i}.ts`,content:`const a${i}=${i}` }));
const t0=performance.now(),first=await fileLedger(files),t1=performance.now();
const second=await fileLedger(files,first),t2=performance.now();
assert.equal(first.length,3000);assert.ok(second.every((x,i)=>x===first[i]));
const dirty=await fileLedger([{path:files[1].path,content:'eval("bad")'}],first,[files[1].path]);
assert.equal(dirty[0].findingCount,1); // One finding with matching file and path counts once.
assert.equal(dirty[0].runtimeVerified,false);
assert.equal(dirty[0].status,'changed-awaiting-runtime-verification');
console.log(JSON.stringify({passed:5,coldMs:Math.round(t1-t0),warmMs:Math.round(t2-t1),files:3000,scope:'isolated ledger fixture; not full-repository benchmark'}));
