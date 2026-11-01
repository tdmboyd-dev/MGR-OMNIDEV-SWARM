// Protocol fixture only. Private-permission callback is deliberately synthetic;
// actual Windows permission and native execution acceptance run separately.
import {startLocalWorkerApi} from '../../scripts/local-worker-api.mjs';
let app,started=false,buffer='';
process.stdin.setEncoding('utf8');
process.stdin.on('data',async chunk=>{
 buffer+=chunk;if(buffer.length>20000){console.error('fixture-input-limit');process.exitCode=1;process.stdin.destroy();return;}
 const index=buffer.indexOf('\n');if(index<0||started)return;started=true;
 try{const request=JSON.parse(buffer.slice(0,index));buffer='';app=await startLocalWorkerApi(request.config,{verifyPrivateState:async()=>{if(request.rejectPrivate)throw Error('fixture-private-state-denied');}});console.log(JSON.stringify({ready:true,origin:app.origin,sourceFingerprint:app.sourceFingerprint,privatePermissionsFixture:true}));}
 catch{console.log(JSON.stringify({ready:false,error:'fixture-start-denied'}));process.exitCode=1;process.stdin.destroy();}
});
process.stdin.on('end',async()=>{try{await app?.close();console.log(JSON.stringify({closed:true}));}catch{console.error('fixture-cleanup-unconfirmed');process.exitCode=1;}});
