
// Dashboard Types
export type DashboardLayout = 'grid' | 'masonry' | 'flexbox';

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
  | 'gauge';

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'heatmap'
  | 'radar'
  | 'treemap';

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge';

export type DataSource = {
  workflowId: string;
  nodeId: string;
  outputType: 'data' | 'meta';
  endpoint?: string;
  refreshInterval?: number; // in seconds
};

export type WidgetPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WidgetConfig = {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position: WidgetPosition;
  dataSource?: DataSource;
  settings: Record<string, any>; // Widget-specific settings
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
};

export type Dashboard = {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  settings: {
    backgroundColor?: string;
    backgroundImage?: string;
    gridSize?: number;
    gap?: number;
    theme?: 'dark' | 'light' | 'auto';
    refreshInterval?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
};

// Widget Library Categories
export type WidgetCategory = 'Data' | 'Visualization' | 'Content' | 'Navigation' | 'Utility';

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
    type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range';
    label: string;
    required: boolean;
    defaultValue: any;
    options?: { label: string; value: any }[];
    min?: number;
    max?: number;
  }[];
};

// Predefined widget templates
export const WIDGET_CATEGORIES: WidgetCategory[] = ['Data', 'Visualization', 'Content', 'Navigation', 'Utility'];

export const WIDGET_SIZES: { [key in WidgetSize]: { width: number; height: number } } = {
  small: { width: 1, height: 1 },
  medium: { width: 2, height: 1 },
  large: { width: 2, height: 2 },
  xlarge: { width: 3, height: 2 }
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
    refreshInterval: 60
  }
};

// Widget Library Items
export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
  // Data Widgets
  {
    id: 'metric-number',
    type: 'metric',
    category: 'Data',
    name: 'Metric Number',
    description: 'Display a single metric with trend indicators',
    icon: '📊',
    defaultSize: 'small',
    defaultSettings: { format: 'number', showTrend: true, showChange: true },
    supportedDataTypes: ['number', 'currency', 'percentage'],
    configOptions: [
      { key: 'format', type: 'select', label: 'Format', required: true, defaultValue: 'number',
        options: [
          { label: 'Number', value: 'number' },
          { label: 'Currency', value: 'currency' },
          { label: 'Percentage', value: 'percentage' }
        ]
      },
      { key: 'showTrend', type: 'boolean', label: 'Show Trend', required: false, defaultValue: true },
      { key: 'showChange', type: 'boolean', label: 'Show Change', required: false, defaultValue: true }
    ]
  },
  {
    id: 'chart-line',
    type: 'chart',
    category: 'Visualization',
    name: 'Line Chart',
    description: 'Time series line chart with multiple series support',
    icon: '📈',
    defaultSize: 'large',
    defaultSettings: { chartType: 'line', xAxis: 'time', yAxis: 'value', showLegend: true },
    supportedDataTypes: ['timeseries', 'array'],
    configOptions: [
      { key: 'chartType', type: 'select', label: 'Chart Type', required: true, defaultValue: 'line',
        options: [
          { label: 'Line', value: 'line' },
          { label: 'Area', value: 'area' },
          { label: 'Bar', value: 'bar' }
        ]
      },
      { key: 'showLegend', type: 'boolean', label: 'Show Legend', required: false, defaultValue: true },
      { key: 'xAxis', type: 'string', label: 'X Axis Field', required: true, defaultValue: 'time' },
      { key: 'yAxis', type: 'string', label: 'Y Axis Field', required: true, defaultValue: 'value' }
    ]
  },
  {
    id: 'table-data',
    type: 'table',
    category: 'Data',
    name: 'Data Table',
    description: 'Tabular data display with sorting and filtering',
    icon: '📋',
    defaultSize: 'xlarge',
    defaultSettings: { showHeaders: true, sortable: true, filterable: true, pagination: true },
    supportedDataTypes: ['table', 'array'],
    configOptions: [
      { key: 'showHeaders', type: 'boolean', label: 'Show Headers', required: false, defaultValue: true },
      { key: 'sortable', type: 'boolean', label: 'Sortable Columns', required: false, defaultValue: true },
      { key: 'filterable', type: 'boolean', label: 'Filterable', required: false, defaultValue: true },
      { key: 'pagination', type: 'boolean', label: 'Pagination', required: false, defaultValue: true },
      { key: 'pageSize', type: 'number', label: 'Page Size', required: false, defaultValue: 25, min: 5, max: 100 }
    ]
  },
  {
    id: 'text-content',
    type: 'text',
    category: 'Content',
    name: 'Rich Text',
    description: 'Rich text content with markdown support',
    icon: '📝',
    defaultSize: 'medium',
    defaultSettings: { content: '# Heading\n\nContent here...', markdown: true },
    supportedDataTypes: ['string', 'markdown'],
    configOptions: [
      { key: 'content', type: 'string', label: 'Content', required: true, defaultValue: '# Heading\n\nContent here...' },
      { key: 'markdown', type: 'boolean', label: 'Enable Markdown', required: false, defaultValue: true }
    ]
  },
  {
    id: 'progress-bar',
    type: 'progress',
    category: 'Data',
    name: 'Progress Bar',
    description: 'Visual progress indicator with percentage',
    icon: '📊',
    defaultSize: 'medium',
    defaultSettings: { min: 0, max: 100, current: 75, showPercentage: true, color: '#22c55e' },
    supportedDataTypes: ['number', 'percentage'],
    configOptions: [
      { key: 'min', type: 'number', label: 'Minimum', required: true, defaultValue: 0 },
      { key: 'max', type: 'number', label: 'Maximum', required: true, defaultValue: 100 },
      { key: 'current', type: 'number', label: 'Current Value', required: true, defaultValue: 75 },
      { key: 'showPercentage', type: 'boolean', label: 'Show Percentage', required: false, defaultValue: true },
      { key: 'color', type: 'color', label: 'Color', required: false, defaultValue: '#22c55e' }
    ]
  },
  {
    id: 'status-indicator',
    type: 'status',
    category: 'Utility',
    name: 'Status Indicator',
    description: 'Status indicator with color coding',
    icon: '🔴',
    defaultSize: 'small',
    defaultSettings: { status: 'operational', showLabel: true, color: '#22c55e' },
    supportedDataTypes: ['string', 'status'],
    configOptions: [
      { key: 'status', type: 'select', label: 'Status', required: true, defaultValue: 'operational',
        options: [
          { label: 'Operational', value: 'operational' },
          { label: 'Warning', value: 'warning' },
          { label: 'Critical', value: 'critical' },
          { label: 'Maintenance', value: 'maintenance' },
          { label: 'Offline', value: 'offline' }
        ]
      },
      { key: 'showLabel', type: 'boolean', label: 'Show Label', required: false, defaultValue: true },
      { key: 'color', type: 'color', label: 'Color', required: false, defaultValue: '#22c55e' }
    ]
  },
  {
    id: 'gauge-chart',
    type: 'gauge',
    category: 'Visualization',
    name: 'Gauge Chart',
    description: 'Circular gauge with needle indicator',
    icon: '🎯',
    defaultSize: 'medium',
    defaultSettings: { min: 0, max: 100, current: 75, color: '#3b82f6', showValue: true },
    supportedDataTypes: ['number', 'percentage'],
    configOptions: [
      { key: 'min', type: 'number', label: 'Minimum', required: true, defaultValue: 0 },
      { key: 'max', type: 'number', label: 'Maximum', required: true, defaultValue: 100 },
      { key: 'current', type: 'number', label: 'Current Value', required: true, defaultValue: 75 },
      { key: 'color', type: 'color', label: 'Color', required: false, defaultValue: '#3b82f6' },
      { key: 'showValue', type: 'boolean', label: 'Show Value', required: false, defaultValue: true }
    ]
  },
  {
    id: 'list-widget',
    type: 'list',
    category: 'Content',
    name: 'List Widget',
    description: 'Ordered or unordered list display',
    icon: '📜',
    defaultSize: 'medium',
    defaultSettings: { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false, bulletColor: '#6c5ce7' },
    supportedDataTypes: ['array', 'list'],
    configOptions: [
      { key: 'items', type: 'string', label: 'Items (comma-separated)', required: true, defaultValue: 'Item 1, Item 2, Item 3' },
      { key: 'ordered', type: 'boolean', label: 'Ordered List', required: false, defaultValue: false },
      { key: 'bulletColor', type: 'color', label: 'Bullet Color', required: false, defaultValue: '#6c5ce7' }
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
    settings: { ...libraryItem.defaultSettings }
  };
}
