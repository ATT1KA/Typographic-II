import { useState, useMemo } from 'react';
import { Search, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Dashboard, WidgetCategory, getWidgetsByCategory, WIDGET_CATEGORIES } from '../types/dashboard';

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onWidgetAdd: (widgetType: string, position: { x: number; y: number }) => void;
  dashboard: Dashboard;
}

export default function DashboardSidebar({
  isOpen,
  onToggle,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onWidgetAdd,
  dashboard
}: DashboardSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Data', 'Visualization', 'Content', 'Navigation', 'Utility'])
  );

  // Filter widgets based on search query
  const filteredWidgets = useMemo(() => {
    const allWidgets = WIDGET_CATEGORIES.flatMap(category =>
      getWidgetsByCategory(category as WidgetCategory)
    );

    if (!searchQuery.trim()) {
      return allWidgets;
    }

    const query = searchQuery.toLowerCase();
    return allWidgets.filter(widget =>
      widget.name.toLowerCase().includes(query) ||
      widget.description.toLowerCase().includes(query) ||
      widget.type.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group filtered widgets by category
  const widgetsByCategory = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};

    WIDGET_CATEGORIES.forEach(category => {
      const categoryWidgets = filteredWidgets.filter(widget => widget.category === category);
      if (categoryWidgets.length > 0) {
        grouped[category] = categoryWidgets;
      }
    });

    return grouped;
  }, [filteredWidgets]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleWidgetDragStart = (event: React.DragEvent, widgetType: string) => {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'dashboard-widget',
      widgetType
    }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleWidgetClick = (widgetType: string) => {
    // Add widget to a default position (center of visible area)
    const canvasRect = document.querySelector('.dashboard-canvas')?.getBoundingClientRect();
    if (canvasRect) {
      const centerX = Math.max(0, (canvasRect.width / 2) - 100); // 100px offset from center
      const centerY = Math.max(0, (canvasRect.height / 2) - 50);  // 50px offset from center

      onWidgetAdd(widgetType, {
        x: Math.round(centerX / (dashboard.settings.gridSize || 48)),
        y: Math.round(centerY / (dashboard.settings.gridSize || 48))
      });
    }
  };

  return (
    <>
      {/* Sidebar toggle button */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        style={{
          position: 'fixed',
          left: isOpen ? '320px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px',
          height: '48px',
          background: 'var(--bg-elev)',
          border: '1px solid var(--control-border)',
          borderRadius: '0 8px 8px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'left 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Sidebar */}
      <div
        className="dashboard-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: isOpen ? '320px' : '0',
          background: 'var(--bg-elev)',
          borderRight: '1px solid var(--control-border)',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          zIndex: 99
        }}
      >
        <div
          style={{
            width: '320px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--control-border)',
              background: 'var(--bg-elev-2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>
                Widget Library
              </h3>
              <button
                onClick={onToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)'
                }}
              />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px 6px 28px',
                  background: 'var(--control-bg)',
                  border: '1px solid var(--control-border)',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          {/* Category tabs */}
          <div
            style={{
              padding: '12px',
              borderBottom: '1px solid var(--control-border)'
            }}
          >
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {WIDGET_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  style={{
                    padding: '4px 8px',
                    background: selectedCategory === category ? 'var(--accent)' : 'var(--control-bg)',
                    color: selectedCategory === category ? 'white' : 'var(--text)',
                    border: '1px solid var(--control-border)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Widget list */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {Object.entries(widgetsByCategory).map(([category, widgets]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'var(--bg-elev-2)',
                    border: '1px solid var(--control-border)',
                    borderRadius: '4px',
                    color: 'var(--text)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <span>{category}</span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    {widgets.length}
                  </span>
                </button>

                {expandedCategories.has(category) && (
                  <div style={{ marginTop: '8px' }}>
                    {widgets.map(widget => (
                      <div
                        key={widget.id}
                        draggable
                        onDragStart={(e) => handleWidgetDragStart(e, widget.type)}
                        onClick={() => handleWidgetClick(widget.type)}
                        style={{
                          padding: '12px 8px',
                          marginBottom: '4px',
                          background: 'var(--bg-elev-2)',
                          border: '1px solid var(--control-border)',
                          borderRadius: '4px',
                          cursor: 'grab',
                          transition: 'all 0.2s ease',
                          opacity: 0.8
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--control-border)';
                          e.currentTarget.style.opacity = '0.8';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px' }}>{widget.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text)' }}>
                              {widget.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                              {widget.description}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            padding: '2px 6px',
                            background: 'var(--control-bg)',
                            borderRadius: '2px',
                            fontSize: '9px',
                            color: 'var(--muted)'
                          }}>
                            {widget.defaultSize}
                          </span>
                          <span style={{
                            padding: '2px 6px',
                            background: 'var(--accent)',
                            borderRadius: '2px',
                            fontSize: '9px',
                            color: 'white'
                          }}>
                            {widget.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {Object.keys(widgetsByCategory).length === 0 && (
              <div style={{
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '14px',
                padding: '40px 20px'
              }}>
                {searchQuery.trim() ? 'No widgets found' : 'No widgets available'}
              </div>
            )}
          </div>

          {/* Dashboard info */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid var(--control-border)',
              background: 'var(--bg-elev-2)',
              fontSize: '11px',
              color: 'var(--muted)'
            }}
          >
            <div>Dashboard: {dashboard.name}</div>
            <div>Widgets: {dashboard.widgets.length}</div>
            <div>Grid: {dashboard.settings.gridSize || 48}px</div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 98,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
          onClick={onToggle}
        />
      )}
    </>
  );
}