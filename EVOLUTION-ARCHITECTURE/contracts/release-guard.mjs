// Reference design guard; not the production release controller.
export function evaluatePromotion(c) {
 const reasons=[];
 for(const field of ['currentPolicy','currentRights','independentEvaluation','hardConstraintsPass','scopeAuthorized','rollbackAvailable']) if(c[field]!==true)reasons.push(field);
 if(!c.baselineHash||c.baselineHash!==c.evaluatedBaselineHash)reasons.push('baselineMismatch');
 if(!Number.isFinite(c.cost)||!Number.isFinite(c.budget)||c.cost<0||c.budget<0||c.cost>c.budget)reasons.push('budget');
 if(c.evidenceType!=='observed'&&c.releaseScope!=='sandbox')reasons.push('syntheticEvidence');
 if(c.candidateIdentity===c.evaluatorIdentity||!c.evaluatorIdentity)reasons.push('evaluatorIdentity');
 if(c.fence!==c.currentFence||c.cancelGeneration!==c.currentCancelGeneration)reasons.push('staleAuthority');
 if(c.requestedPermissions.some(p=>!c.allowedPermissions.includes(p)))reasons.push('permissionExpansion');
 return {allowed:reasons.length===0,reasons};
}
export function canPropagate(record,target){return record.rightsCurrent===true && record.withdrawn!==true && (record.tenant===target || record.globalConsent===true&&record.privacyReviewed===true);}
export function validLineage(nodes){const visiting=new Set(),done=new Set();function visit(id){if(visiting.has(id))return false;if(done.has(id))return true;const n=nodes.find(n=>n.id===id);if(!n)return false;visiting.add(id);for(const parent of n.parents)if(!visit(parent))return false;visiting.delete(id);done.add(id);return true;}return nodes.every(n=>visit(n.id));}
