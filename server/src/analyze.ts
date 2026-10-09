import { chatJSON, chatStream } from './llm.js';
import type { KeywordMatch } from './skills.js';

export interface Gap {
  skill: string;
  importance: 'must-have' | 'nice-to-have';
  suggestion: string;
}

export interface AiAnalysis {
  fitScore: number;
  verdict: string;
  summary: string;
  strengths: string[];
  gaps: Gap[];
  resumeTips: string[];
  interviewQuestions: string[];
}

const ANALYSIS_SYSTEM = `You are a senior technical recruiter and hiring manager.
Compare a candidate's resume against a job description honestly and specifically.
Rules:
- Only credit experience that the resume actually shows. Never invent facts.
- Be concrete: name technologies, years, domains and responsibilities.
- "gaps" are requirements in the job that the resume does not clearly demonstrate.
- "suggestion" says how the candidate can close or address the gap (learn X, highlight Y, reword Z).
- "resumeTips" are specific edits to the resume for THIS job (max 5).
- "interviewQuestions" are likely questions this candidate should prepare for (max 5).

Return JSON exactly in this shape:
{
  "fitScore": number from 0 to 100,
  "verdict": "Strong match" | "Good match" | "Partial match" | "Weak match",
  "summary": "2-3 sentences",
  "strengths": ["..."],
  "gaps": [{"skill": "...", "importance": "must-have" | "nice-to-have", "suggestion": "..."}],
  "resumeTips": ["..."],
  "interviewQuestions": ["..."]
}`;

export async function analyzeWithAI(resume: string, job: string, keywords: KeywordMatch): Promise<AiAnalysis> {
  const hint = `Automated keyword scan (for reference, may miss synonyms):
- Job skills found in resume: ${keywords.matched.map((s) => s.name).join(', ') || 'none'}
- Job skills NOT found in resume: ${keywords.missing.map((s) => s.name).join(', ') || 'none'}
- Years required (detected): ${keywords.jobYears ?? 'unknown'}; years in resume (detected): ${keywords.resumeYears ?? 'unknown'}`;

  const raw = await chatJSON<Partial<AiAnalysis>>([
    { role: 'system', content: ANALYSIS_SYSTEM },
    { role: 'user', content: `JOB DESCRIPTION:\n${job}\n\nRESUME:\n${resume}\n\n${hint}` },
  ]);
  return normalize(raw);
}

function strArr(v: unknown, max = 8): string[] {
  return Array.isArray(v)
    ? v
        .filter((x) => typeof x === 'string' && x.trim())
        .map((x) => x.trim())
        .slice(0, max)
    : [];
}

function normalize(raw: Partial<AiAnalysis>): AiAnalysis {
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.fitScore) || 0)));
  const gaps: Gap[] = Array.isArray(raw.gaps)
    ? raw.gaps
        .filter((g): g is Gap => Boolean(g && typeof g === 'object' && typeof (g as Gap).skill === 'string'))
        .map((g): Gap => ({
          skill: g.skill.trim(),
          importance: g.importance === 'nice-to-have' ? 'nice-to-have' : 'must-have',
          suggestion: typeof g.suggestion === 'string' ? g.suggestion.trim() : '',
        }))
        .slice(0, 10)
    : [];
  return {
    fitScore: score,
    verdict:
      typeof raw.verdict === 'string' && raw.verdict.trim()
        ? raw.verdict.trim()
        : score >= 80
          ? 'Strong match'
          : score >= 65
            ? 'Good match'
            : score >= 45
              ? 'Partial match'
              : 'Weak match',
    summary: typeof raw.summary === 'string' ? raw.summary.trim() : '',
    strengths: strArr(raw.strengths),
    gaps,
    resumeTips: strArr(raw.resumeTips, 5),
    interviewQuestions: strArr(raw.interviewQuestions, 5),
  };
}

export type Tone = 'professional' | 'enthusiastic' | 'concise';

const TONES: Record<Tone, string> = {
  professional: 'confident, warm and professional',
  enthusiastic: 'energetic and genuinely excited about the role, but not over the top',
  concise: 'direct and brief — around 150 words, no fluff',
};

export async function writeCoverLetter(
  resume: string,
  job: string,
  tone: Tone,
  extra: { candidateName?: string; company?: string; notes?: string } = {},
  onToken: (text: string) => void = () => {},
  signal?: AbortSignal,
): Promise<string> {
  const system = `You write tailored cover letters for software engineers.
Rules:
- Use ONLY facts from the resume. Never invent employers, numbers, degrees or skills.
- Open with a specific hook about the role/company, not "I am writing to apply".
- Connect 2-3 of the candidate's most relevant achievements to the job's top requirements.
- If the resume lacks a requirement, don't claim it; you may express eagerness to grow into it.
- Tone: ${TONES[tone] ?? TONES.professional}.
- Under 300 words. Plain text with paragraphs. Start with "Dear Hiring Manager," unless a name is known.
- End with a short sign-off and the candidate's name if it appears in the resume.
Return only the letter.`;

  const notes = [
    extra.candidateName && `Candidate name: ${extra.candidateName}`,
    extra.company && `Company: ${extra.company}`,
    extra.notes && `Extra notes from the candidate: ${extra.notes}`,
  ]
    .filter(Boolean)
    .join('\n');

  const letter = await chatStream(
    [
      { role: 'system', content: system },
      { role: 'user', content: `JOB DESCRIPTION:\n${job}\n\nRESUME:\n${resume}${notes ? `\n\n${notes}` : ''}` },
    ],
    onToken,
    { temperature: 0.6, maxTokens: 900, signal },
  );
  return letter.replace(/^```\w*\n?|```$/g, '').trim();
}

export interface BulletRewrite {
  rewrites: string[];
  tip: string;
}

/** Rewrites one resume bullet three ways, without inventing facts. */
export async function rewriteBullet(bullet: string, job: string): Promise<BulletRewrite> {
  const raw = await chatJSON<Partial<BulletRewrite>>(
    [
      {
        role: 'system',
        content: `You improve a single resume bullet for a software engineer.
Rules:
- Start with a strong past-tense action verb (Built, Led, Cut, Shipped...).
- Show impact: what changed, for whom, how much. Keep every fact and number from the original.
- NEVER invent numbers, tools or results. If a number would help but isn't given, insert a placeholder like [X%] or [N users] for the candidate to fill in.
- One line each, under 30 words. No first person.
- If a job description is given, use its wording where it truthfully fits.
Return JSON: {"rewrites": ["...", "...", "..."], "tip": "one short sentence of advice"}`,
      },
      { role: 'user', content: `Bullet: ${bullet}${job ? `\n\nJob description (for wording):\n${job.slice(0, 3000)}` : ''}` },
    ],
    { temperature: 0.5 },
  );
  const rewrites = Array.isArray(raw.rewrites)
    ? raw.rewrites
        .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
        .map((r) => r.trim().replace(/^[-•*]\s*/, ''))
        .slice(0, 3)
    : [];
  if (rewrites.length === 0) throw new Error('The model did not return any rewrites. Try again.');
  return { rewrites, tip: typeof raw.tip === 'string' ? raw.tip.trim() : '' };
}
