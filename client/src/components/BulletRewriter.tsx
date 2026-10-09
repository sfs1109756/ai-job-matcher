import { useState } from 'react';
import { postJSON } from '../api';

interface Props {
  suggestions: string[];
  job: string;
  aiReady: boolean;
}

/** Pick (or paste) a resume bullet and get three stronger versions. */
export function BulletRewriter({ suggestions, job, aiReady }: Props) {
  const [bullet, setBullet] = useState(suggestions[0] ?? '');
  const [result, setResult] = useState<{ rewrites: string[]; tip: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(-1);

  async function rewrite() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await postJSON('/api/rewrite-bullet', { bullet, job }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(-1), 1500);
  }

  return (
    <div className="panel">
      <h2>✨ Strengthen a bullet</h2>
      {suggestions.length > 0 && (
        <>
          <p className="small muted" style={{ marginTop: 0 }}>These bullets have a weak opener or no numbers. Pick one, or paste your own.</p>
          <div className="bullet-picks">
            {suggestions.map((s) => (
              <button key={s} className={`pick ${s === bullet ? 'active' : ''}`} onClick={() => setBullet(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="row" style={{ flexWrap: 'nowrap', marginTop: 10 }}>
        <input value={bullet} onChange={(e) => setBullet(e.target.value)} placeholder="e.g. Responsible for the dashboard frontend" />
        <button onClick={rewrite} disabled={busy || !aiReady || bullet.trim().split(/\s+/).length < 3}>
          {busy ? <span className="spinner" /> : 'Rewrite'}
        </button>
      </div>
      {!aiReady && <p className="small muted">Needs an AI model.</p>}
      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
      {result && (
        <div className="rewrites">
          {result.rewrites.map((r, i) => (
            <div key={i} className="rewrite">
              <span>{highlightPlaceholders(r)}</span>
              <button className="ghost small" onClick={() => copy(r, i)}>
                {copied === i ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          ))}
          {result.tip && <p className="small muted">💡 {result.tip}</p>}
        </div>
      )}
    </div>
  );
}

/** Marks [X%]-style placeholders so it's obvious what to fill in. */
function highlightPlaceholders(text: string) {
  return text.split(/(\[[^\]]+\])/g).map((part, i) => (/^\[[^\]]+\]$/.test(part) ? <mark key={i}>{part}</mark> : part));
}
