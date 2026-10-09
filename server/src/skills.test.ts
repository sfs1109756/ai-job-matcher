import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractYears, findSkills, keywordMatch } from './skills.js';

const names = (text: string) => findSkills(text).map((s) => s.name);

test('matches skills with symbols and aliases', () => {
  const found = names('Built APIs in Node.js and C# (.NET), UI in ReactJS, styled with Tailwind; C++ firmware');
  for (const s of ['Node.js', 'C#', '.NET', 'React', 'Tailwind CSS', 'C++']) assert.ok(found.includes(s), `missing ${s}`);
});

test('does not confuse React with React Native or Java with JavaScript', () => {
  assert.deepEqual(
    names('React Native developer').filter((n) => n.startsWith('React')),
    ['React Native'],
  );
  assert.ok(!names('JavaScript expert').includes('Java'));
});

test('ambiguous short names need context', () => {
  assert.ok(!names('Ready to go above and beyond').includes('Go'));
  assert.ok(names('Backend in Golang').includes('Go'));
  assert.ok(!names('Grade C student').includes('C'));
  assert.ok(names('Languages: C, Python').includes('C'));
});

test('extracts years of experience', () => {
  assert.equal(extractYears('Requires 5+ years of experience and 2 yrs in React'), 5);
  assert.equal(extractYears('No experience mentioned'), null);
});

test('keyword match scores coverage', () => {
  const m = keywordMatch('React, TypeScript, PostgreSQL', 'We need React, TypeScript, Docker and PostgreSQL');
  assert.equal(m.score, 75);
  assert.deepEqual(
    m.missing.map((s) => s.name),
    ['Docker'],
  );
});
