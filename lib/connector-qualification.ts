import {connectors} from './catalog';
const implemented=new Map<string,string>([['GitHub','oauth-and-snapshot-adapter'],['Docker','isolated-runner-code'],['Local Projects','snapshot-import'],['Local Directories','snapshot-import'],['Monorepos','snapshot-import']]);
export function connectorCapabilityInventory(){
 return connectors.map(([name,category])=>({name,category,implementation:implemented.get(name)??'catalog-only',verifiedLive:false,requiresProviderProof:true}));
}
export function assessConnectorAcceptance(name:string,proof:any){
 const info=connectorCapabilityInventory().find(x=>x.name===name);
 if(!info)return {ok:false,reason:'unknown-connector'};
 if(info.implementation==='catalog-only')return {ok:false,reason:'no-adapter-implementation'};
 if(!proof||proof.connector!==name||!proof.sourceCommit||!proof.grantedScope||!proof.providerReceipt||!proof.deniedAccessTest||!proof.revocationTest||!proof.realOperationTest)return {ok:false,reason:'provider-or-negative-test-proof-missing'};
 return {ok:false,reason:'independent-provider-evidence-review-required',claimedEvidence:proof};
}
