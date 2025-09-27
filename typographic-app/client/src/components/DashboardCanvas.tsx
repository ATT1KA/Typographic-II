import { useRef, useEffect, useState, useCallback } from 'react';
import { Settings2 } from 'lucide-react';
import { Dashboard, WidgetConfig, WIDGET_SIZES } from '../types/dashboard';

interface DashboardCanvasProps {
  dashboard: Dashboard;
  selectedWidgets: Set<string>;
  onWidgetSelect: (widgetId: string, multiSelect?: boolean) => void;
  onWidgetUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetDelete: (widgetId: string) => void;
  onWidgetDuplicate: (widgetId: string) => void;
  onWidgetConfigure: (widgetId: string) => void;
}

type ResizeHandle = 'se' | 's' | 'e';

interface DragState {
  isDragging: boolean;
  widgetId: string | null;
  mode: 'move' | 'resize' | null;
  resizeHandle?: ResizeHandle;
  pointerStart: { x: number; y: number };
  widgetStartPosition: { x: number; y: number };
  widgetStartSize: { width: number; height: number };
}

export default function DashboardCanvas({
  dashboard,
  selectedWidgets,
  onWidgetSelect,
  onWidgetUpdate,
  onWidgetDelete,
  onWidgetDuplicate,
  onWidgetConfigure
}: DashboardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    widgetId: null,
    mode: null,
    resizeHandle: undefined,
    pointerStart: { x: 0, y: 0 },
    widgetStartPosition: { x: 0, y: 0 },
    widgetStartSize: { width: 0, height: 0 }
  });
  // Grid and snapping constants
  const GRID_SIZE = dashboard.settings.gridSize || 48;

  // Snap position to grid
  const snapToGrid = useCallback((position: { x: number; y: number }) => {
    return {
      x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
    };
  }, [GRID_SIZE]);

  // Check if position is valid (within bounds, no overlap)
  const isValidPosition = useCallback((widgetId: string, position: { x: number; y: number }, size: { width: number; height: number }) => {
    const widgetRect = {
      left: position.x,
      right: position.x + size.width * GRID_SIZE,
      top: position.y,
      bottom: position.y + size.height * GRID_SIZE
    };

    // Check canvas bounds
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      const scale = 1; // Fixed zoom for now
      const canvasWidth = canvasRect.width / scale;
      const canvasHeight = canvasRect.height / scale;

      if (widgetRect.right > canvasWidth || widgetRect.bottom > canvasHeight) {
        return false;
      }
    }

    // Check overlap with other widgets
    const overlapping = dashboard.widgets.some(widget => {
      if (widget.id === widgetId) return false;

      const widgetSize = WIDGET_SIZES[widget.size];
      const otherRect = {
        left: widget.position.x,
        right: widget.position.x + widgetSize.width * GRID_SIZE,
        top: widget.position.y,
        bottom: widget.position.y + widgetSize.height * GRID_SIZE
      };

      return !(
        widgetRect.right <= otherRect.left ||
        widgetRect.left >= otherRect.right ||
        widgetRect.bottom <= otherRect.top ||
        widgetRect.top >= otherRect.bottom
      );
    });

    return !overlapping;
  }, [dashboard.widgets, GRID_SIZE]);

  // Handle mouse/touch events for widget interaction
  const handleMouseDown = useCallback((event: React.MouseEvent, widgetId: string) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    // Check if clicking on resize handle
    const handle = (event.target as HTMLElement).closest<HTMLElement>('.widget-resize-handle');
    if (handle) {
      const handleType = handle.dataset.handle as ResizeHandle;
      setDragState({
        isDragging: true,
        widgetId,
        mode: 'resize',
        resizeHandle: handleType,
        pointerStart: { x: event.clientX, y: event.clientY },
        widgetStartPosition: { x: widget.position.x, y: widget.position.y },
        widgetStartSize: { width: widget.position.width, height: widget.position.height },
        // offset retained for backwards compatibility; unused in resize/move
        offset: { x: 0, y: 0 }
      });
      return;
    }

    setDragState({
      isDragging: true,
      widgetId,
      mode: 'move',
      resizeHandle: undefined,
      pointerStart: { x: event.clientX, y: event.clientY },
      widgetStartPosition: { x: widget.position.x, y: widget.position.y },
      widgetStartSize: { width: widget.position.width, height: widget.position.height },
      offset: undefined
    });

    onWidgetSelect(widgetId, event.ctrlKey || event.metaKey);
  }, [dashboard.widgets, onWidgetSelect]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.widgetId || !dragState.mode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    if (dragState.mode === 'move') {
      const deltaX = event.clientX - dragState.pointerStart.x;
      const deltaY = event.clientY - dragState.pointerStart.y;

      const rawPosition = {
        x: dragState.widgetStartPosition.x + deltaX,
        y: dragState.widgetStartPosition.y + deltaY
      };

      const snappedPosition = snapToGrid(rawPosition);

      if (isValidPosition(dragState.widgetId, snappedPosition, dragState.widgetStartSize)) {
        onWidgetUpdate(dragState.widgetId, {
          position: {
            ...snappedPosition,
            width: dragState.widgetStartSize.width,
            height: dragState.widgetStartSize.height
          }
        });
      }
    } else if (dragState.mode === 'resize' && dragState.resizeHandle) {
      const deltaX = event.clientX - dragState.pointerStart.x;
      const deltaY = event.clientY - dragState.pointerStart.y;

      let nextWidth = dragState.widgetStartSize.width;
      let nextHeight = dragState.widgetStartSize.height;

      if (dragState.resizeHandle === 'se' || dragState.resizeHandle === 'e') {
        nextWidth = Math.max(2, dragState.widgetStartSize.width + Math.round(deltaX / GRID_SIZE));
      }
      if (dragState.resizeHandle === 'se' || dragState.resizeHandle === 's') {
        nextHeight = Math.max(2, dragState.widgetStartSize.height + Math.round(deltaY / GRID_SIZE));
      }

      if (isValidPosition(dragState.widgetId, dragState.widgetStartPosition, { width: nextWidth, height: nextHeight })) {
        onWidgetUpdate(dragState.widgetId, {
          position: {
            ...dragState.widgetStartPosition,
            width: nextWidth,
            height: nextHeight
          }
        });
      }
    }
  }, [dragState, GRID_SIZE, isValidPosition, onWidgetUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      widgetId: null,
      mode: null,
      resizeHandle: undefined,
      pointerStart: { x: 0, y: 0 },
      widgetStartPosition: { x: 0, y: 0 },
      widgetStartSize: { width: 0, height: 0 },
      offset: { x: 0, y: 0 }
    });
  }, []);

  // Add global event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Handle canvas click for deselection
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onWidgetSelect('');
    }
  }, [onWidgetSelect]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        selectedWidgets.forEach(widgetId => onWidgetDelete(widgetId));
      } else if (event.key === 'Escape') {
        onWidgetSelect('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgets, onWidgetDelete, onWidgetSelect]);

  // Render grid background
  const renderGrid = () => {
    const gridLines = [];
    const canvasRect = canvasRef.current?.getBoundingClientRect();

    if (!canvasRect) return null;

    const width = canvasRect.width;
    const height = canvasRect.height;
    const scaledGridSize = GRID_SIZE * 1; // Fixed zoom for now

    // Vertical lines
    for (let x = 0; x <= width; x += scaledGridSize) {
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="var(--control-border)"
          strokeWidth={x % (scaledGridSize * 4) === 0 ? 1 : 0.5}
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += scaledGridSize) {
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="var(--control-border)"
          strokeWidth={y % (scaledGridSize * 4) === 0 ? 1 : 0.5}
        />
      );
    }

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {gridLines}
      </svg>
    );
  };

  // Render widget
  const renderWidget = (widget: WidgetConfig) => {
    const isSelected = selectedWidgets.has(widget.id);
    const minWidth = Math.max(2, WIDGET_SIZES[widget.size].width);
    const minHeight = Math.max(2, WIDGET_SIZES[widget.size].height);

    return (
      <div
        key={widget.id}
        className={`dashboard-widget ${isSelected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          left: widget.position.x,
          top: widget.position.y,
          width: widget.position.width * GRID_SIZE,
          height: widget.position.height * GRID_SIZE,
          minWidth: minWidth * GRID_SIZE,
          minHeight: minHeight * GRID_SIZE,
          background: widget.style?.backgroundColor || 'var(--bg-elev)',
          border: `1px solid ${widget.style?.borderColor || 'var(--control-border)'}`,
          borderRadius: widget.style?.borderRadius || 8,
          opacity: widget.style?.opacity || 1,
          cursor: dragState.isDragging ? 'grabbing' : 'grab',
          zIndex: isSelected ? 10 : 1,
          transition: dragState.isDragging ? 'none' : 'all 0.2s ease',
          boxShadow: isSelected
            ? '0 0 0 2px var(--accent), 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.1)'
        }}
        onMouseDown={(e) => handleMouseDown(e, widget.id)}
      >
        {/* Widget header */}
        <div
          className="widget-header"
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--control-border)',
            background: 'var(--bg-elev-2)',
            borderRadius: `${widget.style?.borderRadius || 8}px ${widget.style?.borderRadius || 8}px 0 0`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text)' }}>
            {widget.title}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className="widget-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onWidgetConfigure(widget.id);
              }}
              title="Configure"
            >
              <Settings2 size={13} />
            </button>
            <button
              className="widget-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onWidgetDuplicate(widget.id);
              }}
              title="Duplicate"
            >
              📋
            </button>
            <button
              className="widget-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onWidgetDelete(widget.id);
              }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Widget content */}
        <div
          className="widget-content"
          style={{
            padding: '12px',
            height: 'calc(100% - 40px)',
            overflow: 'hidden',
            color: widget.style?.textColor || 'var(--text)'
          }}
        >
          <WidgetContent widget={widget} />
        </div>

        {/* Resize handles */}
        <div
          className="widget-resize-handle resize-handle-se"
          data-handle="se"
          style={{
            position: 'absolute',
            right: -6,
            bottom: -6,
            width: 16,
            height: 16,
            cursor: 'nwse-resize',
            borderRadius: 4,
            background: 'rgba(108,92,231,0.85)',
            border: '1px solid rgba(255,255,255,0.35)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0d12',
            fontSize: 10,
            fontWeight: 600
          }}
        >
          ↘
        </div>
        <div
          className="widget-resize-handle resize-handle-s"
          data-handle="s"
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 22,
            height: 12,
            cursor: 'ns-resize',
            borderRadius: 999,
            background: 'rgba(108,92,231,0.75)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0d12',
            fontSize: 9,
            fontWeight: 600
          }}
        >
          ═
        </div>
        <div
          className="widget-resize-handle resize-handle-e"
          data-handle="e"
          style={{
            position: 'absolute',
            top: '50%',
            right: -6,
            transform: 'translateY(-50%)',
            width: 12,
            height: 22,
            cursor: 'ew-resize',
            borderRadius: 999,
            background: 'rgba(108,92,231,0.75)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0b0d12',
            fontSize: 9,
            fontWeight: 600
          }}
        >
          ║
        </div>
      </div>
    );
  };

  // Widget content renderer
  const WidgetContent = ({ widget }: { widget: WidgetConfig }) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)' }}>
              1,234
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Sample Metric
            </div>
          </div>
        );

      case 'chart':
        return (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
              📊 Chart Widget
            </div>
          </div>
        );

      case 'table':
        return (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
              📋 Table Widget
            </div>
          </div>
        );

      case 'text':
        return (
          <div style={{ height: '100%', padding: '8px', background: 'var(--bg-elev-2)', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
              Rich Text Content
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              This is a sample text widget. You can edit this content and format it using markdown.
            </div>
          </div>
        );

      case 'progress':
        return (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              Progress: 75%
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--bg-elev-2)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '75%',
                height: '100%',
                background: 'var(--accent)',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        );

      case 'status':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🟢</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Operational
            </div>
          </div>
        );

      case 'gauge':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Gauge: 75/100
            </div>
          </div>
        );

      case 'list':
        return (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              Sample List
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px' }}>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
            </ul>
          </div>
        );

      default:
        return (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Unknown Widget Type: {widget.type}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={canvasRef}
      className="dashboard-canvas"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: dashboard.settings.backgroundColor || 'var(--bg)',
        overflow: 'hidden',
        userSelect: dragState.isDragging ? 'none' : 'auto'
      }}
      onClick={handleCanvasClick}
    >
      {/* Grid background */}
      {renderGrid()}

      {/* Widgets */}
      {dashboard.widgets.map(renderWidget)}

      {/* Empty state */}
      {dashboard.widgets.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>No widgets yet</div>
          <div style={{ fontSize: '14px' }}>Add widgets from the sidebar to get started</div>
        </div>
      )}

      {/* Canvas info */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        background: 'var(--bg-elev)',
        border: '1px solid var(--control-border)',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        color: 'var(--muted)',
        zIndex: 100
      }}>
        {dashboard.widgets.length} widgets • Grid: {GRID_SIZE}px
      </div>
    </div>
  );
}
