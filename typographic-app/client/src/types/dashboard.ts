
// Dashboard Types
export type DashboardLayout = 'grid' | 'masonry' | 'flexbox';

export type DashboardDensity = 'comfortable' | 'compact' | 'cozy';

export type WidgetType =
  | 'metric'
  | 'chart'
  | 'table'
  | 'text'
  | 'image'
  | 'map'
  | 'timeline'
  | 'progress'
  | 'status'
  | 'list'
  | 'calendar'
  | 'gauge'
  | 'kanban'
  | 'stat'
  | 'heatmap'
  | 'kpi'
  | 'custom';

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'heatmap'
  | 'radar'
  | 'treemap'
  | 'histogram'
  | 'bubble'
  | 'candlestick';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

export type WidgetFilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

export type DataSource = {
  workflowId: string;
  nodeId: string;
  outputType: 'data' | 'meta';
  endpoint?: string;
  refreshInterval?: number; // seconds
  lastSyncedAt?: string;
};

export type WidgetPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WidgetStyle = {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  borderRadius?: number;
  opacity?: number;
  elevation?: number;
  accentColor?: string;
  backdropBlur?: number;
  showTitleBar?: boolean;
};

export type WidgetVisual = {
  type?: string;
  variant?: string;
  palette?: string;
  options?: Record<string, any>;
};

export type WidgetFilter = {
  id?: string;
  label?: string;
  field: string;
  operator: WidgetFilterOperator;
  value: unknown;
  enabled?: boolean;
};

export type WidgetConfig = {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position: WidgetPosition;
  dataSource?: DataSource;
  refreshInterval?: number;
  settings: Record<string, any>;
  style?: WidgetStyle;
  visual?: WidgetVisual;
  filters?: WidgetFilter[];
};

export type DashboardSettings = {
  backgroundColor?: string;
  backgroundImage?: string;
  gridSize?: number;
  gap?: number;
  theme?: 'dark' | 'light' | 'auto';
  refreshInterval?: number;
  density?: DashboardDensity;
  showGrid?: boolean;
  snapToGrid?: boolean;
};

export type DashboardMetadata = {
  icon?: string;
  color?: string;
  tags?: string[];
  owner?: string;
  defaultWorkflowId?: string;
  lastViewedWorkflowId?: string;
  favorite?: boolean;
  descriptionSummary?: string;
};

export type Dashboard = {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  settings: DashboardSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: DashboardMetadata;
};

export type DashboardSummary = {
  id: string;
  name: string;
  description?: string;
  widgetCount: number;
  lastModified: Date;
  createdAt: Date;
  connectedWorkflows: string[];
  metadata?: DashboardMetadata;
};

export type DashboardPayload = Omit<Dashboard, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type DashboardSummaryPayload = Omit<DashboardSummary, 'createdAt' | 'lastModified'> & {
  createdAt: string;
  lastModified: string;
};

export type DashboardCollectionResponse = {
  dashboards: DashboardSummary[];
};

// Widget Library Categories
export type WidgetCategory = 'Data' | 'Visualization' | 'Content' | 'Navigation' | 'Utility' | 'Operations' | 'AI';

export type WidgetLibraryItem = {
  id: string;
  type: WidgetType;
  category: WidgetCategory;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  defaultSettings: Record<string, any>;
  supportedDataTypes: string[];
  configOptions: {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range' | 'multiselect';
    label: string;
    required: boolean;
    defaultValue: any;
    options?: { label: string; value: any }[];
    min?: number;
    max?: number;
    step?: number;
    helperText?: string;
  }[];
};

export type WidgetLibraryGroup = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  items: WidgetLibraryItem[];
};

// Predefined widget templates
export const WIDGET_CATEGORIES: WidgetCategory[] = ['Data', 'Visualization', 'Content', 'Navigation', 'Utility', 'Operations', 'AI'];

export const WIDGET_SIZES: Record<WidgetSize, { width: number; height: number }> = {
  small: { width: 1, height: 1 },
  medium: { width: 2, height: 1 },
  large: { width: 2, height: 2 },
  xlarge: { width: 3, height: 2 },
  xxlarge: { width: 4, height: 3 }
};

export const DEFAULT_DASHBOARD: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'New Dashboard',
  description: '',
  layout: 'grid',
  widgets: [],
  settings: {
    backgroundColor: '#1b1b1b',
    gridSize: 48,
    gap: 12,
    theme: 'dark',
    refreshInterval: 60,
    density: 'comfortable',
    showGrid: true,
    snapToGrid: true
  },
  createdBy: undefined,
  metadata: {
    icon: '📊',
    color: '#6c5ce7',
    tags: [],
    defaultWorkflowId: 'default',
    lastViewedWorkflowId: 'default',
    favorite: false
  }
};

export function parseDashboard(payload: DashboardPayload): Dashboard {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    metadata: payload.metadata ? { ...payload.metadata, tags: payload.metadata.tags ?? [] } : undefined
  };
}

export function parseDashboardSummary(payload: DashboardSummaryPayload): DashboardSummary {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    lastModified: new Date(payload.lastModified),
    metadata: payload.metadata ? { ...payload.metadata, tags: payload.metadata.tags ?? [] } : undefined
  };
}

export function serializeDashboard(dashboard: Dashboard): DashboardPayload {
  return {
    ...dashboard,
    createdAt: dashboard.createdAt.toISOString(),
    updatedAt: dashboard.updatedAt.toISOString()
  };
}

export function serializeDashboardSummary(summary: DashboardSummary): DashboardSummaryPayload {
  return {
    ...summary,
    createdAt: summary.createdAt.toISOString(),
    lastModified: summary.lastModified.toISOString()
  };
}

// Widget Library Items
export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
  {
    id: 'metric-core-kpi',
    type: 'metric',
    category: 'Data',
    name: 'Core KPI',
    description: 'Hero metric with delta and comparison baseline.',
    icon: '📈',
    defaultSize: 'small',
    defaultSettings: { format: 'number', showTrend: true, comparisonWindow: '7d' },
    supportedDataTypes: ['number', 'percentage'],
    configOptions: [
      { key: 'format', type: 'select', label: 'Format', required: true, defaultValue: 'number', options: [
        { label: 'Number', value: 'number' },
        { label: 'Currency', value: 'currency' },
        { label: 'Percentage', value: 'percentage' }
      ] },
      { key: 'showTrend', type: 'boolean', label: 'Show Trendline', required: false, defaultValue: true },
      { key: 'comparisonWindow', type: 'select', label: 'Comparison Window', required: false, defaultValue: '7d', options: [
        { label: '7 Days', value: '7d' },
        { label: '14 Days', value: '14d' },
        { label: '30 Days', value: '30d' }
      ] }
    ]
  },
  {
    id: 'viz-timeseries',
    type: 'chart',
    category: 'Visualization',
    name: 'Time Series',
    description: 'Interactive line / area chart with multiple series.',
    icon: '🕒',
    defaultSize: 'large',
    defaultSettings: { chartType: 'line', stacked: false, smooth: true },
    supportedDataTypes: ['timeseries', 'array'],
    configOptions: [
      { key: 'chartType', type: 'select', label: 'Chart Type', required: true, defaultValue: 'line', options: [
        { label: 'Line', value: 'line' },
        { label: 'Area', value: 'area' },
        { label: 'Bar', value: 'bar' }
      ] },
      { key: 'stacked', type: 'boolean', label: 'Stack Series', required: false, defaultValue: false },
      { key: 'smooth', type: 'boolean', label: 'Smooth Curves', required: false, defaultValue: true }
    ]
  },
  {
    id: 'viz-comparison',
    type: 'chart',
    category: 'Visualization',
    name: 'Comparison Bars',
    description: 'Side-by-side bars for categorical comparisons.',
    icon: '📊',
    defaultSize: 'large',
    defaultSettings: { chartType: 'bar', orientation: 'vertical', showLegend: true },
    supportedDataTypes: ['array', 'table'],
    configOptions: [
      { key: 'orientation', type: 'select', label: 'Orientation', required: true, defaultValue: 'vertical', options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' }
      ] },
      { key: 'showLegend', type: 'boolean', label: 'Show Legend', required: false, defaultValue: true }
    ]
  },
  {
    id: 'table-advanced',
    type: 'table',
    category: 'Data',
    name: 'Advanced Table',
    description: 'Paginated table with column level filters and pinning.',
    icon: '🗂️',
    defaultSize: 'xlarge',
    defaultSettings: { showHeaders: true, filterable: true, pagination: true, pageSize: 20 },
    supportedDataTypes: ['table', 'array'],
    configOptions: [
      { key: 'filterable', type: 'boolean', label: 'Enable Filters', required: false, defaultValue: true },
      { key: 'pagination', type: 'boolean', label: 'Pagination', required: false, defaultValue: true },
      { key: 'pageSize', type: 'number', label: 'Rows per page', required: false, defaultValue: 20, min: 5, max: 100 }
    ]
  },
  {
    id: 'kanban-flow',
    type: 'kanban',
    category: 'Operations',
    name: 'Kanban Flow',
    description: 'Column-based board for operational throughput tracking.',
    icon: '🗂',
    defaultSize: 'xlarge',
    defaultSettings: { swimlanes: false, showTotals: true },
    supportedDataTypes: ['array', 'object'],
    configOptions: [
      { key: 'swimlanes', type: 'boolean', label: 'Enable Swimlanes', required: false, defaultValue: false },
      { key: 'showTotals', type: 'boolean', label: 'Show Totals', required: false, defaultValue: true }
    ]
  },
  {
    id: 'ai-summary',
    type: 'text',
    category: 'AI',
    name: 'AI Insight',
    description: 'LLM-generated summary block with contextual metadata.',
    icon: '🤖',
    defaultSize: 'medium',
    defaultSettings: { tone: 'analytical', includeSources: true },
    supportedDataTypes: ['string', 'markdown'],
    configOptions: [
      { key: 'tone', type: 'select', label: 'Tone', required: false, defaultValue: 'analytical', options: [
        { label: 'Analytical', value: 'analytical' },
        { label: 'Causal', value: 'causal' },
        { label: 'Narrative', value: 'narrative' }
      ] },
      { key: 'includeSources', type: 'boolean', label: 'Include Sources', required: false, defaultValue: true }
    ]
  },
  {
    id: 'status-grid',
    type: 'status',
    category: 'Utility',
    name: 'Status Grid',
    description: 'Compact status tile matrix for service health.',
    icon: '🟢',
    defaultSize: 'medium',
    defaultSettings: { layout: 'grid', columns: 3 },
    supportedDataTypes: ['array', 'status'],
    configOptions: [
      { key: 'columns', type: 'number', label: 'Columns', required: false, defaultValue: 3, min: 1, max: 6 },
      { key: 'layout', type: 'select', label: 'Layout', required: true, defaultValue: 'grid', options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' }
      ] }
    ]
  },
  {
    id: 'progress-radial',
    type: 'gauge',
    category: 'Visualization',
    name: 'Radial Goal',
    description: 'Circular progress indicator showcasing goal attainment.',
    icon: '🎯',
    defaultSize: 'medium',
    defaultSettings: { min: 0, max: 100, current: 72, showValue: true },
    supportedDataTypes: ['number', 'percentage'],
    configOptions: [
      { key: 'max', type: 'number', label: 'Maximum', required: true, defaultValue: 100 },
      { key: 'showValue', type: 'boolean', label: 'Show Value', required: false, defaultValue: true }
    ]
  }
];

// Helper functions
export function getWidgetIcon(type: WidgetType): string {
  const widget = WIDGET_LIBRARY.find(w => w.type === type);
  return widget?.icon || '📦';
}

export function getWidgetByType(type: WidgetType): WidgetLibraryItem | undefined {
  return WIDGET_LIBRARY.find(w => w.type === type);
}

export function getWidgetsByCategory(category: WidgetCategory): WidgetLibraryItem[] {
  return WIDGET_LIBRARY.filter(w => w.category === category);
}

export function createWidgetFromLibrary(
  libraryItem: WidgetLibraryItem,
  position: { x: number; y: number }
): WidgetConfig {
  return {
    id: `${libraryItem.type}-${Date.now()}`,
    type: libraryItem.type,
    title: libraryItem.name,
    description: libraryItem.description,
    size: libraryItem.defaultSize,
    position: {
      x: position.x,
      y: position.y,
      width: WIDGET_SIZES[libraryItem.defaultSize].width,
      height: WIDGET_SIZES[libraryItem.defaultSize].height
    },
    settings: { ...libraryItem.defaultSettings },
    style: {},
    filters: []
  };
}
