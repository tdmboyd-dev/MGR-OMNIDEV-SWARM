import {createHash} from 'node:crypto';
// Protocol fixture only. Private-permission callback is deliberately synthetic;
// actual Windows permission and native execution acceptance run separately.
import {startLocalWorkerApi} from '../../scripts/local-worker-api.mjs';
let app,started=false,buffer='';
process.stdin.setEncoding('utf8');
process.stdin.on('data',async chunk=>{
 buffer+=chunk;if(buffer.length>20000){console.error('fixture-input-limit');process.exitCode=1;process.stdin.destroy();return;}
 const index=buffer.indexOf('\n');if(index<0||started)return;started=true;
 try{const request=JSON.parse(buffer.slice(0,index));buffer='';
 if(request.githubFixture){
  const fixtureCommit=request.githubFixture.commit??'a'.repeat(40),fixtureTree=request.githubFixture.tree??'b'.repeat(40),content=request.githubFixture.content??'export const value=1;\n',files=request.githubFixture.files??[{path:'src/value.js',content}];
  globalThis.fetch=async input=>{
   const url=String(input),base='https://api.github.com/repos/fixture/project';
   if(url===base)return Response.json({default_branch:'main'});
   if(url===base+'/commits/main')return Response.json({sha:fixtureCommit,commit:{tree:{sha:fixtureTree}}});
   if(url===base+'/git/trees/'+fixtureTree+'?recursive=1')return Response.json({tree:files.map(file=>({path:file.path,type:'blob',mode:'100644',size:Buffer.byteLength(file.content),sha:createHash('sha1').update('blob '+Buffer.byteLength(file.content)+'\0').update(file.content).digest('hex')})),truncated:false});
   for(const file of files)if(url==='https://raw.githubusercontent.com/fixture/project/'+fixtureCommit+'/'+file.path.split('/').map(encodeURIComponent).join('/'))return new Response(file.content);
   throw Error('fixture refuses any unregistered external HTTP');
  };
 }
 app=await startLocalWorkerApi(request.config,{verifyPrivateState:async()=>{if(request.rejectPrivate)throw Error('fixture-private-state-denied');}});console.log(JSON.stringify({ready:true,origin:app.origin,sourceFingerprint:app.sourceFingerprint,privatePermissionsFixture:true}));}
 catch{console.log(JSON.stringify({ready:false,error:'fixture-start-denied'}));process.exitCode=1;process.stdin.destroy();}
});
process.stdin.on('end',async()=>{try{await app?.close();console.log(JSON.stringify({closed:true}));}catch{console.error('fixture-cleanup-unconfirmed');process.exitCode=1;}});
