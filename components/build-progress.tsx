"use client";

import {useEffect, useState} from 'react';

function isCompleteProgressBoard(html: string): boolean {
  if (html.length > 4000000 || !/^\s*<!doctype html>/i.test(html) || !/<\/html>\s*$/i.test(html)) return false;
  const encoded = html.match(/<script id="progress-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  if (!encoded) return false;
  try {
    const data = JSON.parse(encoded);
    if (data?.schema !== 'mgr.owner-progress-view.v1' || data.derivedOnly !== true
      || !Array.isArray(data.tasks) || data.tasks.length !== 174
      || !Array.isArray(data.upgrades) || data.upgrades.length !== 28
      || data.summaries?.originalParents !== 174 || data.summaries?.acceptanceClauses !== 441
      || data.summaries?.separateUpgrades !== 28
      || ![data.sourceSnapshot?.commit, data.sourceSnapshot?.tree, data.sourceSnapshot?.publicRef]
        .every(value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value))) return false;
    const clauses = data.tasks.flatMap((task: {id?: unknown; acceptance?: unknown}) => {
      if (typeof task?.id !== 'string' || !Array.isArray(task.acceptance)) throw new Error('Incomplete task');
      return task.acceptance;
    });
    return new Set(data.tasks.map((task: {id: string}) => task.id)).size === 174
      && clauses.length === 441
      && clauses.every((clause: {id?: unknown; requirement?: unknown}) =>
        typeof clause?.id === 'string' && typeof clause.requirement === 'string' && clause.requirement.trim())
      && new Set(clauses.map((clause: {id: string}) => clause.id)).size === 441;
  } catch { return false; }
}

/** The generated board is a projection of the canonical acceptance register. */
export function BuildProgressView() {
  const [attempt, setAttempt] = useState(0);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const timeout = setTimeout(() => controller.abort(), 20000);
    setHtml(null); setError('');
    void (async () => {
      try {
        const response = await fetch('/owner-progress.html', {
          cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: controller.signal,
        });
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
          throw new Error('The saved progress board is unavailable. Try loading it again.');
        }
        const text = await response.text();
        if (!isCompleteProgressBoard(text)) {
          throw new Error('The saved progress board is incomplete. It cannot be shown as current.');
        }
        if (current) setHtml(text);
      } catch (caught) {
        if (current) setError(caught instanceof Error && caught.name !== 'AbortError'
          ? caught.message : 'The progress board took too long to load. Try again.');
      } finally { clearTimeout(timeout); }
    })();
    return () => { current = false; controller.abort(); clearTimeout(timeout); };
  }, [attempt]);

  return <section className="build-progress-view" aria-label="Build progress and remaining work">
    <div className="panel build-progress-heading">
      <div><h2>What is finished, and what is still left</h2>
        <p>Search every original requirement, see the saved proof, and read the exact next action. The board names the source version it describes.</p></div>
      <a className="secondary-btn" href="/owner-progress.html" target="_blank" rel="noreferrer">Open full progress board</a>
    </div>
    {error ? <div className="error-banner" role="alert"><p>{error}</p>
      <button type="button" className="secondary-btn" onClick={() => setAttempt(value => value + 1)}>Retry progress board</button>
    </div> : html === null ? <p role="status">Loading the saved requirements and evidence…</p>
      : <iframe className="build-progress-frame" title="MGR original requirements, proof and remaining actions"
        srcDoc={html} sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer"/>}
  </section>;
}
