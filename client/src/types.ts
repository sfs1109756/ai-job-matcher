export interface Skill {
  name: string;
  category: string;
}

export interface KeywordMatch {
  score: number;
  matched: Skill[];
  missing: Skill[];
  extra: Skill[];
  jobYears: number | null;
  resumeYears: number | null;
}

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

export interface AnalyzeResponse {
  keywords: KeywordMatch;
  ai: AiAnalysis | null;
  aiError: string | null;
}
