import { useState } from 'inferno';
import Inferno from 'inferno';

export default function Onboarding() {
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('Policy');

  function save() {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('domain', domain);
    alert('Saved. Use Explorer to start.');
  }

  return (
    <div className="card">
      <h2>Welcome to Typographic</h2>
      <p>Minimal onboarding: store your API key and preferred domain.</p>
      <div style={{display:'grid', gap:8}}>
        <input placeholder="API Key (optional)" value={apiKey} onChange={(e)=>setApiKey(e.target.value)} />
        <select value={domain} onChange={(e)=>setDomain(e.target.value)}>
          <option>Policy</option>
          <option>BI</option>
          <option>OSINT</option>
          <option>SCI</option>
          <option>Funding</option>
        </select>
        <button className="primary" onClick={save}>Save</button>
      </div>
    </div>
  );
}
