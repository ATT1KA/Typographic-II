import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Dashboard, WidgetConfig, WIDGET_SIZES, WidgetType } from '../types/dashboard';

type DashboardCanvasProps = {
  dashboard: Dashboard;
  selectedWidgets: Set<string>;
  onWidgetSelect: (widgetId: string, multiSelect?: boolean) => void;
  onWidgetUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetDelete: (widgetId: string) => void;
  onWidgetDuplicate: (widgetId: string) => void;
  onWidgetConfigure?: (widgetId: string) => void;
  onWidgetCreate?: (widgetType: string, position: { x: number; y: number }) => void;
};

type DragState = {
  mode: 'move' | 'resize' | null;
  widgetId: string | null;
  start: { x: number; y: number };
  offset: { x: number; y: number };
};

const HANDLE_SIZE = 14;

function snapToGrid(value: number, gridSize: number) {
  return Math.round(value / gridSize) * gridSize;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default function DashboardCanvas({
  dashboard,
  selectedWidgets,
  onWidgetSelect,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetDuplicate,
  onWidgetConfigure,
  onWidgetCreate
}: DashboardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    mode: null,
    widgetId: null,
    start: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  });
  const gridSize = dashboard.settings.gridSize ?? 48;

  const widgetsById = useMemo(() => {
    return new Map(dashboard.widgets.map(widget => [widget.id, widget] as const));
  }, [dashboard.widgets]);

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onWidgetSelect('');
    }
  }, [onWidgetSelect]);

  const beginDrag = useCallback((mode: DragState['mode'], widgetId: string, event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const widget = widgetsById.get(widgetId);
    if (!widget) return;
    const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const offset = {
      x: widget.position.x - pointer.x,
      y: widget.position.y - pointer.y
    };
    setDragState({ mode, widgetId, start: pointer, offset });
    onWidgetSelect(widgetId, event.metaKey || event.ctrlKey);
  }, [widgetsById, onWidgetSelect]);

  const endDrag = useCallback(() => {
    setDragState({ mode: null, widgetId: null, start: { x: 0, y: 0 }, offset: { x: 0, y: 0 } });
  }, []);

  const handlePointerMove = useCallback((event: MouseEvent) => {
    if (!dragState.mode || !dragState.widgetId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const widget = widgetsById.get(dragState.widgetId);
    if (!widget) return;
    const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (dragState.mode === 'move') {
      const next = {
        x: snapToGrid(pointer.x + dragState.offset.x, gridSize),
        y: snapToGrid(pointer.y + dragState.offset.y, gridSize)
      };
      const maxX = Math.max(0, (canvasRef.current?.clientWidth ?? 0) - widget.position.width * gridSize);
      const maxY = Math.max(0, (canvasRef.current?.clientHeight ?? 0) - widget.position.height * gridSize);
      const clamped = {
        x: clamp(next.x, 0, maxX),
        y: clamp(next.y, 0, maxY)
      };
      onWidgetUpdate(widget.id, { position: { ...widget.position, ...clamped } });
      return;
    }

    if (dragState.mode === 'resize') {
      const deltaX = pointer.x - dragState.start.x;
      const deltaY = pointer.y - dragState.start.y;
      const nextWidth = Math.max(1, widget.position.width + Math.round(deltaX / gridSize));
      const nextHeight = Math.max(1, widget.position.height + Math.round(deltaY / gridSize));
      onWidgetUpdate(widget.id, { position: { ...widget.position, width: nextWidth, height: nextHeight } });
    }
  }, [dragState, gridSize, onWidgetUpdate, widgetsById]);

  useEffect(() => {
    if (!dragState.mode) return;
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', endDrag);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', endDrag);
    };
  }, [dragState.mode, handlePointerMove, endDrag]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        selectedWidgets.forEach(id => onWidgetDelete(id));
      }
      if (event.key === 'Escape') {
        onWidgetSelect('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgets, onWidgetDelete, onWidgetSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/json');
    try {
      const parsed = JSON.parse(payload);
      if (parsed?.type === 'dashboard-widget' && typeof parsed.widgetType === 'string') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        const position = {
          x: snapToGrid(pointer.x, gridSize),
          y: snapToGrid(pointer.y, gridSize)
        };
        onWidgetCreate?.(parsed.widgetType, position);
      }
    } catch {
      /* ignore malformed drops */
    }
  }, [gridSize, onWidgetCreate]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('application/json')) {
      event.preventDefault();
    }
  }, []);

  const renderWidget = (widget: WidgetConfig) => {
    const isSelected = selectedWidgets.has(widget.id);
    const width = widget.position.width * gridSize;
    const height = widget.position.height * gridSize;
    return (
      <article
        key={widget.id}
        className={`dashboard-widget ${isSelected ? 'selected' : ''}`}
        style={{
          left: widget.position.x,
          top: widget.position.y,
          width,
          height,
          borderRadius: widget.style?.borderRadius ?? 12,
          background: widget.style?.backgroundColor ?? 'rgba(34,34,34,0.85)',
          border: `1px solid ${widget.style?.borderColor ?? 'var(--control-border)'}`,
          color: widget.style?.textColor ?? 'var(--text)'
        }}
        onMouseDown={event => beginDrag('move', widget.id, event)}
      >
        <header className="widget-toolbar">
          <div className="widget-title">
            <strong>{widget.title}</strong>
            {widget.description ? <span>{widget.description}</span> : null}
          </div>
          <div className="widget-actions">
            <button onClick={event => { event.stopPropagation(); onWidgetDuplicate(widget.id); }} title="Duplicate widget">
              <Copy size={14} />
            </button>
            <button onClick={event => { event.stopPropagation(); onWidgetDelete(widget.id); }} title="Remove widget" className="danger">
              <Trash2 size={14} />
            </button>
            {onWidgetConfigure ? (
              <button onClick={event => { event.stopPropagation(); onWidgetConfigure(widget.id); }} title="Configure widget">
                <SlidersHorizontal size={14} />
              </button>
            ) : null}
          </div>
        </header>
        <section className="widget-body">
          <WidgetPreview widget={widget} />
        </section>
        <button
          className="widget-resize-handle"
          style={{ width: HANDLE_SIZE, height: HANDLE_SIZE }}
          title="Resize"
          onMouseDown={event => {
            event.stopPropagation();
            beginDrag('resize', widget.id, event);
          }}
        />
      </article>
    );
  };

  return (
    <div
      ref={canvasRef}
      className="dashboard-canvas-surface"
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="dashboard-canvas-grid" style={{ backgroundSize: `${gridSize}px ${gridSize}px` }} />
      {dashboard.widgets.map(renderWidget)}
      {!dashboard.widgets.length && (
        <div className="dashboard-empty-state">
          <div className="empty-icon">📊</div>
          <h3>Drop widgets to get started</h3>
          <p>Connect output nodes from the workflow builder to stream real data into your dashboard.</p>
        </div>
      )}
      <div className="dashboard-meta">
        <span>{dashboard.widgets.length} widgets</span>
        <span>Grid {gridSize}px</span>
      </div>
    </div>
  );
}

function WidgetPreview({ widget }: { widget: WidgetConfig }) {
  switch (widget.type) {
    case 'metric':
      return (
        <div className="preview-metric">
          <span className="metric-value">1,234</span>
          <span className="metric-label">Sample metric</span>
        </div>
      );
    case 'chart':
      return <div className="preview-placeholder">Chart preview</div>;
    case 'table':
      return <div className="preview-placeholder">Table preview</div>;
    case 'text':
      return (
        <div className="preview-text">
          <h4>Rich text content</h4>
          <p>Use markdown to format copy and contextual notes.</p>
        </div>
      );
    case 'progress':
      return (
        <div className="preview-progress">
          <span>Progress</span>
          <div className="progress-track">
            <div className="progress-value" style={{ width: '74%' }} />
          </div>
          <span className="progress-meta">74%</span>
        </div>
      );
    case 'status':
      return (
        <div className="preview-status">
          <span className="status-dot" />
          <div>
            <strong>Operational</strong>
            <small>All systems stable</small>
          </div>
        </div>
      );
    case 'gauge':
      return (
        <div className="preview-placeholder">Gauge preview</div>
      );
    case 'list':
      return (
        <ul className="preview-list">
          <li>Item one</li>
          <li>Item two</li>
          <li>Item three</li>
        </ul>
      );
    default:
      return <div className="preview-placeholder">Widget {widget.type}</div>;
  }
}
