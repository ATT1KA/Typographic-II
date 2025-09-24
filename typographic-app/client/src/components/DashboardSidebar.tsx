import { useState, useMemo } from 'react';
import { Search, X, ChevronRight, ChevronDown, Zap, Database } from 'lucide-react';
import {
  Dashboard,
  WidgetCategory,
  getWidgetsByCategory,
  WIDGET_CATEGORIES,
  WidgetType,
  WidgetLibraryItem
} from '../types/dashboard';

type WidgetLibraryByCategory = Record<string, WidgetLibraryItem[]>;

type WorkflowOutput = {
  id: string;
  nodeId: string;
  label: string;
  summary?: string;
  workflowId: string;
  vertical?: string;
  subtype?: string;
};

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onWidgetAdd: (widgetType: WidgetType, position: { x: number; y: number }) => void;
  dashboard: Dashboard;
  workflowOutputs: WorkflowOutput[];
  workflowOutputsLoading?: boolean;
}

const SIDEBAR_WIDTH = 340;
const PREEXPANDED_CATEGORIES = new Set<string>(['Data', 'Visualization', 'Content', 'Utility']);

export default function DashboardSidebar({
  isOpen,
  onToggle,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onWidgetAdd,
  dashboard,
  workflowOutputs,
  workflowOutputsLoading
}: DashboardSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(PREEXPANDED_CATEGORIES));

  const widgetsByCategory = useMemo<WidgetLibraryByCategory>(() => {
    const grouped: WidgetLibraryByCategory = {};
    const normalizedSearch = searchQuery.trim().toLowerCase();
    for (const category of WIDGET_CATEGORIES) {
      const catalog = getWidgetsByCategory(category as WidgetCategory);
      const filtered = normalizedSearch
        ? catalog.filter(widget =>
            widget.name.toLowerCase().includes(normalizedSearch) ||
            widget.description.toLowerCase().includes(normalizedSearch) ||
            widget.type.toLowerCase().includes(normalizedSearch)
          )
        : catalog;
      if (filtered.length > 0) {
        grouped[category] = filtered;
      }
    }
    return grouped;
  }, [searchQuery]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleWidgetClick = (widgetType: WidgetType) => {
    const canvasRect = document.querySelector('.dashboard-canvas')?.getBoundingClientRect();
    const grid = dashboard.settings.gridSize || 48;
    const defaultPosition = { x: 4, y: 3 };
    if (!canvasRect) {
      onWidgetAdd(widgetType, defaultPosition);
      return;
    }
    const centerX = Math.max(0, (canvasRect.width / 2) - grid * 1.5);
    const centerY = Math.max(0, (canvasRect.height / 2) - grid * 1.5);
    onWidgetAdd(widgetType, {
      x: Math.round(centerX / grid),
      y: Math.round(centerY / grid)
    });
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: isOpen ? `${SIDEBAR_WIDTH}px` : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 28,
          height: 56,
          background: 'var(--bg-elev)',
          border: '1px solid var(--control-border)',
          borderRadius: '0 12px 12px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 180,
          transition: 'left 0.18s ease',
          boxShadow: '0 6px 16px rgba(0,0,0,0.28)'
        }}
        title={isOpen ? 'Collapse library (Ctrl+B)' : 'Expand library (Ctrl+B)'}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
      </button>

      <aside
        className="dashboard-sidebar"
        style={{
          position: 'fixed',
          inset: '0 auto 0 0',
          width: isOpen ? `${SIDEBAR_WIDTH}px` : '0px',
          background: 'rgba(15, 15, 18, 0.86)',
          borderRight: '1px solid var(--control-border)',
          overflow: 'hidden',
          transition: 'width 0.18s ease',
          zIndex: 170,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)'
        }}
      >
        <div style={{
          width: `${SIDEBAR_WIDTH}px`,
          height: '100%',
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr auto',
          background: 'linear-gradient(180deg, rgba(19,19,22,0.95), rgba(16,16,18,0.96))'
        }}>
          <header style={{
            padding: '20px 20px 12px 20px',
            borderBottom: '1px solid var(--control-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Widget Library</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Curated visualization modules</div>
            </div>
            <button
              onClick={onToggle}
              style={{
                background: 'var(--control-bg)',
                border: '1px solid var(--control-border)',
                borderRadius: 6,
                color: 'var(--text)',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close sidebar"
            >
              <X size={14} />
            </button>
          </header>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--control-border)', display: 'grid', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)'
              }} />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 30px',
                  background: 'var(--control-bg)',
                  border: '1px solid var(--control-border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  fontSize: 12
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {WIDGET_CATEGORIES.map(category => {
                const active = category === selectedCategory;
                return (
                  <button
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--control-border)'}`,
                      background: active ? 'rgba(108,92,231,0.18)' : 'var(--control-bg)',
                      color: active ? 'var(--text)' : 'var(--muted)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '12px 16px 16px 16px',
            display: 'grid',
            gap: 12
          }}>
            {Object.entries(widgetsByCategory).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: 32 }}>
                No widgets found
              </div>
            ) : (
              Object.entries(widgetsByCategory).map(([category, widgets]) => {
                const expanded = expandedCategories.has(category);
                return (
                  <section key={category} style={{
                    border: '1px solid var(--control-border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'rgba(21,21,24,0.92)',
                    boxShadow: '0 8px 22px rgba(0,0,0,0.32)'
                  }}>
                    <button
                      onClick={() => toggleCategory(category)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(17,17,19,0.82)',
                        border: 'none',
                        color: 'var(--text)'
                      }}
                    >
                      <span style={{ fontSize: 12, letterSpacing: 0.4 }}>{category}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{widgets.length}</span>
                    </button>
                    {expanded && (
                      <div style={{ display: 'grid', gap: 10, padding: '12px 12px 12px 12px' }}>
                        {widgets.map(widget => (
                          <article
                            key={widget.id}
                            onClick={() => handleWidgetClick(widget.type)}
                            style={{
                              border: '1px solid var(--control-border)',
                              borderRadius: 8,
                              padding: 12,
                              background: 'rgba(15,15,17,0.86)',
                              cursor: 'pointer',
                              transition: 'border 120ms ease, transform 120ms ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 18 }}>{widget.icon}</span>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{widget.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{widget.description}</div>
                                </div>
                              </div>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: 999,
                                border: '1px solid var(--control-border)',
                                fontSize: 10,
                                color: 'var(--muted)'
                              }}>{widget.defaultSize}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10, color: 'var(--muted)' }}>
                              <span>Supports: {widget.supportedDataTypes.join(', ')}</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Zap size={12} /> {widget.type}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>

          <footer style={{
            padding: '14px 18px 18px 18px',
            borderTop: '1px solid var(--control-border)',
            display: 'grid',
            gap: 12,
            background: 'rgba(12,12,14,0.82)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Workflow Outputs</div>
            {workflowOutputsLoading ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Loading outputs...</div>
            ) : workflowOutputs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                No workflow outputs detected. Configure Output nodes in the Workflow builder to populate live data here.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, maxHeight: 180, overflow: 'auto' }}>
                {workflowOutputs.map(output => (
                  <div key={output.id} style={{
                    border: '1px solid var(--control-border)',
                    borderRadius: 8,
                    padding: 10,
                    background: 'rgba(20,20,24,0.82)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={12} color="var(--accent)" />
                        <span style={{ fontSize: 12, color: 'var(--text)' }}>{output.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{output.workflowId}</span>
                    </div>
                    {output.summary && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                        {output.summary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              Dashboard: {dashboard.name} • Widgets {dashboard.widgets.length}
            </div>
          </footer>
        </div>
      </aside>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.42)',
            zIndex: 90,
            display: window.innerWidth <= 900 ? 'block' : 'none'
          }}
          onClick={onToggle}
        />
      )}
    </>
  );
}
