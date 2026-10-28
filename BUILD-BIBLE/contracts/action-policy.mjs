// Executable specification only. Runtime integration remains AUD-02/AUD-24.
export function authorizeAction(input,now){
 const failures=[];if(!input||typeof input!=='object')return{allowed:false,failures:['missing-input']};
 const required=['tenant','project','action','candidateDigest','sourceDigest','policyVersion','currentPolicyVersion','attempt','currentAttempt','fence','currentFence','cancelGeneration','currentCancelGeneration','grantExpiresAt'];
 for(const k of required)if(input[k]===undefined||input[k]===null||input[k]==='')failures.push('missing:'+k);
 if(!Number.isFinite(now)||!Number.isFinite(input.grantExpiresAt)||input.grantExpiresAt<=now)failures.push('expired-grant');
 for(const [a,b]of[['policyVersion','currentPolicyVersion'],['attempt','currentAttempt'],['fence','currentFence'],['cancelGeneration','currentCancelGeneration']])if(input[a]!==input[b])failures.push('stale:'+a);
 if(input.scopeAuthorized!==true||input.rightsCurrent!==true)failures.push('authority');
 if(!Number.isFinite(input.reserved)||!Number.isFinite(input.maximumCost)||input.maximumCost<0||input.reserved<input.maximumCost)failures.push('budget');
 const classes=['snapshot_edit','validated_change','deployment'];if(!classes.includes(input.action))failures.push('action-class');
 if(input.action!=='snapshot_edit'){
 const e=input.evidence;
 if(!e||e.passed!==true||e.class!=='behavior'||e.tenant!==input.tenant||e.project!==input.project||!input.requiredTestManifest||!input.requiredImageDigest||e.candidateDigest!==input.candidateDigest||e.sourceDigest!==input.sourceDigest||e.attempt!==input.attempt||e.fence!==input.fence||e.testManifest!==input.requiredTestManifest||e.imageDigest!==input.requiredImageDigest||e.verifiedIdentity!==true||e.independentEvaluator!==true)failures.push('invalid-behavior-evidence');
 }
 if(input.action==='deployment'&&(input.targetGrant!==true||input.reviewDigest!==input.candidateDigest||input.recoveryPlan!==true||input.freshHealthBaseline!==true))failures.push('deployment-gates');
 return{allowed:failures.length===0,failures};
}
export function transferBudget(balance,amount){if(!Number.isSafeInteger(balance)||!Number.isSafeInteger(amount)||balance<0||amount<0||amount>balance)throw Error('invalid allocation');return{parentRemaining:balance-amount,childAllocation:amount};}
