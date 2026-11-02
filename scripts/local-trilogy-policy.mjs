// Trusted startup configuration for the original owning Trilogy routes.
// Request bodies cannot configure scope, credentials, workers or publication.
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===keys.slice().sort().join(',');
const id=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,99}$/.test(value);
export function localTrilogyPolicy(config){
 if(config.trilogy===undefined)return null;
 const p=config.trilogy;
 if(config.deployment!=='owner'||!exact(p,['scope','ownerToken','bridgeToken','readToken','readJobId'])||!exact(p.scope,['ownerId','projectId','repositoryId'])||!Object.values(p.scope).every(id)||p.scope.ownerId!==config.actorId||!/^[-\w.]+\/[-\w.]+$/.test(p.scope.repositoryId)||!id(p.readJobId))throw Error('Exact owner Trilogy startup scope required');
 const tokens=[p.ownerToken,p.bridgeToken,p.readToken],other=[config.ownerToken,config.nativeWorkerToken,config.engineeringToken].filter(x=>x!==undefined);
 if(tokens.some(x=>typeof x!=='string'||x.length<32||x.length>512||/\s/.test(x))||new Set(tokens).size!==3||tokens.some(x=>other.includes(x)))throw Error('Distinct bounded Trilogy startup credentials required');
 return Object.freeze({...p,scope:Object.freeze({...p.scope})});
}
