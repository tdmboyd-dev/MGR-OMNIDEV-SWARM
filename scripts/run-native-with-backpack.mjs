import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {runNativeWithBackpack} from './native-backpack-context.mjs';

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 if(process.argv.length!==4||process.argv[2]!=='--config'||!path.isAbsolute(process.argv[3]))throw Error('Usage: node scripts/run-native-with-backpack.mjs --config C:/absolute/private/workflow.json');
 const bytes=fs.readFileSync(process.argv[3]);if(bytes.length>16384)throw Error('Owner workflow configuration exceeds bound');
 const result=await runNativeWithBackpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
 console.log(JSON.stringify(result,null,2));
 // A host procedure must not label an empty queue as a passing verification.
 process.exitCode=result.claimed!==1?2:result.passed!==true?1:result.backpack.recordError?3:0;
}
