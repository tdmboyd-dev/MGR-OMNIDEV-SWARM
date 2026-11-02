import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const encoded=v=>JSON.stringify(canonical(v));
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join(',')===keys.slice().sort().join(',');
const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export class ReviewedSourceCheckError extends Error{constructor(){super('Original reviewed source is not currently verified');this.name='ReviewedSourceCheckError';}}
/** A current read observation, never an execution grant. Both trusted parent
 * and original worker service use this same owning validator. */
export function validateReviewedSourceCheck(source,check,{startedAt,now=Date.now()}={}){
 const refuse=()=>{throw new ReviewedSourceCheckError();};
 if(!source||!hex(source.linkSha256))refuse();const {linkSha256,...body}=source;
 if(createHash('sha256').update(encoded(body)).digest('hex')!==linkSha256)refuse();
 if(!exact(check,['contract','binding','recipe','snapshotSha256','checkedAt','authorityExpiresAt','sourceCurrent','authorityCurrent','recipeCurrent','executionAuthorized','signedCandidateVerificationTransferred'])||check.contract!=='mgr.trilogy.reviewed-native-source-check.v1'||check.snapshotSha256!==source.snapshotSha256||check.sourceCurrent!==true||check.authorityCurrent!==true||check.recipeCurrent!==true||check.executionAuthorized!==false||check.signedCandidateVerificationTransferred!==false)refuse();
 if(!exact(check.binding,['requestSha256','candidateCommit','sourceDigest','ledgerHead'])||check.binding.requestSha256!==source.requestSha256||check.binding.candidateCommit!==source.candidateCommit||check.binding.sourceDigest!==source.sourceContextDigest||check.binding.ledgerHead!==source.ledgerHead||encoded(check.recipe)!==encoded(source.recipe))refuse();
 if(![startedAt,now,check.checkedAt,check.authorityExpiresAt].every(Number.isSafeInteger)||startedAt<0||now<startedAt||check.checkedAt<startedAt||check.checkedAt>now||check.authorityExpiresAt<=now)refuse();
 return JSON.parse(JSON.stringify(check));
}
