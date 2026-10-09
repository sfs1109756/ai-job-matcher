import './env.js';
import multer from 'multer';
import { analyzeWithAI, rewriteBullet, writeCoverLetter, type Tone } from './analyze.js';
import { atsReport } from './ats.js';
import { extractFileText } from './extract.js';
import { HttpError, asyncRoute, clip, createApp, finishApp, rateLimit } from './http.js';
import { LLMUnavailableError } from './llm.js';
import { keywordMatch } from './skills.js';
import { streamText } from './stream.js';

const app = createApp();
const aiLimit = rateLimit();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** Extract text from an uploaded resume or job description (PDF/TXT/MD). */
app.post(
  '/api/extract',
  upload.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No file uploaded.');
    try {
      const text = await extractFileText(req.file.buffer, req.file.originalname, req.file.mimetype);
      if (!text) throw new Error('No text found. Is it a scanned image PDF?');
      res.json({ text, chars: text.length });
    } catch (err) {
      throw new HttpError(400, (err as Error).message);
    }
  }),
);

/**
 * Analyze fit. The keyword match always works (no AI needed);
 * the AI analysis is added when a model is available.
 */
app.post(
  '/api/analyze',
  aiLimit,
  asyncRoute(async (req, res) => {
    const resume = clip(req.body?.resume);
    const job = clip(req.body?.job);
    if (resume.length < 50) throw new HttpError(400, 'Please add your resume (at least a few lines).');
    if (job.length < 50) throw new HttpError(400, 'Please add the job description (at least a few lines).');

    const keywords = keywordMatch(resume, job);
    const ats = atsReport(resume, keywords.missing.map((s) => s.name));
    const useAi = req.body?.useAi !== false;
    let ai = null;
    let aiError: string | null = null;
    if (useAi) {
      try {
        ai = await analyzeWithAI(resume, job, keywords);
      } catch (err) {
        aiError = err instanceof LLMUnavailableError ? err.message : `AI analysis failed: ${(err as Error).message}`;
      }
    }
    res.json({ keywords, ats, ai, aiError });
  }),
);

/** Cover letter, streamed token by token so slow local models still feel responsive. */
app.post(
  '/api/cover-letter',
  aiLimit,
  asyncRoute(async (req, res) => {
    const resume = clip(req.body?.resume);
    const job = clip(req.body?.job);
    if (!resume || !job) throw new HttpError(400, 'Resume and job description are both required.');
    const tone: Tone = ['professional', 'enthusiastic', 'concise'].includes(req.body?.tone) ? req.body.tone : 'professional';
    const extra = { company: clip(req.body?.company, 200), notes: clip(req.body?.notes, 1000) };
    await streamText(req, res, (emit, signal) => writeCoverLetter(resume, job, tone, extra, emit, signal));
  }),
);

/** Three stronger versions of one resume bullet. */
app.post(
  '/api/rewrite-bullet',
  aiLimit,
  asyncRoute(async (req, res) => {
    const bullet = clip(req.body?.bullet, 600);
    if (bullet.split(/\s+/).length < 3) throw new HttpError(400, 'Paste a full resume bullet (a few words at least).');
    res.json(await rewriteBullet(bullet, clip(req.body?.job, 4000)));
  }),
);

finishApp(app);

export default app;
