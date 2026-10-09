import assert from 'node:assert/strict';
import { test } from 'node:test';
import { atsReport } from './ats.js';

const strong = `Jane Doe
jane@example.com · +91 98765 43210 · linkedin.com/in/janedoe

SUMMARY
Frontend engineer focused on fast, accessible dashboards.

EXPERIENCE
Senior Engineer — Acme (2020–present)
- Built a React dashboard used by 5,000 customers, cutting support tickets by 30%
- Led a migration to TypeScript across 120k lines with zero downtime
- Reduced bundle size by 40% with code-splitting and lazy loading
- Mentored 4 engineers through their first production releases

SKILLS
React, TypeScript, Node.js, PostgreSQL

EDUCATION
B.Sc. Computer Science, 2018
${'Additional detail about projects and impact. '.repeat(40)}`;

const weak = `John
EXPERIENCE
- Responsible for the frontend of the website
- Worked on bug fixes and helped the team
- Involved in meetings with clients every week
I think my skills are good and I like my work and my team.`;

const byId = (r: ReturnType<typeof atsReport>) => Object.fromEntries(r.checks.map((c) => [c.id, c.status]));

test('a solid resume passes most checks', () => {
  const r = atsReport(strong);
  const s = byId(r);
  assert.equal(s.contact, 'pass');
  assert.equal(s.sections, 'pass');
  assert.equal(s.numbers, 'pass');
  assert.equal(s.verbs, 'pass');
  assert.equal(s.keywords, 'pass');
  assert.ok(r.score >= 85, `score ${r.score}`);
});

test('a weak resume is flagged with specific problems', () => {
  const r = atsReport(weak, ['Docker', 'AWS']);
  const s = byId(r);
  assert.equal(s.contact, 'fail');
  assert.equal(s.length, 'fail');
  assert.equal(s.numbers, 'fail');
  assert.equal(s.verbs, 'fail');
  assert.equal(s.voice, 'warn');
  assert.equal(s.keywords, 'warn');
  assert.ok(r.score < 40, `score ${r.score}`);
  assert.equal(r.weakBullets[0], 'Responsible for the frontend of the website');
});
