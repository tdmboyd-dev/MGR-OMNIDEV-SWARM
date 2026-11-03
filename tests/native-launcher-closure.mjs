import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

test('native launcher identity invalidates qualification when a worker input or imported module changes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'omni-native-source-closure-'));
 try{
  for(const name of ['windows-appcontainer.mjs','windows/AppContainerHost.cs','windows/run-appcontainer.ps1','runner.mjs','fleet.mjs','application-profile.mjs','trilogy-proof.mjs']){const target=join(root,name);await mkdir(dirname(target),{recursive:true});await writeFile(target,await readFile(join('worker',name)));}
  const {nativeLauncherDigest}=await import(pathToFileURL(join(root,'windows-appcontainer.mjs')).href);const original=await nativeLauncherDigest();
  for(const name of ['runner.mjs','application-profile.mjs','trilogy-proof.mjs']){
   const path=join(root,name),bytes=await readFile(path);await writeFile(path,Buffer.concat([bytes,Buffer.from('\n// changed imported worker module\n')]));
   assert.notEqual(await nativeLauncherDigest(),original,name+' must invalidate the saved launcher identity');await writeFile(path,bytes);assert.equal(await nativeLauncherDigest(),original);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
