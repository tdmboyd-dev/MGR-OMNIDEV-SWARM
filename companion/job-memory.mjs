import {mkdir,readFile,writeFile,rename,readdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
export async function jobMemory(directory){
 await mkdir(directory,{recursive:true,mode:0o700});
 const file=id=>join(directory,createHash('sha256').update(id).digest('hex')+'.json');
 // Serialize reads and writes so Windows never renames over our own open read handle.
 let tail=Promise.resolve();
 const serial=operation=>{const result=tail.then(operation);tail=result.catch(()=>{});return result;};
 return {
  list(){return serial(async()=>{const names=await readdir(directory),rows=[];for(const name of names.filter(n=>/^[a-f0-9]{64}\.json$/.test(n)).slice(-2000)){try{rows.push(JSON.parse(await readFile(join(directory,name),'utf8')));}catch{}}return rows;});},
  get(id){return serial(async()=>{try{return JSON.parse(await readFile(file(id),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}});},
  save(job){const snapshot=JSON.stringify(job),id=JSON.parse(snapshot).id;return serial(async()=>{const temp=file(id)+'.'+randomUUID();try{await writeFile(temp,snapshot,{mode:0o600,flag:'wx'});for(let attempt=0;;attempt++){try{await rename(temp,file(id));break;}catch(e){if(!['EPERM','EACCES','EBUSY'].includes(e.code)||attempt>=9)throw e;await new Promise(resolve=>setTimeout(resolve,20));}}}finally{await rm(temp,{force:true});}});}
 };
}
