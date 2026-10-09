import type { AnalyzeResponse } from './types';

/** Recent analyses kept in this browser only (localStorage), newest first. */
export interface HistoryItem {
  id: string;
  at: string;
  title: string;
  score: number;
  resume: string;
  job: string;
  result: AnalyzeResponse;
}

const KEY = 'ai-job-matcher:history';
const MAX = 10;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

/** First non-empty line of the job post, trimmed — usually the role title. */
export function jobTitle(job: string): string {
  const line = job.split('\n').map((l) => l.trim()).find(Boolean) ?? 'Untitled job';
  return line.length > 70 ? `${line.slice(0, 67)}…` : line;
}

export function saveToHistory(resume: string, job: string, result: AnalyzeResponse): HistoryItem[] {
  const item: HistoryItem = {
    id: String(Date.now()),
    at: new Date().toISOString(),
    title: jobTitle(job),
    score: result.ai?.fitScore ?? result.keywords.score,
    resume,
    job,
    result,
  };
  const list = [item, ...loadHistory().filter((h) => h.job !== job)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — history is a convenience only */
  }
  return list;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
