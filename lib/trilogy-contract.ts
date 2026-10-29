// Versioned cross-product data contract. This module grants no authority.
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/;
const SHA=/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
const HEX=/^[a-f0-9]{64}$/;
export const requestKeys=['contract','jobId','projectId','repositoryId','ownerId','baseCommit','planSha256','candidateRef','commandId','commandSha256'];
export function exact(value:any,keys:string[]){return value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');}
export function validId(value:unknown){return typeof value==='string'&&ID.test(value);}
export function validSha(value:unknown){return typeof value==='string'&&SHA.test(value);}
export function validHex(value:unknown){return typeof value==='string'&&HEX.test(value);}
export function canonical(value:unknown):string{
 const seen=new Set<object>();
 const text=(v:string)=>{if(v!==v.normalize('NFC')||/(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/.test(v))throw Error('Invalid canonical text');return JSON.stringify(v);};
 const encode=(v:any,depth=0):string=>{
  if(depth>64)throw Error('Canonical depth exceeded');
  if(v===null)return 'null';if(typeof v==='string')return text(v);if(typeof v==='boolean')return String(v);
  if(typeof v==='number'){if(!Number.isFinite(v)||Object.is(v,-0))throw Error('Invalid canonical number');return JSON.stringify(v);}
  if(typeof v!=='object'||seen.has(v)||(!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null))throw Error('Invalid canonical object');
  seen.add(v);try{if(Array.isArray(v)){if(Object.keys(v).length!==v.length)throw Error('Invalid canonical array');return '['+v.map(x=>encode(x,depth+1)).join(',')+']';}return '{'+Object.keys(v).sort().map(k=>text(k)+':'+encode(v[k],depth+1)).join(',')+'}';}finally{seen.delete(v);}
 };return encode(value);
}
export async function hashBytes(value:Uint8Array|string){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;const result=await crypto.subtle.digest('SHA-256',bytes as BufferSource);return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');}
export const canonicalHash=(value:unknown)=>hashBytes(canonical(value));
export function validateRequest(request:any){
 if(!exact(request,requestKeys)||request.contract!=='mgr.trilogy.job.v1'||!['jobId','projectId','repositoryId','ownerId','commandId'].every(k=>validId(request[k]))||!validSha(request.baseCommit)||!validHex(request.planSha256)||!validHex(request.commandSha256)||typeof request.candidateRef!=='string'||!/^refs\/heads\/mgr\/candidates\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(request.candidateRef))throw Error('Invalid trilogy request');
 return request;
}
export async function executionIdentity(request:any){validateRequest(request);const id=await canonicalHash({jobId:request.jobId,ownerId:request.ownerId,projectId:request.projectId,repositoryId:request.repositoryId});return {campaignId:'trilogy:'+id,taskId:request.jobId,agentId:'trilogy-code-monster'};}
export async function snapshotCommand(){const spec={version:1,commandId:'omni-snapshot-v1',executable:'node',args:['--test','tests/omni-snapshot.test.mjs'],cwd:'.'};return {...spec,commandSha256:await hashBytes(JSON.stringify(spec))};}
export function decodeBase64(value:unknown,maxBytes=20000){if(typeof value!=='string'||value.length>Math.ceil(maxBytes/3)*4||! /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw Error('Invalid bounded base64');const raw=atob(value);if(raw.length>maxBytes||btoa(raw)!==value)throw Error('Invalid base64 encoding');return Uint8Array.from(raw,c=>c.charCodeAt(0));}
export function encodeBase64(value:Uint8Array){let text='';for(const byte of value)text+=String.fromCharCode(byte);return btoa(text);}
export async function publicKey(pem:string){const encoded=pem.match(/^-----BEGIN PUBLIC KEY-----\s+([A-Za-z0-9+/=\s]+)-----END PUBLIC KEY-----\s*$/)?.[1].replace(/\s/g,'');if(!encoded)throw Error('Trusted verifier public key required');const der=decodeBase64(encoded,1024);const key=await crypto.subtle.importKey('spki',der as BufferSource,{name:'Ed25519'},false,['verify']);return {key,keySha256:await hashBytes(der)};}
export async function verifyReceipt({request,candidateCommit,receipt,output,publicKeyPem,notBefore=0,expiresAt=Number.MAX_SAFE_INTEGER}:{request:any;candidateCommit:string;receipt:any;output:Uint8Array;publicKeyPem:string;notBefore?:number;expiresAt?:number}){
 validateRequest(request);const identity=await executionIdentity(request);
 if(!exact(receipt,['version','campaignId','taskId','baseCommit','targetCommit','commandId','commandSha256','exitCode','outputSha256','outputBytes','startedAt','endedAt','signature'])||receipt.version!==2||receipt.exitCode!==0||!Number.isSafeInteger(receipt.outputBytes)||receipt.outputBytes<1||receipt.outputBytes>20000||receipt.outputBytes!==output.length||receipt.outputSha256!==await hashBytes(output)||!validSha(candidateCommit))throw Error('Invalid signed execution evidence');
 new TextDecoder('utf-8',{fatal:true}).decode(output);
 for(const [key,value] of Object.entries({...identity,baseCommit:request.baseCommit,targetCommit:candidateCommit,commandId:request.commandId,commandSha256:request.commandSha256})){if(key!=='agentId'&&receipt[key]!==value)throw Error('Execution identity mismatch');}
 if(!Number.isSafeInteger(notBefore)||!Number.isSafeInteger(expiresAt)||!['startedAt','endedAt'].every(k=>typeof receipt[k]==='string'&&Number.isFinite(Date.parse(receipt[k]))&&new Date(receipt[k]).toISOString()===receipt[k])||Date.parse(receipt.endedAt)<Date.parse(receipt.startedAt)||Date.parse(receipt.startedAt)<notBefore||Date.parse(receipt.endedAt)>=expiresAt||Date.parse(receipt.endedAt)>Date.now())throw Error('Invalid execution timestamps');
 const trusted=await publicKey(publicKeyPem),{signature,...body}=receipt;
 const sig=decodeBase64(signature,128);if(sig.length!==64||!await crypto.subtle.verify({name:'Ed25519'},trusted.key,sig as BufferSource,new TextEncoder().encode(canonical(body))))throw Error('Execution signature rejected');
 return {receiptSha256:await canonicalHash(receipt),signerKeySha256:trusted.keySha256,outputSha256:receipt.outputSha256,outputBytes:receipt.outputBytes,commandSha256:receipt.commandSha256,startedAt:receipt.startedAt,endedAt:receipt.endedAt};
}
