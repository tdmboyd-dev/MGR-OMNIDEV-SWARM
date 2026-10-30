"use client";

import {useEffect, useRef, useState} from 'react';
import {isPublicationPreview, isPublicationState, publicationDraftUrl} from '../lib/trilogy-publication-response.mjs';

export type PublicationPreview = {
  contract: string;
  jobId: string;
  projectId: string;
  repositoryId: string;
  ownerId: string;
  baseBranch: string;
  baseCommit: string;
  candidateCommit: string;
  candidateRef: string;
  summary: string;
  changedFiles: {path: string; operation: string}[];
  previewSha256: string;
};

type PublicationState = {
  authorizationId?: string;
  expiresAt?: number;
  state: string;
  revoked?: boolean;
  preview?: PublicationPreview;
  outcome?: {url: string; number: number; commit: string; draft: boolean};
};

export function TrilogyPublicationPreview({preview}: {preview: PublicationPreview}) {
  return <section className="publication-preview" aria-label="Exact version to publish">
    <h4>Review the tested version</h4>
    <p>{preview.summary}</p>
    <dl>
      <div><dt>Repository</dt><dd>{preview.repositoryId}</dd></div>
      <div><dt>Target branch</dt><dd>{preview.baseBranch}</dd></div>
      <div><dt>Tested version</dt><dd><code>{preview.candidateCommit}</code></dd></div>
      <div><dt>Original version</dt><dd><code>{preview.baseCommit}</code></dd></div>
    </dl>
    <details open><summary>{preview.changedFiles.length} changed files</summary>
      <ul>{preview.changedFiles.map(file => <li key={file.path}><code>{file.path}</code> — {file.operation === 'create' ? 'new file' : 'updated file'}</li>)}</ul>
    </details>
    <p className="scope-note">This creates a draft for review on GitHub. Approval applies only to the tested version shown here. Merging and deployment are separate actions.</p>
  </section>;
}

export function TrilogyPublication({jobId, verified, recoverable = false, onPublished}: {
  jobId: string;
  verified: boolean;
  recoverable?: boolean;
  onPublished: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [preview, setPreview] = useState<PublicationPreview | null>(null);
  const [publication, setPublication] = useState<PublicationState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const session = useRef({jobId, verified, revision: 0, mounted: true, busy: false});
  if (session.current.jobId !== jobId || session.current.verified !== verified) session.current = {jobId, verified, revision: session.current.revision + 1, mounted: true, busy: false};
  useEffect(() => {
    session.current.mounted = true;
    return () => {session.current.mounted = false; session.current.revision++;};
  }, []);
  useEffect(() => {
    setAccessKey(''); setPreview(null); setPublication(null); setError(''); setNotice(''); setOpen(false); setBusy(false);
  }, [jobId, verified]);
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [open]);

  function clear() {
    session.current.revision++;
    setAccessKey(''); setPreview(null); setPublication(null); setError(''); setNotice(''); setOpen(false);
  }
  function changeKey(value: string) {
    session.current.revision++;
    setAccessKey(value); setPreview(null); setPublication(null); setError(''); setNotice('');
  }
  async function act(action: 'load' | 'refresh' | 'approve' | 'publish' | 'revoke' | 'recover') {
    if (session.current.busy || session.current.jobId !== jobId || !session.current.mounted) return;
    if (!verified && !['load', 'recover', 'revoke'].includes(action)) {setError('Wait for signed test verification before publishing this version.'); return;}
    if (accessKey.length < 32 || accessKey.length > 512 || /\s/.test(accessKey)) {
      setError('Enter the separate owner approval key for this project.'); return;
    }
    if (action === 'approve' && (!preview || preview.jobId !== jobId || publication?.authorizationId)) return;
    if (['publish', 'revoke'].includes(action) && !publication?.authorizationId) return;
    const captured = {jobId, revision: session.current.revision};
    const current = () => session.current.mounted && session.current.jobId === captured.jobId && session.current.revision === captured.revision;
    const request = async (body?: Record<string, unknown>) => {
      const url = body ? '/api/trilogy' : '/api/trilogy?action=publication&jobId=' + encodeURIComponent(jobId);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch(url, {
          method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: controller.signal,
          headers: {'Authorization': 'Bearer ' + accessKey, ...(body ? {'Content-Type': 'application/json'} : {})},
          ...(body ? {body: JSON.stringify(body)} : {}),
        });
        const data: any = await response.json();
        if (!response.ok) throw new Error(data.error || 'The publication request could not be completed.');
        return data;
      } finally { clearTimeout(timer); }
    };
    session.current.busy = true; setBusy(true); setError(''); setNotice('');
    try {
      if (action === 'load' || action === 'refresh') {
        const saved = action === 'refresh' ? {publication: null} : await request();
        if (!current()) return;
        if (!saved || !Object.prototype.hasOwnProperty.call(saved, 'publication') || (saved.publication !== null && !isPublicationState(saved.publication, jobId))) {
          throw new Error('The saved publication response is incomplete or does not match this job. Reload before continuing.');
        }
        const status = saved.publication;
        if (status?.authorizationId) {
          setPublication(status); setPreview(status.preview || null);
          setNotice(status.state === 'published' ? 'Saved GitHub draft recovered.' : status.state === 'canceled-before-dispatch' ? 'The unstarted publication was cleared. No GitHub draft was created.' : ['publishing', 'uncertain'].includes(status.state) ? 'GitHub has not confirmed this attempt. Recover the saved attempt before starting another.' : 'Saved approval recovered.');
        } else {
          if (!verified) {setError('There is no saved publishing attempt for this job.'); return;}
          const next = await request({action: 'publicationPreview', jobId});
          if (!current()) return;
          if (!isPublicationPreview(next, jobId)) throw new Error('The publication preview is incomplete or belongs to another job.');
          setPreview(next); setPublication(null);
        }
      } else if (action === 'approve') {
        const next = await request({action: 'authorizePublication', jobId, expectedPreview: preview});
        if (!current()) return;
        if (!isPublicationState(next, jobId, null, preview) || !['authorized', 'retryable'].includes(next.state) || next.revoked || next.expiresAt <= Date.now()) {
          throw new Error('The returned approval does not match the reviewed version or is no longer active. Reload before continuing.');
        }
        setPublication(next); setPreview(next.preview); setNotice('This exact version is approved. You can now create its GitHub draft.');
      } else if (action === 'publish' || action === 'recover') {
        const next = await request(action === 'recover' ? {action: 'reconcilePublication', jobId} : {action: 'publish', jobId, authorizationId: publication!.authorizationId});
        if (!current()) return;
        if (!isPublicationState(next, jobId, publication?.authorizationId || null, preview)) {
          throw new Error('GitHub has not confirmed the exact tested draft. Reload the saved attempt before retrying.');
        }
        if (action === 'recover' && next.state === 'canceled-before-dispatch' && next.reconciliation === 'not-dispatched' && next.outcome === null) {
          setPublication(next); setAccessKey('');
          setNotice('The unstarted publication was cleared. No GitHub draft was created.');
          return;
        }
        if (next.state !== 'published') {
          throw new Error('GitHub has not confirmed the exact tested draft. Reload the saved attempt before retrying.');
        }
        setPublication({...publication!, ...next}); setNotice('The exact tested version is saved in a GitHub draft.'); setAccessKey('');
        try {await onPublished();} catch {if (current()) setNotice('The GitHub draft is saved. Refresh the job to update its display.');}
      } else {
        const next = await request({action: 'revokePublication', jobId, authorizationId: publication!.authorizationId});
        if (!current()) return;
        if (!isPublicationState(next, jobId, publication!.authorizationId, preview) || next.revoked !== true) {
          throw new Error('The server did not confirm revocation of this approval. Reload its state before continuing.');
        }
        setPublication(next);
        setAccessKey(''); setNotice('Publication approval revoked. Any draft already created remains on GitHub.');
      }
    } catch (caught) {
      if (current()) setError(caught instanceof Error ? caught.message : 'Publication could not be completed.');
    } finally {
      if (current()) {session.current.busy = false; setBusy(false);}
    }
  }

  const expired = !!publication?.expiresAt && publication.expiresAt <= now;
  const revoked = publication?.revoked === true || publication?.state === 'revoked';
  const published = publication?.state === 'published';
  const cleared = publication?.state === 'canceled-before-dispatch';
  const recovering = publication?.state === 'publishing' || publication?.state === 'uncertain';
  const canClearUnstarted = publication?.state === 'authorized' && (expired || revoked || !verified);
  const keyReady = accessKey.length >= 32 && accessKey.length <= 512 && !/\s/.test(accessKey);
  const draftUrl = publicationDraftUrl(publication, preview?.repositoryId);

  return <section className="job-move-controls trilogy-publication" aria-label="Publish the tested version">
    <h3>Publish the tested version</h3>
    {!verified && <p className="scope-note">Signed test verification must finish before this version can be approved for GitHub.</p>}
    {!open ? <button type="button" className="secondary-btn" disabled={!verified && !recoverable} onClick={() => setOpen(true)}>Review GitHub publication</button> : <>
      <p className="scope-note">Review the exact change, approve it, then create its draft.</p>
      {!published && <label className="field">Owner approval key
        <input type="password" name="trilogy-owner-key" value={accessKey} maxLength={512} autoComplete="off" spellCheck={false}
          disabled={busy} onChange={event => changeKey(event.target.value)} aria-describedby={'owner-key-help-' + jobId}/>
        <small id={'owner-key-help-' + jobId}>Use the separate key configured for this project's owner. It authorizes requests to OmniDev. This screen does not save it and clears it when you close or finish publishing.</small>
      </label>}
      {error && <p className="form-error" role="alert">{error} {publication?.authorizationId && !revoked && 'The saved approval is retained. Reload its state before retrying if the result is uncertain.'}</p>}
      {notice && <p role="status">{notice}</p>}
      {preview && <TrilogyPublicationPreview preview={preview}/>}
      {publication?.expiresAt && !published && !revoked && <p className="scope-note">{expired ? 'This approval has expired. Review the current version before approving it again.' : 'Approval expires ' + new Date(publication.expiresAt).toLocaleTimeString() + '.'}</p>}
      {revoked && <p className="scope-note">This approval is revoked. Review the current version before approving it again.</p>}
      <div className="modal-actions wrap">
        {!published && <button type="button" className="secondary-btn" disabled={busy || !keyReady} onClick={() => void act('load')}>{publication ? 'Reload saved approval' : 'Load tested version'}</button>}
        {!published && !recovering && verified && (revoked || expired || cleared) && <button type="button" className="secondary-btn" disabled={busy || !keyReady} onClick={() => void act('refresh')}>Review a new approval</button>}
        {recovering && <button type="button" className="secondary-btn" disabled={busy || !keyReady} onClick={() => void act('recover')}>Check saved GitHub draft</button>}
        {canClearUnstarted && <button type="button" className="secondary-btn" disabled={busy || !keyReady} onClick={() => void act('recover')}>Clear unstarted publication</button>}
        {preview && !publication?.authorizationId && <button type="button" className="primary-btn" disabled={busy || !keyReady} onClick={() => void act('approve')}>Approve this version</button>}
        {publication?.authorizationId && !published && !revoked && !cleared && <>
          <button type="button" className="primary-btn" disabled={busy || !keyReady || expired || !verified} onClick={() => void act('publish')}>{recovering ? 'Resume approved publication' : 'Create GitHub draft'}</button>
          <button type="button" className="secondary-btn" disabled={busy || !keyReady} onClick={() => void act('revoke')}>Revoke approval</button>
        </>}
        {draftUrl && <a className="primary-btn" href={draftUrl} target="_blank" rel="noreferrer">Open GitHub draft #{publication!.outcome!.number}</a>}
        <button type="button" className="secondary-btn" disabled={busy} onClick={clear}>Close and clear key</button>
      </div>
      {busy && <p role="status">Checking the exact version and saved authorization…</p>}
    </>}
  </section>;
}
