/**
 * Rule-based resume checks, the kind applicant tracking systems and recruiters care about.
 * No AI involved, so it works offline and gives the same answer every time.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface AtsReport {
  score: number; // 0-100
  checks: Check[];
  stats: { words: number; bullets: number; quantifiedBullets: number };
  /** Bullet lines that would benefit most from a rewrite (weak opener or no numbers). */
  weakBullets: string[];
}

const SECTIONS: Record<string, RegExp> = {
  Summary: /^\s*(professional\s+)?(summary|profile|about me|objective)\b/im,
  Experience: /^\s*(work\s+|professional\s+)?(experience|employment|work history|career history)\b/im,
  Skills: /^\s*(technical\s+|key\s+|core\s+)?(skills|competencies|tech stack|technologies)\b/im,
  Education: /^\s*(education|academic|qualifications)\b/im,
};

const WEAK_OPENERS =
  /^(responsible for|worked on|working on|helped|assisted|involved in|participated in|duties included|tasked with|handled|did|was part of)\b/i;
const STRONG_VERBS =
  /^(built|led|designed|developed|shipped|launched|created|architected|owned|delivered|reduced|cut|improved|increased|grew|automated|migrated|optimized|optimised|implemented|scaled|mentored|drove|introduced|rebuilt|refactored|integrated|streamlined|spearheaded|established|engineered|deployed|accelerated|saved|won|managed|coordinated|wrote|authored|maintained|enabled|converted|transformed|negotiated|resolved|debugged)\b/i;

/** Lines that look like resume bullets: start with a bullet symbol, or are action-y sentences under a role. */
function bulletLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^([-•*▪◦●–]|\d+[.)])\s+/.test(l))
    .map((l) => l.replace(/^([-•*▪◦●–]|\d+[.)])\s+/, '').trim())
    .filter((l) => l.split(/\s+/).length >= 4);
}

export function atsReport(resume: string, missingKeywords: string[] = []): AtsReport {
  const checks: Check[] = [];
  const words = resume.trim() ? resume.trim().split(/\s+/).length : 0;
  const bullets = bulletLines(resume);
  const quantified = bullets.filter((b) => /\d|%|₹|\$|£|€|\bx\d/i.test(b));
  const weakOpeners = bullets.filter((b) => WEAK_OPENERS.test(b));
  const strongOpeners = bullets.filter((b) => STRONG_VERBS.test(b));

  // Contact details
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resume);
  const phone = /(\+?\d[\d\s().-]{8,}\d)/.test(resume);
  const link = /(linkedin\.com|github\.com|gitlab\.com|https?:\/\/)/i.test(resume);
  const contactMissing = [!email && 'email', !phone && 'phone number', !link && 'LinkedIn or GitHub link'].filter(Boolean);
  checks.push({
    id: 'contact',
    label: 'Contact details',
    status: !email ? 'fail' : contactMissing.length ? 'warn' : 'pass',
    detail: contactMissing.length ? `Add your ${contactMissing.join(', ')}.` : 'Email, phone and a profile link are present.',
  });

  // Length
  checks.push({
    id: 'length',
    label: 'Length',
    status: words < 250 ? 'fail' : words < 350 || words > 1100 ? 'warn' : 'pass',
    detail:
      words < 250
        ? `${words} words is very short. Most strong resumes have 400–900.`
        : words > 1100
          ? `${words} words is long. Aim for two pages (about 900 words); trim older roles.`
          : words < 350
            ? `${words} words. There's room to add impact and detail.`
            : `${words} words — a good length.`,
  });

  // Sections
  const missingSections = Object.entries(SECTIONS)
    .filter(([, re]) => !re.test(resume))
    .map(([name]) => name);
  checks.push({
    id: 'sections',
    label: 'Standard sections',
    status: missingSections.length === 0 ? 'pass' : missingSections.length === 1 ? 'warn' : 'fail',
    detail: missingSections.length
      ? `Couldn't find: ${missingSections.join(', ')}. Use plain headings so ATS software can read them.`
      : 'Summary, Experience, Skills and Education headings found.',
  });

  // Quantified impact
  const ratio = bullets.length ? quantified.length / bullets.length : 0;
  checks.push({
    id: 'numbers',
    label: 'Measurable impact',
    status: bullets.length === 0 ? 'warn' : ratio >= 0.4 ? 'pass' : ratio >= 0.2 ? 'warn' : 'fail',
    detail:
      bullets.length === 0
        ? 'No bullet points found. Use "- " bullets under each role.'
        : `${quantified.length} of ${bullets.length} bullets include a number. Aim for at least 40% (users, %, time saved, scale).`,
  });

  // Action verbs
  checks.push({
    id: 'verbs',
    label: 'Strong action verbs',
    status:
      weakOpeners.length === 0 && (bullets.length === 0 || strongOpeners.length / bullets.length >= 0.5)
        ? 'pass'
        : weakOpeners.length > 2
          ? 'fail'
          : 'warn',
    detail: weakOpeners.length
      ? `${weakOpeners.length} bullet${weakOpeners.length > 1 ? 's start' : ' starts'} with weak phrases like "Responsible for" or "Worked on". Lead with what you did: Built, Led, Cut, Shipped.`
      : `${strongOpeners.length} of ${bullets.length} bullets open with a strong verb.`,
  });

  // First person
  const firstPerson = (resume.match(/\b(I|my|me)\b/g) ?? []).length;
  checks.push({
    id: 'voice',
    label: 'Resume voice',
    status: firstPerson > 3 ? 'warn' : 'pass',
    detail:
      firstPerson > 3
        ? `Found "I/my/me" ${firstPerson} times. Resumes usually drop first-person pronouns.`
        : 'No first-person pronouns overload.',
  });

  // Keywords for this job
  if (missingKeywords.length) {
    checks.push({
      id: 'keywords',
      label: 'Job keywords',
      status: missingKeywords.length > 6 ? 'fail' : 'warn',
      detail: `The job mentions ${missingKeywords.slice(0, 8).join(', ')}${missingKeywords.length > 8 ? '…' : ''} but your resume doesn't. Add the ones you genuinely have.`,
    });
  } else {
    checks.push({
      id: 'keywords',
      label: 'Job keywords',
      status: 'pass',
      detail: 'Every skill detected in the job post appears in your resume.',
    });
  }

  const points: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };
  const score = Math.round((checks.reduce((s, c) => s + points[c.status], 0) / checks.length) * 100);

  const weakBullets = [...weakOpeners, ...bullets.filter((b) => !weakOpeners.includes(b) && !/\d/.test(b))].slice(0, 6);

  return { score, checks, stats: { words, bullets: bullets.length, quantifiedBullets: quantified.length }, weakBullets };
}
