import type { AtsReport } from '../types';
import { ScoreRing } from './ScoreRing';

const ICON = { pass: '✓', warn: '!', fail: '✕' } as const;

/** Rule-based resume health checks (works without AI). */
export function AtsCard({ ats }: { ats: AtsReport }) {
  return (
    <div className="panel">
      <h2>📋 Resume health check</h2>
      <div className="ats">
        <ScoreRing value={ats.score} label="Resume score" size={96} />
        <ul className="checks">
          {ats.checks.map((c) => (
            <li key={c.id} className={c.status}>
              <span className="check-icon" aria-label={c.status}>
                {ICON[c.status]}
              </span>
              <div>
                <strong>{c.label}</strong>
                <div className="small muted">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        Rule-based checks, no AI: {ats.stats.words} words, {ats.stats.bullets} bullets, {ats.stats.quantifiedBullets} with numbers.
      </p>
    </div>
  );
}
