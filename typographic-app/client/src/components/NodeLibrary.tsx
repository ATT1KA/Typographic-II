import { Fragment } from 'react';

export type VerticalKey = 'BI' | 'Political' | 'Policymaking' | 'Fundraising' | 'OSINT' | 'SCI';

export type LibraryItem = {
  vertical: VerticalKey;
  label: string; // display label
  subtype: string;
};

export default function NodeLibrary({
  open,
  onToggle,
  onAdd,
}: {
  open: boolean;
  onToggle: () => void;
  onAdd: (item: LibraryItem) => void;
}) {
  const lib: Record<VerticalKey, LibraryItem[]> = {
    BI: [
      { vertical: 'BI', label: 'Data Source', subtype: 'Data Source' },
      { vertical: 'BI', label: 'Data Warehouse', subtype: 'Data Warehouse' },
      { vertical: 'BI', label: 'Data Exploration', subtype: 'Data Exploration' },
      { vertical: 'BI', label: 'Data Mining', subtype: 'Data Mining' },
      { vertical: 'BI', label: 'Optimization', subtype: 'Optimization' },
      { vertical: 'BI', label: 'Reporting', subtype: 'Reporting' },
    ],
    Political: [
      { vertical: 'Political', label: 'Actor', subtype: 'Actor' },
      { vertical: 'Political', label: 'Edge/Link', subtype: 'Edge/Link' },
      { vertical: 'Political', label: 'Centrality', subtype: 'Centrality' },
      { vertical: 'Political', label: 'Community', subtype: 'Community' },
      { vertical: 'Political', label: 'Connectivity', subtype: 'Connectivity' },
      { vertical: 'Political', label: 'Clique/Core', subtype: 'Clique/Core' },
    ],
    Policymaking: [
      { vertical: 'Policymaking', label: 'Problem Identification', subtype: 'Problem Identification' },
      { vertical: 'Policymaking', label: 'Formulation', subtype: 'Formulation' },
      { vertical: 'Policymaking', label: 'Implementation', subtype: 'Implementation' },
      { vertical: 'Policymaking', label: 'Monitoring', subtype: 'Monitoring' },
      { vertical: 'Policymaking', label: 'Evaluation', subtype: 'Evaluation' },
    ],
    Fundraising: [
      { vertical: 'Fundraising', label: 'Sourcing', subtype: 'Sourcing' },
      { vertical: 'Fundraising', label: 'Screening', subtype: 'Screening' },
      { vertical: 'Fundraising', label: 'Due Diligence', subtype: 'Due Diligence' },
      { vertical: 'Fundraising', label: 'Negotiation', subtype: 'Negotiation' },
      { vertical: 'Fundraising', label: 'Closing', subtype: 'Closing' },
      { vertical: 'Fundraising', label: 'Post-Investment', subtype: 'Post-Investment' },
    ],
    OSINT: [
      { vertical: 'OSINT', label: 'Passive Collection', subtype: 'Passive Collection' },
      { vertical: 'OSINT', label: 'Social Media', subtype: 'Social Media' },
      { vertical: 'OSINT', label: 'Google Dorking', subtype: 'Google Dorking' },
      { vertical: 'OSINT', label: 'Metadata Analysis', subtype: 'Metadata Analysis' },
      { vertical: 'OSINT', label: 'Database Exploration', subtype: 'Database Exploration' },
      { vertical: 'OSINT', label: 'Technical Mapping', subtype: 'Technical Mapping' },
    ],
    SCI: [
      { vertical: 'SCI', label: 'Planning', subtype: 'Planning' },
      { vertical: 'SCI', label: 'Sourcing', subtype: 'Sourcing' },
      { vertical: 'SCI', label: 'Manufacturing', subtype: 'Manufacturing' },
      { vertical: 'SCI', label: 'Delivery/Shipping', subtype: 'Delivery/Shipping' },
      { vertical: 'SCI', label: 'Returns', subtype: 'Returns' },
      { vertical: 'SCI', label: 'Supplier Segmentation', subtype: 'Supplier Segmentation' },
    ],
  };

  const Section = ({ title, items }: { title: string; items: LibraryItem[] }) => (
    <details open>
      <summary style={{ padding: '8px 10px', cursor: 'pointer', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elev-2)', color: 'var(--muted)' }}>
        {title}
      </summary>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        {items.map((item) => (
          <button
            key={`${item.vertical}-${item.subtype}`}
            className="icon-btn"
            style={{ justifyContent: 'space-between' }}
            onClick={() => onAdd(item)}
            title={`Add ${item.vertical}: ${item.subtype}`}
          >
            <span>{item.label}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{item.vertical}</span>
          </button>
        ))}
      </div>
    </details>
  );

  return (
    <div
      className={`rail ${open ? 'open' : ''}`}
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'var(--panel-w, 320px)', pointerEvents: 'none', zIndex: 10 }}
    >
      <div className="rail-inner">
        <div className="rail-handle">
          <button className="rail-toggle" onClick={onToggle} title={open ? 'Collapse' : 'Expand'}>{open ? '←' : '→'}</button>
        </div>
  <div className="rail-panel" style={{ background: '#1a1a1a' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Node Library</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Browse and add nodes by category</div>
          <div style={{ height: 8 }} />
          {Object.entries(lib).map(([k, items]) => (
            <Fragment key={k}>
              <Section title={k} items={items as LibraryItem[]} />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
