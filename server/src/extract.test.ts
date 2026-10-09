import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { extractFileText } from './extract.js';

const fixtures = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../test/fixtures');

for (const [file, mime] of [
  ['resume.pdf', 'application/pdf'],
  ['resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
]) {
  test(`extracts text from ${file}`, async () => {
    const text = await extractFileText(fs.readFileSync(path.join(fixtures, file)), file, mime);
    assert.match(text, /Priya Nair/);
    assert.match(text, /React Native, TypeScript, Node\.js, Docker/);
  });
}

test('rejects legacy .doc and unknown types with a helpful message', async () => {
  await assert.rejects(extractFileText(Buffer.from('x'), 'cv.doc', 'application/msword'), /\.docx or PDF/);
  await assert.rejects(extractFileText(Buffer.from('x'), 'cv.png', 'image/png'), /Unsupported file type/);
});
