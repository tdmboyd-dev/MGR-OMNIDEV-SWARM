import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {mkdtempSync,writeFileSync,readdirSync,readFileSync,realpathSync,lstatSync,rmSync} from 'node:fs';
import {join,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(join(root,'package.json'));

test('patched image dependencies still produce an actual PNG through the framework OG dependency',async()=>{
 const frameworkRequire=createRequire(realpathSync(join(root,'node_modules/vinext/package.json')));
 const {ImageResponse}=await import(pathToFileURL(frameworkRequire.resolve('@vercel/og')).href);
 const React=require('react');
 const response=new ImageResponse(React.createElement('div',{style:{display:'flex',width:'100%',height:'100%',background:'#123456'}}),{width:64,height:32});
 const bytes=Buffer.from(await response.arrayBuffer());
 assert.equal(response.headers.get('content-type'),'image/png');
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),64);assert.equal(bytes.readUInt32BE(20),32);
});

test('patched compiler still generates and checks a real SQLite migration without contacting a database',()=>{
 const dir=mkdtempSync(join(tmpdir(),'mgr-security-drizzle-'));
 try{
  const output=join(dir,'generated'),config=join(dir,'config.cjs');
  writeFileSync(config,'module.exports = '+JSON.stringify({schema:join(root,'db/schema.ts').replaceAll('\\','/'),out:'./generated',dialect:'sqlite'})+';\n');
  const executable=join(root,'node_modules/drizzle-kit/bin.cjs');
  for(const command of ['generate','check']){
   const result=spawnSync(process.execPath,[executable,command,'--config',config],{cwd:dir,encoding:'utf8',timeout:30000,windowsHide:true});
   assert.equal(result.error,undefined);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  }
  const migrations=readdirSync(output).filter(name=>name.endsWith('.sql'));assert(migrations.length>0);
  assert(migrations.some(name=>/CREATE TABLE/.test(readFileSync(join(output,name),'utf8'))));
 }finally{
  assert.equal(lstatSync(dir).isSymbolicLink(),false);assert.equal(dirname(realpathSync(dir)),realpathSync(tmpdir()));assert(basename(dir).startsWith('mgr-security-drizzle-'));
  rmSync(dir,{recursive:true,force:true,maxRetries:3,retryDelay:100});
 }
});
