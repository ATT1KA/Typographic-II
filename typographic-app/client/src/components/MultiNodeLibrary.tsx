import DataLibrary, { type LibraryItem as BaseItem } from './NodeLibrary';

export type NodeCategory = 'Data' | 'Connectivity' | 'Transformation' | 'Output';

export type LibraryItem = BaseItem & {
  category: NodeCategory;
  sampleConfig?: Record<string, unknown>;
};

type Props = {
  open: boolean;
  category: NodeCategory;
  onToggle: () => void;
  onAdd: (item: LibraryItem) => void;
};

const connectivity: LibraryItem[] = [
  { category: 'Connectivity', vertical: 'Connectivity' as any, label: 'Causal Inference', subtype: 'Causal Inference', sampleConfig: { method: 'granger', confidence: 0.95, lags: 2 } },
  { category: 'Connectivity', vertical: 'Connectivity' as any, label: 'Correlation Connector', subtype: 'Correlation Connector', sampleConfig: { metric: 'pearson', threshold: 0.5 } },
  { category: 'Connectivity', vertical: 'Connectivity' as any, label: 'Dependency Path', subtype: 'Dependency Path', sampleConfig: { algorithm: 'bfs', maxHops: 5 } },
  { category: 'Connectivity', vertical: 'Connectivity' as any, label: 'Feedback Connector', subtype: 'Feedback Connector', sampleConfig: { iterations: 10, convergence: 0.001 } },
];

const transformation: LibraryItem[] = [
  { category: 'Transformation', vertical: 'Transformation' as any, label: 'Aggregation Transformer', subtype: 'Aggregation Transformer', sampleConfig: { fn: 'mean', groupBy: ['region'] } },
  { category: 'Transformation', vertical: 'Transformation' as any, label: 'Normalization Transformer', subtype: 'Normalization Transformer', sampleConfig: { method: 'zscore' } },
  { category: 'Transformation', vertical: 'Transformation' as any, label: 'Enrichment Transformer', subtype: 'Enrichment Transformer', sampleConfig: { source: 'sentiment-api', merge: 'left' } },
  { category: 'Transformation', vertical: 'Transformation' as any, label: 'Filtering Transformer', subtype: 'Filtering Transformer', sampleConfig: { where: 'risk > 0.15', op: 'AND' } },
];

const output: LibraryItem[] = [
  { category: 'Output', vertical: 'Output' as any, label: 'Dashboard Generator', subtype: 'Dashboard Generator', sampleConfig: { frequency: '10m', layout: 'grid' } },
  { category: 'Output', vertical: 'Output' as any, label: 'Visualization Exporter', subtype: 'Visualization Exporter', sampleConfig: { frequency: '1h', format: 'png' } },
  { category: 'Output', vertical: 'Output' as any, label: 'Report Compiler', subtype: 'Report Compiler', sampleConfig: { frequency: 'weekly', format: 'pdf' } },
  { category: 'Output', vertical: 'Output' as any, label: 'Alert/Export', subtype: 'Alert/Export', sampleConfig: { frequency: 'on-change', format: 'csv' } },
];

export default function MultiNodeLibrary({ open, category, onToggle, onAdd }: Props) {
  if (category === 'Data') {
    return (
      <DataLibrary
        open={open}
        onToggle={onToggle}
        onAdd={(it: BaseItem) => onAdd({ ...it, category: 'Data' })}
      />
    );
  }

  const map: Record<NodeCategory, LibraryItem[]> = {
    Data: [],
    Connectivity: connectivity,
    Transformation: transformation,
    Output: output,
  };
  const items = map[category];

  return (
    <aside className={`node-flyout ${open ? 'open' : 'closed'}`} aria-label={`${category} node library`}>
      <header className="node-flyout-header">
        <strong>{category} Nodes</strong>
        <button className="icon-btn" onClick={onToggle} aria-label="Close">×</button>
      </header>
      <div className="node-flyout-list">
        {items.map((it) => (
          <button
            key={`${it.category}-${it.subtype}`}
            className="library-item"
            onClick={() => onAdd(it)}
            title={it.subtype}
          >
            <div className="title">{it.subtype}</div>
            <div className="sub">{category}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
