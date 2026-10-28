import {env} from 'cloudflare:workers';
const digest=/^[a-f0-9]{64}$/;
export type NativeWorkerPolicy={version:1;enabled:true;hostId:string;launcherSha256:string;runtimeSha256:string;qualificationDigest:string;scope:'approved-mgr-snapshot';allowedSourceDigests:string[];allowedCandidateDigests:string[];allowedTestManifestDigests:string[]};
export function nativeWorkerPolicy():NativeWorkerPolicy|null{
 const raw=env.OMNI_WINDOWS_WORKER_POLICY_JSON;if(!raw)return null;
 let p:any;try{p=JSON.parse(raw);}catch{throw Error('Native worker policy is invalid');}
 if(!p||p.scope!=='approved-mgr-snapshot'||!['allowedSourceDigests','allowedCandidateDigests','allowedTestManifestDigests'].every(k=>Array.isArray(p[k])&&p[k].length>0&&p[k].length<=32&&new Set(p[k]).size===p[k].length&&p[k].every((v:unknown)=>typeof v==='string'&&digest.test(v)))||p.version!==1||p.enabled!==true||typeof p.hostId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(p.hostId)||!['launcherSha256','runtimeSha256','qualificationDigest'].every(k=>typeof p[k]==='string'&&digest.test(p[k])))throw Error('Native worker policy is invalid');
 return {version:1,enabled:true,hostId:p.hostId,launcherSha256:p.launcherSha256,runtimeSha256:p.runtimeSha256,qualificationDigest:p.qualificationDigest,scope:p.scope,allowedSourceDigests:[...p.allowedSourceDigests],allowedCandidateDigests:[...p.allowedCandidateDigests],allowedTestManifestDigests:[...p.allowedTestManifestDigests]};
}
export const nativeCommand=Object.freeze(['node','--preserve-symlinks','--preserve-symlinks-main','--test','--test-isolation=none','tests/omni-snapshot.test.mjs']);
export function validateNativeOracle(baseline:{path:string;content:string}[],files:{path:string;content:string}[]){const path='tests/omni-snapshot.test.mjs',original=baseline.find(f=>f.path===path);if(!original||!original.content.trim()||files.find(f=>f.path===path)?.content!==original.content)throw Error('Native snapshot requires an unchanged owner-approved test oracle');}
export function nativeAssignment(id:string,scope:{sourceDigest:string;candidateDigest:string;testManifestDigest:string}){
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))throw Error('Invalid native assignment nonce');const policy=nativeWorkerPolicy();if(!policy)throw Error('Native Windows worker is not enrolled; actual host qualification required');
 if(!scope||!policy.allowedSourceDigests.includes(scope.sourceDigest)||!policy.allowedCandidateDigests.includes(scope.candidateDigest)||!policy.allowedTestManifestDigests.includes(scope.testManifestDigest))throw Error('Native source, candidate or command is outside approved snapshot scope');
 return {workerKind:'windows-appcontainer',hostId:policy.hostId,launcherSha256:policy.launcherSha256,runtimeSha256:policy.runtimeSha256,qualificationDigest:policy.qualificationDigest,profileName:'omni-'+id};
}
export function validateNativeReport(assignment:any,report:any){
 const expected=nativeAssignment(assignment.id,assignment);
 for(const key of ['workerKind','hostId','launcherSha256','runtimeSha256','qualificationDigest','profileName'] as const)if(assignment[key]!==expected[key]||report.assignment?.[key]!==assignment[key])throw Error('Native worker identity or qualification changed');
 if(report.worker!=='windows-appcontainer'||report.assignment?.expiresAt!==assignment.expiresAt||report.assignment?.profile!==assignment.profile||['launcherSha256','runtimeSha256','qualificationDigest'].some(k=>report[k]!==assignment[k]))throw Error('Native worker receipt does not match enrolled runtime');
 const n=report.native,c=report.cleanup;
 if(!n||n.profileName!==assignment.profileName||!(/^S-1-15-2-(?:[0-9]{1,10}-){6}[0-9]{1,10}$/.test(n.packageSid||'')&&n.packageSid.split('-').slice(4).every((v:string)=>Number(v)<=0xffffffff))||n.tokenIsAppContainer!==true||n.capabilityCount!==0||n.jobAssignedAtCreation!==true)throw Error('Native process boundary receipt is incomplete');
 if(!c||c.verifiedAbsent!==true||c.activeProcessesAfter!==0||c.profileDeletionHResult!==0||c.workspaceAbsent!==true)throw Error('Native worker cleanup is unverified');
 return {hostId:assignment.hostId,launcherSha256:assignment.launcherSha256,runtimeSha256:assignment.runtimeSha256,qualificationDigest:assignment.qualificationDigest,native:{profileName:n.profileName,packageSid:n.packageSid,tokenIsAppContainer:true,capabilityCount:0,jobAssignedAtCreation:true},cleanup:{verifiedAbsent:true,activeProcessesAfter:0,profileDeletionHResult:0,workspaceAbsent:true}};
}
