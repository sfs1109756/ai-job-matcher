import mammoth from 'mammoth';
import { extractText, getDocumentProxy } from 'unpdf';

/** Pulls plain text out of an uploaded PDF, Word (.docx), TXT or MD file. */
export async function extractFileText(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (mimetype === 'application/pdf' || lower.endsWith('.pdf')) {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return tidy(text);
  }
  if (lower.endsWith('.docx') || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return tidy(value);
  }
  if (lower.endsWith('.doc')) throw new Error('Old .doc files are not supported. Save it as .docx or PDF and try again.');
  if (mimetype.startsWith('text/') || /\.(txt|md|markdown)$/.test(lower)) {
    return tidy(buffer.toString('utf8'));
  }
  throw new Error('Unsupported file type. Upload a PDF, Word (.docx), TXT or MD file.');
}

function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
