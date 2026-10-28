import {specialists} from './specialists';
import {db} from '@/db/store';
import {providerStatus} from './providers';
export const brainRoles=['coding','security','testing','research',...specialists.map(s=>s.id)];
export async function brainStatus(){
 const rows=await db().prepare("SELECT id,data FROM runtime_settings WHERE id LIKE 'brain:%'").all();
 const connections:any[]=[{id:'account',name:'ChatGPT account',kind:'account',model:'Choose locally',verification:'Local engine required'}];
 const legacy=await providerStatus();if(legacy.configured)connections.push({id:'legacy',name:legacy.provider,kind:'api',...legacy});
 for(const row of rows.results as any[]){const s=JSON.parse(row.data);connections.push({id:row.id.slice(6),name:s.name||s.provider,kind:'api',provider:s.provider,model:s.model,verifiedAt:s.verifiedAt});}
 const stored:any=await db().prepare("SELECT data FROM runtime_settings WHERE id='brain-routing'").first();
 return {connections,routing:stored?JSON.parse(stored.data):{default:'account',overrides:{}},roles:brainRoles};
}
export async function saveBrainRouting(p:any){const state=await brainStatus(),ids=new Set(state.connections.map(x=>x.id));if(!ids.has(p.default)||!p.overrides||typeof p.overrides!=='object'||Array.isArray(p.overrides))throw Error('Choose an available default brain');for(const [role,id] of Object.entries(p.overrides))if(!brainRoles.includes(role as any)||!ids.has(id))throw Error('Invalid specialist brain assignment');const routing={default:p.default,overrides:p.overrides};await db().prepare("INSERT INTO runtime_settings(id,data,updated_at) VALUES('brain-routing',?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").bind(JSON.stringify(routing),new Date().toISOString()).run();return routing;}
export async function resolveBrain(role:string){const s=await brainStatus();const id=s.routing.overrides[role]||s.routing.default;const b=s.connections.find(x=>x.id===id);if(!b)throw Error('Assigned brain was removed. Update Brains settings.');return b;}
