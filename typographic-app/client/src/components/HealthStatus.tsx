import { useEffect, useState } from 'react';

type Health = { ok: boolean; label: string };

export default function HealthStatus() {
  const [api, setApi] = useState<Health>({ ok: false, label: 'API' });
  const [flow, setFlow] = useState<Health>({ ok: false, label: 'Flow' });

  useEffect(() => {
    let cancel = false;
    const ping = async () => {
      try {
        const apiRes = await fetch('/api-server/health');
        const apiOk = apiRes.ok;
        const flowRes = await fetch('/api/flow/default');
        const flowOk = flowRes.ok;
        if (!cancel) {
          setApi({ ok: apiOk, label: 'API' });
          setFlow({ ok: flowOk, label: 'Flow' });
        }
      } catch {
        if (!cancel) {
          setApi({ ok: false, label: 'API' });
          setFlow({ ok: false, label: 'Flow' });
        }
      }
    };
    void ping();
    const id = setInterval(ping, 5000);
    return () => { cancel = true; clearInterval(id); };
  }, []);

  const Dot = ({ ok }: { ok: boolean }) => (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: ok ? '#22c55e' : '#ef4444', marginRight: 6 }} />
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span title="API server health"><Dot ok={api.ok} />API</span>
      <span title="Flow server health"><Dot ok={flow.ok} />Flow</span>
    </div>
  );
}
