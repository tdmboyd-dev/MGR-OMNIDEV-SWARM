import {verify,createHash} from 'node:crypto';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
export const allowedFiles=['dashboard.mjs','dashboard.html','chatgpt.mjs','job-memory.mjs','engine/update.mjs','engine/public-key.pem'];
export function validateRelease(envelope,key,current=0){
 if(!envelope||typeof envelope.payload!=='string'||envelope.payload.length>1000000||typeof envelope.signature!=='string'||!verify(null,Buffer.from(envelope.payload),key,Buffer.from(envelope.signature,'base64')))throw Error('Release signature rejected');
 const r=JSON.parse(envelope.payload);if(r.product!=='omnidev-engine'||!Number.isSafeInteger(r.sequence)||r.sequence<=current||!Array.isArray(r.files)||r.files.length!==allowedFiles.length)throw Error('Release version rejected');
 const seen=new Set();for(const f of r.files){if(!allowedFiles.includes(f.path)||seen.has(f.path)||typeof f.content!=='string'||createHash('sha256').update(f.content).digest('hex')!==f.sha256)throw Error('Release file rejected');seen.add(f.path);}return r;
}
export async function stageRelease(envelope,home,key){
 let pointer;try{pointer=JSON.parse(await readFile(join(home,'current.json'),'utf8'));}catch{pointer={sequence:0};}
 let rejected=0;try{rejected=JSON.parse(await readFile(join(home,'rejected.json'),'utf8')).sequence;}catch{}let payload;try{payload=JSON.parse(envelope.payload);}catch{throw Error('Invalid release');}if(payload.sequence===rejected)throw Error('Release previously failed readiness; awaiting repaired release');if(payload.sequence===pointer.sequence)return {updated:false};
 let pending=0;try{pending=JSON.parse(await readFile(join(home,'pending.json'),'utf8')).sequence;}catch{}const r=validateRelease(envelope,key,Math.max(pointer.sequence,pending));if(r.files.find(f=>f.path==='engine/public-key.pem').content!==key)throw Error('Trust key replacement rejected');const path=join(home,'releases',String(r.sequence));await mkdir(path,{recursive:true});
 for(const f of r.files){await mkdir(join(path,f.path,'..'),{recursive:true});await writeFile(join(path,f.path),f.content,{mode:0o600});}
 const temp=join(home,'pending.tmp');await writeFile(temp,JSON.stringify({sequence:r.sequence,previous:pointer.sequence}),{mode:0o600});await rename(temp,join(home,'pending.json'));return {updated:true,sequence:r.sequence};
}
