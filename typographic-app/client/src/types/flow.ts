export type Vertical = 'BI' | 'Political' | 'Policymaking' | 'Fundraising' | 'OSINT' | 'SCI' | 'Connectivity' | 'Transformation' | 'Output';

export type NodeCategory = 'Data' | 'Connectivity' | 'Transformation' | 'Output';
export type PortKind = 'data' | 'meta';

export type NodeData = {
  label: string;
  vertical: Vertical;
  subtype: string;
  /** Optional high-level grouping; defaults to 'Data' for legacy nodes */
  category?: NodeCategory;
  /** Optional explicit ports; if absent, defaults are derived from category */
  ports?: Array<{
    id: string;
    direction: 'in' | 'out';
    kind: PortKind;
    maxConnections?: number | 'many';
  }>;
  config?: {
    /** For Data/Transformation/Output nodes */
    dataSource?: {
      type?: 'api' | 'db' | 'file';
      endpoint?: string;
      notes?: string;
    };
    transforms?: Array<
      | { type: 'lm-studio-summary'; params: { endpoint: string; prompt: string } }
      | { type: 'aggregation'; params?: Record<string, unknown> }
      | { type: 'anomaly-detection'; params?: Record<string, unknown> }
    >;
    outputs?: string[];
    /** For Connectivity nodes: pure routing/logic parameters (no IO config) */
    logic?: Record<string, unknown>;
    /** Allow additional ad-hoc config keys (e.g., method, threshold, etc.) */
    [key: string]: any;
  };
  onChange?: (partial: Partial<NodeData>) => void;
};

// Monochrome header backgrounds by vertical (neutral tones)
export const verticalColors: Record<Vertical, string> = {
  // Restored vibrant header colors per vertical
  BI: '#0984e3',          // blue
  Political: '#e17055',   // orange
  Policymaking: '#6c5ce7',// purple
  Fundraising: '#22c55e', // green
  OSINT: '#00b894',       // teal
  SCI: '#fdcb6e',         // amber
  Connectivity: '#8ab4ff',
  Transformation: '#ffb86c',
  Output: '#0B6623'
};
