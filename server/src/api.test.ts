import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';

/** End-to-end API tests: the real Express app on a random port, with a fake Ollama. */
let api = '';
let servers: http.Server[] = [];

const fakeOllama = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    if (req.url === '/api/tags') return void res.end(JSON.stringify({ models: [{ name: 'qwen2.5:7b' }] }));
    const body = JSON.parse(raw);
    const system = body.messages[0].content as string;
    if (body.stream) {
      for (const w of ['Dear ', 'Hiring ', 'Manager,']) res.write(`${JSON.stringify({ message: { content: w }, done: false })}\n`);
      return void res.end(`${JSON.stringify({ done: true })}\n`);
    }
    const content = system.includes('resume bullet')
      ? JSON.stringify({ rewrites: ['Built X', 'Led Y', 'Cut Z by [X%]'], tip: 'Lead with impact.' })
      : JSON.stringify({
          fitScore: 81,
          verdict: 'Strong match',
          summary: 'ok',
          strengths: ['a'],
          gaps: [],
          resumeTips: [],
          interviewQuestions: [],
        });
    res.end(JSON.stringify({ message: { content } }));
  });
});

const listen = (s: http.Server) =>
  new Promise<string>((r) => s.listen(0, () => r(`http://127.0.0.1:${(s.address() as AddressInfo).port}`)));

before(async () => {
  process.env.AI_RATE_LIMIT = '20';
  process.env.OLLAMA_URL = await listen(fakeOllama);
  const { default: app } = await import('./app.js');
  const server = http.createServer(app);
  api = await listen(server);
  servers = [fakeOllama, server];
});
after(() => servers.forEach((s) => s.close()));

const resume = `Alex\nalex@example.com\nEXPERIENCE\n- Built a React dashboard used by 120 sites\n- Responsible for code reviews\nSKILLS\nReact, TypeScript, Node.js`;
const job = 'We need a React and TypeScript engineer with Docker and AWS experience, 5+ years.';
const post = (path: string, body: unknown) =>
  fetch(`${api}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('health reports the configured model and sets security headers', async () => {
  process.env.LLM_PROVIDER = 'ollama';
  const res = await fetch(`${api}/api/health`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-powered-by'), null);
  assert.deepEqual(await res.json(), { provider: 'ollama', model: 'qwen2.5:7b', ok: true, message: 'Ready (running locally)' });
});

test('analyze validates input and rejects bad JSON', async () => {
  assert.equal((await post('/api/analyze', { resume: 'short', job })).status, 400);
  const bad = await fetch(`${api}/api/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error, /Invalid JSON/);
});

test('analyze returns keyword + ATS results without AI', async () => {
  process.env.LLM_PROVIDER = 'none';
  const data = await (await post('/api/analyze', { resume, job })).json();
  assert.equal(data.ai, null);
  assert.match(data.aiError, /turned off/);
  assert.deepEqual(data.keywords.missing.map((s: { name: string }) => s.name).sort(), ['AWS', 'Docker']);
  assert.ok(data.ats.checks.length >= 6);
});

test('analyze adds the AI analysis when a model is available', async () => {
  process.env.LLM_PROVIDER = 'ollama';
  const data = await (await post('/api/analyze', { resume, job })).json();
  assert.equal(data.ai.fitScore, 81);
  assert.equal(data.aiError, null);
});

test('cover letter streams NDJSON tokens, and fails cleanly without AI', async () => {
  process.env.LLM_PROVIDER = 'ollama';
  const res = await post('/api/cover-letter', { resume, job, tone: 'concise' });
  assert.match(res.headers.get('content-type') ?? '', /ndjson/);
  const events = (await res.text())
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
  assert.deepEqual(
    events.filter((e) => e.type === 'token').map((e) => e.text),
    ['Dear ', 'Hiring ', 'Manager,'],
  );
  assert.deepEqual(events.at(-1), { type: 'done', text: 'Dear Hiring Manager,' });

  process.env.LLM_PROVIDER = 'none';
  const off = await post('/api/cover-letter', { resume, job });
  assert.equal(off.status, 503);
  assert.equal((await off.json()).aiUnavailable, true);
});

test('bullet rewriter returns three rewrites', async () => {
  process.env.LLM_PROVIDER = 'ollama';
  const data = await (await post('/api/rewrite-bullet', { bullet: 'Responsible for code reviews', job })).json();
  assert.equal(data.rewrites.length, 3);
  assert.equal(data.tip, 'Lead with impact.');
});

test('unknown API routes return JSON 404', async () => {
  const res = await fetch(`${api}/api/nope`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Not found' });
});

test('AI routes are rate limited', async () => {
  process.env.LLM_PROVIDER = 'none';
  const statuses = await Promise.all(Array.from({ length: 25 }, () => post('/api/analyze', { resume, job }).then((r) => r.status)));
  assert.ok(statuses.includes(429), 'expected at least one 429');
});
