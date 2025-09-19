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

// Monochrome header backgrounds by vertical (neutral tones)
export const verticalColors: Record<Vertical, string> = {
  // Restored vibrant header colors per vertical
  BI: '#0984e3',          // blue
  Political: '#e17055',   // orange
  Policymaking: '#6c5ce7',// purple
  Fundraising: '#22c55e', // green
  OSINT: '#00b894',       // teal
  SCI: '#fdcb6e'          // amber
};
