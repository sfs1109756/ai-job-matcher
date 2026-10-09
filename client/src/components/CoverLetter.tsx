import { useState } from 'react';
import { streamPost } from '../api';

interface Props {
  resume: string;
  job: string;
  aiReady: boolean;
}

export function CoverLetter({ resume, job, aiReady }: Props) {
  const [tone, setTone] = useState('professional');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [letter, setLetter] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function generate() {
    setBusy(true);
    setError('');
    try {
      setLetter('');
      // Tokens arrive as the model writes, so the letter appears progressively.
      const done = await streamPost('/api/cover-letter', { resume, job, tone, company, notes }, setLetter);
      setLetter(done.text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([letter], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-letter${company ? `-${company.toLowerCase().replace(/\W+/g, '-')}` : ''}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="panel">
      <h2>📨 Tailored cover letter</h2>
      <div className="cl-form">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name (optional)" />
        <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone">
          <option value="professional">Professional</option>
          <option value="enthusiastic">Enthusiastic</option>
          <option value="concise">Concise</option>
        </select>
        <button onClick={generate} disabled={busy || !aiReady || !resume.trim() || !job.trim()}>
          {busy && <span className="spinner" />}
          {letter ? 'Regenerate' : 'Write cover letter'}
        </button>
      </div>
      <input
        style={{ marginTop: 8 }}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Anything to mention? e.g. 'open to relocating to Dubai', 'notice period 30 days'"
      />
      {!aiReady && <p className="small muted">Needs an AI model. Start Ollama to enable this.</p>}
      {error && (
        <div className="error" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
      {letter && (
        <>
          <textarea
            className="letter"
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={Math.max(12, Math.ceil(letter.length / 140) + letter.split('\n').length)}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="ghost" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <button className="ghost" onClick={download}>
              Download .txt
            </button>
          </div>
        </>
      )}
    </div>
  );
}
