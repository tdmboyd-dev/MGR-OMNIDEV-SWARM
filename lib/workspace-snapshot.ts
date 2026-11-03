import {portableSourcePaths,safePath} from './runtime-contract';
import type {SourceFile} from './analyzer';
export class SnapshotImportError extends Error{}
function check(value:unknown,message:string):asserts value{if(!value)throw new SnapshotImportError(message);}
function redact(s:string){return s.replace(/((?:api[_-]?key|password|secret)\s*[:=]\s*["'])[^"']+/gi,"$1[REDACTED]").replace(/(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16})/g,"[REDACTED]");}
/** Exact representation persisted by the original workspace importer. Pure
 * validation/normalization shared with trusted enrollment, never execution. */
export function importedSnapshotFiles(files:SourceFile[],sourceIdentity?:unknown):SourceFile[]{
 check(sourceIdentity===undefined||sourceIdentity==='exact-reviewed-git',"Unknown source identity mode");
 check(Array.isArray(files)&&files.length>0&&files.length<=300,"Import 1–300 files");
 check(files.every(f=>f&&safePath(f.path)&&typeof f.content==="string"&&new TextEncoder().encode(f.content).byteLength<100000),"Invalid files; each file must be text under 100 KB");
 check(portableSourcePaths(files.map(file=>file.path)),"File paths must be unique and portable");
 const imported=files.map(f=>({path:f.path,content:redact(f.content)}));
 check(sourceIdentity!=='exact-reviewed-git'||imported.every((file,index)=>file.path===files[index].path&&file.content===files[index].content),"Reviewed source would change during import; select non-sensitive exact source");
 return imported;
}
