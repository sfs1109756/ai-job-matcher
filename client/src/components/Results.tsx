import type { AnalyzeResponse, Skill } from '../types';
import { ScoreRing } from './ScoreRing';

function groupByCategory(skills: Skill[]) {
  const map = new Map<string, Skill[]>();
  for (const s of skills) map.set(s.category, [...(map.get(s.category) ?? []), s]);
  return [...map.entries()];
}

export function Results({ data }: { data: AnalyzeResponse }) {
  const { keywords, ai, aiError } = data;
  const yearsGap = keywords.jobYears && keywords.resumeYears !== null && keywords.resumeYears < keywords.jobYears;

  return (
    <div className="stack">
      <div className="panel">
        <div className="scores">
          {ai && <ScoreRing value={ai.fitScore} label="AI fit score" />}
          <ScoreRing value={keywords.score} label="Skill coverage" />
          <div className="score-text">
            {ai ? (
              <>
                <div className={`verdict v-${ai.fitScore >= 65 ? 'good' : ai.fitScore >= 45 ? 'mid' : 'low'}`}>{ai.verdict}</div>
                <p>{ai.summary}</p>
              </>
            ) : (
              <>
                <div className="verdict">Keyword analysis</div>
                <p className="muted">
                  {aiError ? `${aiError} Showing the rule-based skill match only.` : 'AI analysis was skipped.'}
                </p>
              </>
            )}
            <p className="small muted">
              Matched {keywords.matched.length} of {keywords.matched.length + keywords.missing.length} skills detected in the job post.
              {keywords.jobYears ? ` Job asks for ${keywords.jobYears}+ years` : ''}
              {keywords.jobYears && keywords.resumeYears !== null ? `; resume shows ${keywords.resumeYears}.` : keywords.jobYears ? '.' : ''}
              {yearsGap ? ' ⚠ Experience may be below the requirement.' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h2>✅ Skills you have</h2>
          {keywords.matched.length ? (
            groupByCategory(keywords.matched).map(([cat, skills]) => (
              <div key={cat}>
                <div className="cat">{cat}</div>
                {skills.map((s) => (
                  <span key={s.name} className="chip good">{s.name}</span>
                ))}
              </div>
            ))
          ) : (
            <p className="muted">No overlapping skills detected.</p>
          )}
        </div>
        <div className="panel">
          <h2>⚠️ Skills the job wants</h2>
          {keywords.missing.length ? (
            groupByCategory(keywords.missing).map(([cat, skills]) => (
              <div key={cat}>
                <div className="cat">{cat}</div>
                {skills.map((s) => (
                  <span key={s.name} className="chip bad">{s.name}</span>
                ))}
              </div>
            ))
          ) : (
            <p className="muted">Every detected skill is covered. Nice.</p>
          )}
          {keywords.extra.length > 0 && (
            <>
              <h3>Your other skills</h3>
              {keywords.extra.map((s) => (
                <span key={s.name} className="chip">{s.name}</span>
              ))}
            </>
          )}
        </div>
      </div>

      {ai && (
        <>
          <div className="grid2">
            <div className="panel">
              <h2>💪 Strengths for this role</h2>
              <ul className="clean">{ai.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="panel">
              <h2>🧩 Gaps and how to close them</h2>
              {ai.gaps.length ? (
                <ul className="clean gaps">
                  {ai.gaps.map((g, i) => (
                    <li key={i}>
                      <strong>{g.skill}</strong>{' '}
                      <span className={`chip ${g.importance === 'must-have' ? 'bad' : 'warn'}`}>{g.importance}</span>
                      <div className="muted small">{g.suggestion}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No significant gaps found.</p>
              )}
            </div>
          </div>
          <div className="grid2">
            <div className="panel">
              <h2>✍️ Resume tweaks for this job</h2>
              <ul className="clean">{ai.resumeTips.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="panel">
              <h2>🎤 Interview prep</h2>
              <ul className="clean">{ai.interviewQuestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
