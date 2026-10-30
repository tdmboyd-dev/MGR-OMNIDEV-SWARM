import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {fixture,environment} from './trilogy-fixture.mjs';

// Real Git objects and SQLite; only the GitHub HTTP boundary is simulated.
// The fixture never accesses the network, owner credentials or a live worker.
const originalFetch=globalThis.fetch;
const roots=new Set();
export function cleanupPublicationFixtures(){globalThis.fetch=originalFetch;for(const root of roots)rmSync(root,{recursive:true,force:true});roots.clear();}
export async function publicationFixture(options={}){
 const root=mkdtempSync(join(tmpdir(),'omni-publish-git-'));roots.add(root);
 const git=(args,input,extra={})=>execFileSync('git',['-C',root,...args],{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],maxBuffer:4_000_000,env:{...process.env,...extra}}).trimEnd();
 git(['init','--quiet','--initial-branch=main']);git(['config','user.name','Fixture Owner']);git(['config','user.email','fixture@example.invalid']);
 mkdirSync(join(root,'src'));writeFileSync(join(root,'src/value.mjs'),'export const value=1;\n');writeFileSync(join(root,'untouched.txt'),'# Untouched committed file\n');git(['add','.']);
 if(options.specialTree){
  mkdirSync(join(root,'a'));writeFileSync(join(root,'a','nested.mjs'),'export const nested=true;\n');writeFileSync(join(root,'a.c'),'// adjacent file\n');writeFileSync(join(root,'a-'),'// earlier byte ordering\n');git(['add','.']);
  git(['update-index','--chmod=+x','src/value.mjs']);const link=git(['hash-object','-w','--stdin'],'untouched.txt');git(['update-index','--add','--cacheinfo','120000',link,'readme-link']);
 }
 const fixed={GIT_AUTHOR_DATE:'2026-01-02T03:04:05Z',GIT_COMMITTER_DATE:'2026-01-02T03:04:05Z'};
 git(['commit','--quiet','-m','fixture base'],undefined,fixed);const base=git(['rev-parse','HEAD']);
 let nextIndex=0;
 function makeTree(baseTree,changes){
  const index={GIT_INDEX_FILE:join(root,'.git','temporary-index-'+nextIndex++)};git(['read-tree',baseTree],undefined,index);
  for(const change of changes){
   if(change.sha===null){git(['update-index','--force-remove','--',change.path],undefined,index);continue;}
   const blob=change.sha||git(['hash-object','-w','--stdin'],change.content);
   git(['update-index','--add','--cacheinfo',change.mode||'100644',blob,change.path],undefined,index);
  }
  return git(['write-tree'],undefined,index);
 }
 const f=await fixture({baseCommit:base,sourceRef:'main',candidateCommit:({job})=>{
  const changes=job.result.candidate.patches.map(p=>({path:p.path,content:p.after}));if(options.extraCandidateChange)changes.push({path:'untouched.txt',content:'# Unapproved alteration\n'});
  const tree=makeTree(git(['rev-parse',base+'^{tree}']),changes);
  const date=git(['show','-s','--format=%ct',base])+' +0000';
  return git(['commit-tree',tree,'-p',base,'-m','mgr: candidate evidence change'],undefined,{GIT_AUTHOR_NAME:'MGR Code Monster',GIT_AUTHOR_EMAIL:'machine@mgr.invalid',GIT_AUTHOR_DATE:date,GIT_COMMITTER_NAME:'MGR Code Monster',GIT_COMMITTER_EMAIL:'machine@mgr.invalid',GIT_COMMITTER_DATE:date});
 }});
 const refs=new Map([['main',base]]),pulls=[],calls=[];let hook=null,serial=0;
 const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
 function commitObject(sha){
  let raw;try{raw=git(['cat-file','commit',sha]);}catch{return null;}
  const [headers,...message]=raw.split('\n\n');const lines=headers.split('\n'),metadata=kind=>{
   const match=lines.find(x=>x.startsWith(kind+' '))?.match(/^[a-z]+ (.*) <([^>]+)> (\d+) ([+-]\d{4})$/);if(!match)throw Error('fixture commit format');
   return {name:match[1],email:match[2],date:new Date(Number(match[3])*1000).toISOString()};
  };
  return {sha,tree:{sha:lines.find(x=>x.startsWith('tree ')).slice(5)},parents:lines.filter(x=>x.startsWith('parent ')).map(x=>({sha:x.slice(7)})),author:metadata('author'),committer:metadata('committer'),message:message.join('\n\n')};
 }
 async function fakeFetch(input,init={}){
  const url=new URL(String(input)),method=init.method||'GET',path=url.pathname.slice(('/repos/'+f.repositoryId).length),body=init.body?JSON.parse(init.body):undefined;
  if(url.origin!=='https://api.github.com'||!url.pathname.startsWith('/repos/'+f.repositoryId))throw Error('Unexpected fixture network request');
  const call={method,path,search:url.search,body};calls.push(call);const injected=await hook?.(call);if(injected!==undefined)return injected;
  if(path===''&&method==='GET')return json({full_name:f.repositoryId,permissions:{push:true},archived:false});
  if(path.startsWith('/git/ref/heads/')&&method==='GET'){
   const name=decodeURIComponent(path.slice('/git/ref/heads/'.length)),sha=refs.get(name);return sha?json({ref:'refs/heads/'+name,object:{type:'commit',sha}}):json({message:'Not Found'},404);
  }
  if(path.startsWith('/git/commits/')&&method==='GET'){const value=commitObject(path.slice('/git/commits/'.length));return value?json(value):json({message:'Not Found'},404);}
  if(path.startsWith('/git/trees/')&&method==='GET'){
   const sha=path.slice('/git/trees/'.length);let output;try{output=git(['ls-tree','-r','-t',sha]);}catch{return json({message:'Not Found'},404);}
   return json({sha,truncated:false,tree:output.split('\n').filter(Boolean).map(line=>{const [meta,path]=line.split('\t'),[mode,type,sha]=meta.split(' ');return {path,mode,type,sha};})});
  }
  if(path.startsWith('/contents/')&&method==='GET'){
   const name=path.slice('/contents/'.length).split('/').map(decodeURIComponent).join('/'),ref=url.searchParams.get('ref');let bytes;
   try{bytes=execFileSync('git',['-C',root,'show',ref+':'+name],{stdio:['ignore','pipe','pipe'],maxBuffer:4_000_000});}catch{return json({message:'Not Found'},404);}
   return json({type:'file',path:name,sha:git(['rev-parse',ref+':'+name]),encoding:'base64',content:bytes.toString('base64')});
  }
  if(path==='/git/blobs'&&method==='POST'){const bytes=body.encoding==='base64'?Buffer.from(body.content,'base64'):body.content;return json({sha:git(['hash-object','-w','--stdin'],bytes)},201);}
  if(path==='/git/trees'&&method==='POST')return json({sha:makeTree(body.base_tree,body.tree)},201);
  if(path==='/git/commits'&&method==='POST'){
   const a=body.author,c=body.committer,args=['commit-tree',body.tree,...body.parents.flatMap(p=>['-p',p]),'-F','-'];
   const sha=git(args,body.message,{GIT_AUTHOR_NAME:a.name,GIT_AUTHOR_EMAIL:a.email,GIT_AUTHOR_DATE:a.date,GIT_COMMITTER_NAME:c.name,GIT_COMMITTER_EMAIL:c.email,GIT_COMMITTER_DATE:c.date});return json(commitObject(sha),201);
  }
  if(path==='/git/refs'&&method==='POST'){
   const name=body.ref.replace(/^refs\/heads\//,'');if(refs.has(name))return json({message:'Reference already exists'},422);
   refs.set(name,body.sha);return json({ref:body.ref,object:{type:'commit',sha:body.sha}},201);
  }
  if(path==='/pulls'&&method==='GET'){
   const head=url.searchParams.get('head')?.split(':').slice(1).join(':'),state=url.searchParams.get('state');return json(pulls.filter(p=>(!head||p.head.ref===head)&&(!state||state==='all'||p.state===state)));
  }
  if(path==='/pulls'&&method==='POST'){
   const value={number:++serial,state:'open',draft:body.draft,merged:false,html_url:'https://github.com/'+f.repositoryId+'/pull/'+serial,head:{ref:body.head,sha:refs.get(body.head),repo:{full_name:f.repositoryId}},base:{ref:body.base,sha:refs.get(body.base),repo:{full_name:f.repositoryId}}};pulls.push(value);return json(value,201);
  }
  if(path.startsWith('/pulls/')&&method==='GET'){const value=pulls.find(p=>p.number===Number(path.slice('/pulls/'.length)));return value?json(value):json({message:'Not Found'},404);}
  throw Error('Unhandled fixture GitHub call: '+method+' '+path+url.search);
 }
 globalThis.fetch=fakeFetch;
 environment.OMNI_VAULT_KEY=randomBytes(32).toString('base64');
 const repository=await import('../.test-runtime/repository.mjs');await repository.saveRepository({repository:f.repositoryId,token:'fixture-provider-'+randomBytes(20).toString('hex')});await repository.verifyRepository();
 const pending=await f.pending();if((await f.save({result:pending.result})).status!==200)throw Error('Fixture candidate stage failed');
 if(options.verified!==false){const saved=await f.save(await f.verified(pending));if(saved.status!==200)throw Error('Fixture signed result failed: '+JSON.stringify(saved));}
 calls.length=0;
 const access={ownerId:f.ownerId,projectId:f.project.id,repositoryId:f.repositoryId,role:'owner'};
 return {...f,access,root,base,refs,pulls,calls,git,makeTree,pending,json,repository,provider:fakeFetch,setHook:fn=>{hook=fn;},visibleWrites:()=>calls.filter(c=>c.method==='POST'&&['/git/refs','/pulls'].includes(c.path)),mutations:()=>calls.filter(c=>c.method!=='GET')};
}
