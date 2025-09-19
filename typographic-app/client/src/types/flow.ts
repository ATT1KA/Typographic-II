export type Vertical = 'BI' | 'Political' | 'Policymaking' | 'Fundraising' | 'OSINT' | 'SCI';

export type NodeData = {
  label: string;
  vertical: Vertical;
  subtype: string;
  config?: {
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
  };
  onChange?: (partial: Partial<NodeData>) => void;
};

export const verticalColors: Record<Vertical, string> = {
  BI: '#6c5ce7',
  Political: '#0984e3',
  Policymaking: '#d63031',
  Fundraising: '#e17055',
  OSINT: '#00b894',
  SCI: '#fdcb6e'
};
