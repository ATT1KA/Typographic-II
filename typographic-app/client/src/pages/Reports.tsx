import { useState } from 'inferno';
import Inferno from 'inferno';

export default function Reports() {
  const [title, setTitle] = useState('Executive Brief');
  const [format, setFormat] = useState<'pdf' | 'html'>('html');
  const [content, setContent] = useState('Generated report body');
  const [result, setResult] = useState<any | null>(null);

  async function generate() {
    const res = await fetch('/api/reports', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, format, content }) });
    const json = await res.json();
    setResult(json);
  }

  return (
    <div className="card">
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} />
        <select value={format} onChange={(e)=>setFormat(e.target.value as any)}>
          <option value="html">HTML</option>
          <option value="pdf">PDF</option>
        </select>
        <button className="primary" onClick={generate}>Generate</button>
      </div>
      <textarea rows={6} value={content} onChange={(e)=>setContent(e.target.value)} style={{width:'100%',background:'#0e0e0e',border:'1px solid #2a2a2a',color:'white'}} />
      {result && (
        <div style={{marginTop:12}}>
          <div style={{fontWeight:700}}>Created: {result.title}</div>
          <div>ID: {result.id}</div>
          <div>Format: {result.format}</div>
        </div>
      )}
    </div>
  );
}
