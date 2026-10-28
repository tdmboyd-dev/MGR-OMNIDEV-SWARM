/** Bound bytes before decoding/JSON allocation; Content-Length is only an early hint. */
export async function boundedRequestText(request:Request,maxBytes:number):Promise<string>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1)throw new Error('Invalid body limit');
 const advertised=request.headers.get('content-length');
 if(advertised&&/^\d+$/.test(advertised)&&Number(advertised)>maxBytes)throw new Error('Request body exceeds byte limit');
 if(!request.body)return '';
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
 try{
  while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>maxBytes)throw new Error('Request body exceeds byte limit');chunks.push(value);}
  const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder('utf-8',{fatal:true}).decode(body);
 }catch(error){try{await reader.cancel();}catch{}throw error;}finally{reader.releaseLock();}
}
