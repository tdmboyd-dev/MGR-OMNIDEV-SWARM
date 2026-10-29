import type {RecordItem} from './catalog';

/** "All projects" is an aggregate view, never an implicit mutation target. */
export function selectedProject(records:RecordItem[], projectId:string) {
  return projectId && projectId!=='all'
    ? records.find(record=>record.kind==='project'&&record.id===projectId)
    : undefined;
}

export function scopeFindings(records:RecordItem[], projectId='all', category?:string) {
  return records.filter(record=>record.kind==='finding'
    && (projectId==='all'||record.projectId===projectId)
    && (!category||record.data.category===category));
}

export function findingSummary(findings:RecordItem[]) {
  return {
    open:findings.filter(f=>f.status==='open').length,
    critical:findings.filter(f=>f.status==='open'&&f.data.severity==='critical').length,
    resolved:findings.filter(f=>f.status==='resolved').length
  };
}
