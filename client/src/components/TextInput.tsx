import { useState } from 'react';
import { uploadFile } from '../api';

interface Props {
  title: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

/** Textarea with PDF/TXT upload that extracts text on the server. */
export function TextInput({ title, value, onChange, placeholder }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { text } = await uploadFile<{ text: string }>('/api/extract', file);
      onChange(text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <label className="file small">
          {busy ? <span className="spinner" /> : '⇪'} Upload PDF / TXT
          <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      </div>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <div className="row small muted" style={{ justifyContent: 'space-between', marginTop: 6 }}>
        <span>{words} words</span>
        {value && (
          <button className="ghost small" onClick={() => onChange('')} style={{ padding: '2px 10px' }}>
            Clear
          </button>
        )}
      </div>
      {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
