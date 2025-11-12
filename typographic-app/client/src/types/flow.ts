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

// Monochrome header backgrounds by vertical (subtle tonal shifts only)
export const verticalColors: Record<Vertical, string> = {
  BI: '#343434',
  Political: '#3b3b3b',
  Policymaking: '#424242',
  Fundraising: '#494949',
  OSINT: '#515151',
  SCI: '#585858',
  Connectivity: '#606060',
  Transformation: '#696969',
  Output: '#727272'
};
