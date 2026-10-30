// UI validation only. The server remains authoritative for signatures,
// permission, current source and every GitHub write.
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const text=value=>typeof value==='string'&&value.length>0;
const sha=/^[a-f0-9]{40}$/;
const digest=/^[a-f0-9]{64}$/;
const repository=/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/;
const states=new Set(['authorized','publishing','uncertain','retryable','published','canceled-before-dispatch']);
function samePreview(actual,expected){
  if(!object(actual)||!object(expected))return false;
  const keys=Object.keys(expected);
  return keys.length===Object.keys(actual).length&&keys.every(key=>key==='changedFiles'
    ?Array.isArray(actual[key])&&Array.isArray(expected[key])&&actual[key].length===expected[key].length&&actual[key].every((file,index)=>file.path===expected[key][index].path&&file.operation===expected[key][index].operation)
    :actual[key]===expected[key]);
}
export function isPublicationPreview(value,jobId){
  if(!object(value)||value.contract!=='mgr.trilogy.publication-preview.v1'||!text(jobId)||value.jobId!==jobId)return false;
  if(!['projectId','ownerId','baseBranch','candidateRef'].every(key=>text(value[key]))||!value.candidateRef.startsWith('refs/heads/'))return false;
  if(typeof value.repositoryId!=='string'||!repository.test(value.repositoryId)||typeof value.baseCommit!=='string'||!sha.test(value.baseCommit)||typeof value.candidateCommit!=='string'||!sha.test(value.candidateCommit)||typeof value.previewSha256!=='string'||!digest.test(value.previewSha256)||value.baseCommit===value.candidateCommit)return false;
  if(typeof value.summary!=='string'||!Array.isArray(value.changedFiles)||!value.changedFiles.length||value.changedFiles.length>50)return false;
  const paths=new Set();
  return value.changedFiles.every(file=>{
    if(!object(file)||!text(file.path)||!['create','update'].includes(file.operation)||paths.has(file.path))return false;
    paths.add(file.path);return true;
  });
}
export function publicationDraftUrl(value,repositoryId){
  if(!object(value)||value.state!=='published'||typeof repositoryId!=='string'||!repository.test(repositoryId))return null;
  const preview=value.preview,outcome=value.outcome;
  if(!isPublicationPreview(preview,preview?.jobId)||preview.repositoryId.toLowerCase()!==repositoryId.toLowerCase()||!object(outcome)||outcome.draft!==true||outcome.commit!==preview.candidateCommit||!Number.isSafeInteger(outcome.number)||outcome.number<1||typeof outcome.url!=='string')return null;
  const expected='https://github.com/'+repositoryId+'/pull/'+outcome.number;
  return outcome.url.toLowerCase()===expected.toLowerCase()?expected:null;
}
/**
 * @param {*} value
 * @param {string} jobId
 * @param {string | null} [authorizationId]
 * @param {*} [expectedPreview]
 * @returns {boolean}
 */
export function isPublicationState(value,jobId,authorizationId=null,expectedPreview=null){
  if(!object(value)||!text(value.authorizationId)||!Number.isSafeInteger(value.expiresAt)||value.expiresAt<=0||typeof value.revoked!=='boolean'||!states.has(value.state)||!isPublicationPreview(value.preview,jobId))return false;
  if(authorizationId!==null&&value.authorizationId!==authorizationId||expectedPreview!==null&&(!isPublicationPreview(expectedPreview,jobId)||!samePreview(value.preview,expectedPreview)))return false;
  return value.state==='published'?publicationDraftUrl(value,value.preview.repositoryId)!==null:value.outcome==null;
}
