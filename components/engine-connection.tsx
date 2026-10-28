"use client";
import {useEffect,useRef,useState} from 'react';
import {PlugZap,Loader2} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {companionOrigin} from '@/lib/companion-bridge';

export function EngineConnection(){
 const [status,setStatus]=useState<'unknown'|'connecting'|'connected'|'offline'>('unknown');
 const [error,setError]=useState(''),[open,setOpen]=useState(false);
 const connection=useRef<any>(null),revision=useRef(0),mounted=useRef(true),launchTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{
  mounted.current=true;
  const connected=(event:Event)=>{if(!mounted.current)return;revision.current++;connection.current=(event as CustomEvent).detail.connection;setStatus('connected');setError('');};
  const disconnected=()=>{revision.current++;connection.current=null;if(mounted.current)setStatus('offline');};
  window.addEventListener('omnidev-engine-connected',connected);window.addEventListener('omnidev-engine-disconnected',disconnected);
  if(sessionStorage.getItem('omni-engine-disconnected')!=='yes')void reconnect(true);else setStatus('offline');
  const timer=setInterval(async()=>{const owner=connection.current,attempt=revision.current;if(!owner)return;
   try{let r=await fetch(companionOrigin+'/status',{headers:{'X-Omni-Session':owner.session},signal:AbortSignal.timeout(8000)});
    if(!mounted.current||revision.current!==attempt||connection.current!==owner)return;
    if(r.status===404)r=await fetch(companionOrigin+'/state',{headers:{'X-Omni-Session':owner.session},signal:AbortSignal.timeout(8000)});
    if(!mounted.current||revision.current!==attempt||connection.current!==owner)return;
    if(!r.ok&&r.status!==409)throw new Error();setStatus('connected');
   }catch{if(mounted.current&&revision.current===attempt&&connection.current===owner){connection.current=null;setStatus('offline');}}
  },30000);
  return()=>{mounted.current=false;revision.current++;connection.current=null;clearInterval(timer);if(launchTimer.current!==null)clearTimeout(launchTimer.current);window.removeEventListener('omnidev-engine-connected',connected);window.removeEventListener('omnidev-engine-disconnected',disconnected);};
 },[]);
 async function reconnect(silent=false){
  if(!mounted.current)return;const attempt=++revision.current;const current=()=>mounted.current&&revision.current===attempt;
  sessionStorage.removeItem('omni-engine-disconnected');setStatus('connecting');setError('');
  try{
   const r=await fetch(companionOrigin+'/connect',{method:'POST',headers:{'X-Omni-Client':'omnidev-site'},signal:AbortSignal.timeout(12000)});
   const session:any=await r.json();if(!current())return;if(!r.ok)throw new Error(session.error||'Engine connection was rejected.');
   const response=await fetch(companionOrigin+'/state',{headers:{'X-Omni-Session':session.session},signal:AbortSignal.timeout(12000)});
   const view:any=await response.json();if(!current())return;if(!response.ok&&response.status!==409)throw new Error(view.error||'Unable to read engine status.');
   connection.current=session;setStatus('connected');setOpen(false);
   window.dispatchEvent(new CustomEvent('omnidev-engine-connected',{detail:{connection:session,view}}));
  }catch(e:any){if(!current())return;connection.current=null;setStatus('offline');setError(e.message==='Failed to fetch'?'OmniDev could not reach the engine on this computer. Start the installed OmniDev Engine and allow local-device access if your browser asks.':e.name==='TimeoutError'?'The local engine did not respond. Check that it is running, then reconnect.':e.message);if(!silent)setOpen(true);}
 }
 function disconnect(){revision.current++;sessionStorage.setItem('omni-engine-disconnected','yes');connection.current=null;setStatus('offline');setOpen(false);window.dispatchEvent(new CustomEvent('omnidev-engine-disconnected'));}
 function launchInstalled(){const attempt=revision.current;if(launchTimer.current!==null)clearTimeout(launchTimer.current);launchTimer.current=setTimeout(()=>{launchTimer.current=null;if(mounted.current&&revision.current===attempt)void reconnect()},2500);}
 return <><div className="engine-header-control"><span className={'engine-status '+status} role="status"><i/>{status==='connected'?'Engine connected':status==='connecting'?'Connecting…':status==='offline'?'Engine offline':'Engine not checked'}</span><button className="secondary-btn engine-reconnect" onClick={()=>status==='connected'?disconnect():reconnect()} disabled={status==='connecting'}>{status==='connecting'?<Loader2 size={15} className="spin"/>:<PlugZap size={15}/>}{status==='connected'?'Disconnect engine':'Reconnect engine'}</button></div><Dialog open={open} onOpenChange={setOpen}><DialogContent className="omni-dialog engine-dialog"><DialogHeader><DialogTitle>Connect your OmniDev Engine</DialogTitle><DialogDescription>The engine runs on this computer. Reconnecting does not generate candidates or spend model allowance.</DialogDescription></DialogHeader><p className="form-error" role="alert">{error}</p><ol><li>If already installed, start OmniDev Engine from Windows or restart Windows to launch it at sign-in.</li><li>If not installed, download and extract the installer, then run <b>INSTALL-ENGINE.cmd</b>.</li><li>Allow local-device access when your browser asks, then click Reconnect engine below.</li></ol><div className="modal-actions wrap"><a className="primary-btn" href="omnidev-engine://start" onClick={launchInstalled}>Start installed engine</a><a className="secondary-btn" href="/omnidev-engine-windows.zip" download>Download engine installer</a><button className="primary-btn" onClick={()=>reconnect()} disabled={status==='connecting'}>Reconnect engine</button></div></DialogContent></Dialog></>;
}
