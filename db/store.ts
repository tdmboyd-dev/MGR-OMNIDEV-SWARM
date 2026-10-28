import { env } from "cloudflare:workers";
import type {RecordItem} from "@/lib/catalog";
export function db(){if(!env.DB)throw new Error("Storage unavailable");return env.DB;}
export async function list(){const r=await db().prepare("SELECT * FROM records WHERE kind NOT IN ('repo_tree','repo_file') ORDER BY created_at DESC LIMIT 10000").all();return r.results.map((r:any)=>({id:r.id,kind:r.kind,title:r.title,projectId:r.project_id,status:r.status,data:JSON.parse(r.data),createdAt:r.created_at,updatedAt:r.updated_at})) as RecordItem[];}
export function record(kind:string,title:string,data:any={},projectId="",status="active"):RecordItem{const now=new Date().toISOString();return {id:crypto.randomUUID(),kind,title,projectId,status,data,createdAt:now,updatedAt:now};}
export function insert(r:RecordItem,ignore=false){return db().prepare((ignore?"INSERT OR IGNORE":"INSERT")+" INTO records (id,kind,title,project_id,status,data,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)").bind(r.id,r.kind,r.title,r.projectId,r.status,JSON.stringify(r.data),r.createdAt,r.updatedAt);}
