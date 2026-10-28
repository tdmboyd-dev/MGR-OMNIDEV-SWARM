import {cpus,totalmem} from 'node:os';
// CPU/memory admission is separate from container limits. The slowest budget wins.
export function workerCapacity({cpuCount=cpus().length,memoryBytes=totalmem(),requested=1}={}){
 if(!Number.isInteger(requested)||requested<1||requested>10)throw Error('OMNI_WORKER_SLOTS must be an integer from 1 to 10');
 const cpuSlots=Math.floor(cpuCount*0.7/2),memorySlots=Math.floor(memoryBytes*0.7/(1024**3));
 return {slots:Math.max(0,Math.min(requested,cpuSlots,memorySlots)),requested,cpuSlots,memorySlots,reserve:0.3,scope:'Per worker process; use one process per host. Performance requires measurement.'};
}
export async function boundedPool(items,slots,run){if(!Number.isInteger(slots)||slots<1||slots>10)throw Error('Invalid worker pool budget');let cursor=0,halt=false;const results=[];await Promise.all(Array.from({length:Math.min(slots,items.length)},async()=>{while(!halt&&cursor<items.length){const index=cursor++;try{results[index]={status:'fulfilled',value:await run(items[index])};}catch(reason){results[index]={status:'rejected',reason};if(/cleanup.*unverified|cleanup is unverified/i.test(reason.message))halt=true;}}}));if(halt)throw Error('Container cleanup is unverified; worker host quarantined');return results;}
