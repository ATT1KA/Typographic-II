import Inferno, { useEffect, useRef, useState } from 'inferno';

export default function GraphView({ nodes = [], edges = [], onNodesChange }: { nodes?: any[]; edges?: any[]; onNodesChange?: (n: any[]) => void }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const dragging = useRef(null);
  const panning = useRef(null);
  const localNodes = useRef(nodes.slice());
  const selection = useRef(null);
  const snapToGrid = 8;
  useEffect(() => { localNodes.current = nodes.slice(); }, [nodes]);

  // Wheel to zoom
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      // zoom toward pointer
      const rect = (el as any).getBoundingClientRect();
      const cx = (e.clientX - rect.left - transform.x) / transform.k;
      const cy = (e.clientY - rect.top - transform.y) / transform.k;
      setTransform((t) => {
        const newK = Math.max(0.2, Math.min(3, t.k * factor));
        const nx = e.clientX - rect.left - cx * newK;
        const ny = e.clientY - rect.top - cy * newK;
        return { x: nx, y: ny, k: newK };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as any);
  }, []);

  // Pointer down on background -> start pan
  const onBgPointerDown = (e: any) => {
    if (e.target !== svgRef.current) return;
    panning.current = { sx: e.clientX, sy: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: any) => {
    if (dragging.current && dragging.current.id) {
      const nd = dragging.current;
      const dx = (e.clientX - (nd.startX || 0)) / transform.k;
      const dy = (e.clientY - (nd.startY || 0)) / transform.k;
      const updated = localNodes.current.map((n) => n.id === nd.id ? { ...n, position: { x: (nd.origX || 0) + dx, y: (nd.origY || 0) + dy } } : n);
      localNodes.current = updated;
      onNodesChange?.(updated);
    } else if (panning.current) {
      const { sx, sy } = panning.current;
      if (sx == null || sy == null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      panning.current = { sx: e.clientX, sy: e.clientY };
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }));
    } else if (selection.current && selection.current.active) {
      // update selection box
      const s = selection.current;
      const startX = s.x;
      const startY = s.y;
      const w = e.clientX - startX;
      const h = e.clientY - startY;
      selection.current = { active: true, x: startX, y: startY, w, h };
    }
  };

  const onPointerUp = (e: any) => {
    // finalize drag
    if (dragging.current && dragging.current.id) {
      // snap final position to grid
      const nd = dragging.current;
      const updated = localNodes.current.map((n) => {
        if (n.id !== nd.id) return n;
        const gx = Math.round(n.position.x / snapToGrid) * snapToGrid;
        const gy = Math.round(n.position.y / snapToGrid) * snapToGrid;
        return { ...n, position: { x: gx, y: gy } };
      });
      localNodes.current = updated;
      onNodesChange?.(updated);
    }
    dragging.current = null;
    if (panning.current) {
      panning.current = null;
      try { svgRef.current?.releasePointerCapture(e.pointerId); } catch {}
    }
    if (selection.current && selection.current.active) {
      // finalize selection
      selection.current = null;
    }
  };

  // start node drag
  const onNodePointerDown = (e: any, node: any) => {
    e.stopPropagation();
    // ensure we capture pointer on the svg container for consistent move/up
    try { (svgRef.current as any)?.setPointerCapture?.(e.pointerId); } catch {}
    dragging.current = { id: node.id, startX: e.clientX, startY: e.clientY, origX: node.position.x, origY: node.position.y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  // background pointer down can start panning or selection (shift)
  // Note: the svg has onPointerDown bound earlier; reuse that handler name

  return (
    <div ref={containerRef} style={{ width: '100%', height: '600px', position: 'relative', touchAction: 'none' }}>
      <svg ref={svgRef} width="100%" height="100%" onPointerDown={onBgPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} style={{ background: '#050505' }}>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* edges */}
          {edges.map((e: any, i: number) => {
            const s = localNodes.current.find((n) => n.id === e.source);
            const t = localNodes.current.find((n) => n.id === e.target);
            if (!s || !t) return null;
            return <line key={e.id || i} x1={s.position.x + (s.width || 60) / 2} y1={s.position.y + (s.height || 40) / 2} x2={t.position.x + (t.width || 60) / 2} y2={t.position.y + (t.height || 40) / 2} stroke={e.style?.stroke || '#9a9a9a'} strokeWidth={2} strokeLinecap="round" />;
          })}

          {/* nodes */}
          {localNodes.current.map((n: any) => (
            <g key={n.id} transform={`translate(${n.position.x},${n.position.y})`} onPointerDown={(ev: any) => onNodePointerDown(ev, n)} style={{ cursor: 'grab' }}>
              <rect x={0} y={0} width={n.width || 160} height={n.height || 48} rx={8} fill="#111" stroke="#2b2b2b" />
              <text x={(n.width || 160) / 2} y={(n.height || 48) / 2 + 5} fill="#fff" textAnchor="middle" style={{ fontSize: 12 }}>{String(n.data?.label || n.id)}</text>
            </g>
          ))}

          {/* selection box (rendered in screen space by overlay) */}
        </g>
      </svg>
      {selection.current && selection.current.active && (
        <div style={{ position: 'absolute', left: Math.min(selection.current.x, selection.current.x + selection.current.w) - (svgRef.current?.getBoundingClientRect().left || 0), top: Math.min(selection.current.y, selection.current.y + selection.current.h) - (svgRef.current?.getBoundingClientRect().top || 0), width: Math.abs(selection.current.w), height: Math.abs(selection.current.h), border: '1px dashed #9a9a9a', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
      )}

      <div style={{ position: 'absolute', left: 8, top: 8, color: '#fff', fontSize: 12, pointerEvents: 'none' }}>
        Nodes: {String((nodes || []).length)}, Edges: {String((edges || []).length)}
      </div>
    </div>
  );
}