import { useEffect, useState } from 'inferno';
import Inferno from 'inferno';

export default function DashboardBuilder() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [name, setName] = useState('My Dashboard');

  useEffect(() => {
    fetch('/api/dashboards').then(r=>r.json()).then(setDashboards).catch(()=>{});
  }, []);

  async function createDashboard() {
    const res = await fetch('/api/dashboards', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
    const json = await res.json();
    setDashboards((d) => [json, ...d]);
  }

  return (
    <div>
      <div className="card" style={{display:'flex',gap:8, marginBottom:12}}>
        <input value={name} onChange={(e)=>setName(e.target.value)} />
        <button className="primary" onClick={createDashboard}>Create</button>
      </div>
      <div className="grid">
        {dashboards.map((d) => (
          <div className="card" key={d.id}>
            <div style={{fontWeight:700}}>{d.name}</div>
            <div style={{fontSize:12,color:'#9CA3AF'}}>Widgets: auto-inferred from workflow nodes</div>
          </div>
        ))}
      </div>
    </div>
  );
}
