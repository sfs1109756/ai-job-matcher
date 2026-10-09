import { useEffect, useRef, useState } from 'react';
import { postJSON } from './api';
import { AiNotice, AiStatus, useHealth } from './components/AiStatus';
import { AtsCard } from './components/AtsCard';
import { BulletRewriter } from './components/BulletRewriter';
import { CoverLetter } from './components/CoverLetter';
import { Results } from './components/Results';
import { TextInput } from './components/TextInput';
import { clearHistory, loadHistory, saveToHistory, type HistoryItem } from './history';
import { SAMPLE_JOB, SAMPLE_RESUME } from './samples';
import type { AnalyzeResponse } from './types';

const STORAGE_KEY = 'ai-job-matcher:resume';

export default function App() {
  const health = useHealth();
  const [resume, setResume] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [job, setJob] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Remember the resume between visits (stays in this browser only).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, resume);
    } catch {
      /* storage unavailable */
    }
  }, [resume]);

  async function analyze() {
    setBusy(true);
    setError('');
    try {
      const data = await postJSON<AnalyzeResponse>('/api/analyze', { resume, job, useAi: health?.ok !== false });
      setResult(data);
      setHistory(saveToHistory(resume, job, data));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function restore(h: HistoryItem) {
    setResume(h.resume);
    setJob(h.job);
    setResult(h.result);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function loadSample() {
    setResume(SAMPLE_RESUME);
    setJob(SAMPLE_JOB);
    setResult(null);
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>🎯 AI Job Matcher</h1>
          <p>See how your resume fits a job, what's missing, and get a tailored cover letter.</p>
        </div>
        <div className="row">
          <button className="ghost" onClick={loadSample}>
            Load sample
          </button>
          <AiStatus health={health} />
        </div>
      </header>

      <AiNotice health={health} />

      {history.length > 0 && (
        <div className="history">
          <span className="small muted">Recent:</span>
          {history.map((h) => (
            <button key={h.id} className="chip btn" onClick={() => restore(h)} title={new Date(h.at).toLocaleString()}>
              <span className={`hscore ${h.score >= 65 ? 'good' : h.score >= 45 ? 'mid' : 'low'}`}>{h.score}</span> {h.title}
            </button>
          ))}
          <button
            className="link small"
            onClick={() => {
              clearHistory();
              setHistory([]);
            }}
          >
            Clear
          </button>
        </div>
      )}

      <div className="grid2">
        <TextInput title="Your resume" value={resume} onChange={setResume} placeholder="Paste your resume, or upload a PDF…" />
        <TextInput title="Job description" value={job} onChange={setJob} placeholder="Paste the job post…" />
      </div>

      <div className="row action-bar">
        <button className="big" onClick={analyze} disabled={busy || !resume.trim() || !job.trim()}>
          {busy && <span className="spinner" />}
          {busy ? (health?.ok ? 'Analyzing with AI… (local models can take ~30s)' : 'Analyzing…') : 'Analyze match'}
        </button>
        {!health?.ok && <span className="small muted">Without AI you'll still get the skill match.</span>}
      </div>
      {error && <div className="error">{error}</div>}

      {result && (
        <div ref={resultsRef} className="stack" style={{ marginTop: 20 }}>
          <Results data={result} />
          {result.ats && (
            <div className="grid2">
              <AtsCard ats={result.ats} />
              <BulletRewriter key={resume} suggestions={result.ats.weakBullets} job={job} aiReady={Boolean(health?.ok)} />
            </div>
          )}
          <CoverLetter resume={resume} job={job} aiReady={Boolean(health?.ok)} />
        </div>
      )}

      <footer className="small muted">
        Runs on your machine. Your resume is only sent to the AI model you configure (local Ollama by default).
      </footer>
    </div>
  );
}
