import './env.js';
import multer from 'multer';
import { analyzeWithAI, writeCoverLetter, type Tone } from './analyze.js';
import { extractFileText } from './extract.js';
import { HttpError, asyncRoute, clip, createApp, finishApp } from './http.js';
import { LLMUnavailableError } from './llm.js';
import { keywordMatch } from './skills.js';

const app = createApp();
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
  asyncRoute(async (req, res) => {
    const resume = clip(req.body?.resume);
    const job = clip(req.body?.job);
    if (resume.length < 50) throw new HttpError(400, 'Please add your resume (at least a few lines).');
    if (job.length < 50) throw new HttpError(400, 'Please add the job description (at least a few lines).');

    const keywords = keywordMatch(resume, job);
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
    res.json({ keywords, ai, aiError });
  }),
);

app.post(
  '/api/cover-letter',
  asyncRoute(async (req, res) => {
    const resume = clip(req.body?.resume);
    const job = clip(req.body?.job);
    if (!resume || !job) throw new HttpError(400, 'Resume and job description are both required.');
    const tone: Tone = ['professional', 'enthusiastic', 'concise'].includes(req.body?.tone) ? req.body.tone : 'professional';
    const letter = await writeCoverLetter(resume, job, tone, {
      company: clip(req.body?.company, 200),
      notes: clip(req.body?.notes, 1000),
    });
    res.json({ letter });
  }),
);

finishApp(app);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`AI Job Matcher API on http://localhost:${port}`));
