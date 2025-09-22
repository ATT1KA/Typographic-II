import { useEffect, useState } from 'inferno';
import Inferno from 'inferno';

export default function Explorer() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!q) { setResults([]); return; }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setResults(json.results || []);
      } catch (e: any) {
        setError(e?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <div>
      <div style={{display:'flex',gap:8, marginBottom:12}}>
        <input placeholder="Search (e.g., Impact of tariffs on lithium)" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1}} />
        <button className="primary" onClick={()=>setQ(q)}>Search</button>
      </div>
      {loading && <div>Searching…</div>}
      {error && <div style={{color:'tomato'}}>{error}</div>}
      <div className="grid">
        {results.map((r) => (
          <div className="card" key={r.id}>
            <div style={{fontSize:12, color:'#9CA3AF'}}>{r.domain}</div>
            <div style={{fontWeight:700}}>{r.title}</div>
            <div style={{fontSize:14, margin:'6px 0'}}>{r.summary}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {r.parameters?.map((p: any, i: number) => (
                <span key={i} style={{background:'#0e0e0e',border:'1px solid #2a2a2a',padding:'4px 6px',borderRadius:6,fontSize:12}}>
                  {p.key}: {p.value}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
