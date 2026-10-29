import {db} from '@/db/store';
import type {RecordItem} from './catalog';

export class WorkspaceConflict extends Error {}
export type WriteGuard={sql:string;args:unknown[]};

/** Compare the same project and finding state used by planningSource at transaction admission. */
export function sourceGuard(project:RecordItem,records:RecordItem[]):WriteGuard {
  const findings=records.filter(r=>r.kind==='finding'&&r.projectId===project.id)
    .map(r=>({id:r.id,title:r.title,status:r.status,data:JSON.stringify(r.data)}));
  return {sql:`EXISTS (SELECT 1 FROM records WHERE id=? AND kind='project' AND title=? AND json(data)=json(?))
    AND (SELECT COUNT(*) FROM records WHERE kind='finding' AND project_id=?)=?
    AND NOT EXISTS (SELECT 1 FROM json_each(?) expected LEFT JOIN records actual ON actual.id=json_extract(expected.value,'$.id')
      WHERE actual.id IS NULL OR actual.kind<>'finding' OR actual.project_id<>?
      OR actual.title<>json_extract(expected.value,'$.title') OR actual.status<>json_extract(expected.value,'$.status')
      OR json(actual.data)<>json(json_extract(expected.value,'$.data')))`,
    args:[project.id,project.title,JSON.stringify(project.data),project.id,findings.length,JSON.stringify(findings),project.id]};
}

export function recordGuard(row:RecordItem):WriteGuard {
  return {sql:'EXISTS (SELECT 1 FROM records WHERE id=? AND kind=? AND title=? AND project_id=? AND status=? AND json(data)=json(?))',
    args:[row.id,row.kind,row.title,row.projectId,row.status,JSON.stringify(row.data)]};
}

export function combineGuards(...guards:WriteGuard[]):WriteGuard {
  return {sql:guards.map(g=>'('+g.sql+')').join(' AND ')||'1=1',args:guards.flatMap(g=>g.args)};
}

export function guardedInsert(row:RecordItem,guard:WriteGuard,ignore=false){
  return db().prepare((ignore?'INSERT OR IGNORE':'INSERT')+' INTO records(id,kind,title,project_id,status,data,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE '+guard.sql)
    .bind(row.id,row.kind,row.title,row.projectId,row.status,JSON.stringify(row.data),row.createdAt,row.updatedAt,...guard.args);
}

/** All mutations and their audit records share one D1 batch transaction. A zero-row admission makes every later write a no-op. */
export async function admittedWrite(guard:WriteGuard,operations:(admitted:WriteGuard)=>D1PreparedStatement[]) {
  const id='workspace-admission:'+crypto.randomUUID(),token=crypto.randomUUID();
  const admitted={sql:'EXISTS (SELECT 1 FROM runtime_settings WHERE id=? AND data=?)',args:[id,token]};
  const mutations=operations(admitted);
  if(mutations.length>498)throw new Error('This change exceeds the transactional workspace limit');
  const result=await db().batch([
    db().prepare('INSERT INTO runtime_settings(id,data,updated_at) SELECT ?,?,? WHERE '+guard.sql)
      .bind(id,token,new Date().toISOString(),...guard.args),
    ...mutations,
    db().prepare('DELETE FROM runtime_settings WHERE id=? AND data=?').bind(id,token)
  ]);
  if(!result[0].meta.changes)throw new WorkspaceConflict('Project, findings or record changed; reload before saving');
  return result.slice(1,-1);
}
