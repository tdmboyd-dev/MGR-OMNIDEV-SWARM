import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const message='Local job persistence requires recovery. Preserve the pending file and reconcile the previous result before starting generation again.';
const recoveryError=()=>Object.assign(Error(message),{code:'JOB_MEMORY_RECOVERY_REQUIRED',status:503});
const pending=/^([a-f0-9]{64})\.json\.[a-f0-9-]{36}$/;

// Native-operation adapters are trusted local fault-injection seams, never
// request data. Production callers use the filesystem defaults.
export async function jobMemory(directory,{replace=rename,platform=process.platform}={}){
 await mkdir(directory,{recursive:true,mode:0o700});
 const digest=id=>createHash('sha256').update(id).digest('hex');
 const file=id=>join(directory,digest(id)+'.json');
 const recovery=new Set((await readdir(directory)).map(name=>name.match(pending)?.[1]).filter(Boolean));
 return {
  async list(){
   const names=await readdir(directory),rows=[];
   for(const name of names.filter(n=>/^[a-f0-9]{64}\.json$/.test(n)).slice(-2000)){
    try{
     const job=JSON.parse(await readFile(join(directory,name),'utf8'));
     rows.push(recovery.has(name.slice(0,64))?{...job,status:'recovery-required',error:message}:job);
    }catch{}
   }
   return rows;
  },
  async get(id){
   if(recovery.has(digest(id)))throw recoveryError();
   try{return JSON.parse(await readFile(file(id),'utf8'));}
   catch(error){if(error.code==='ENOENT')return null;throw error;}
  },
  async save(job){
   const key=digest(job.id);if(recovery.has(key))throw recoveryError();
   const destination=file(job.id),temporary=destination+'.'+randomUUID();
   try{
    await writeFile(temporary,JSON.stringify(job),{mode:0o600,flag:'wx'});
    for(let attempt=0;;attempt++){
     try{await replace(temporary,destination);return;}
     catch(error){
      if(platform!=='win32'||!['EPERM','EACCES','EBUSY'].includes(error.code)||attempt>=7)throw error;
      await new Promise(resolve=>setTimeout(resolve,Math.min(10*2**attempt,200)));
     }
    }
   }catch{
    // Preserve the old committed file and exact pending bytes for recovery.
    // Never unlink the destination, claim success or automatically replay.
    recovery.add(key);throw recoveryError();
   }
  }
 };
}
