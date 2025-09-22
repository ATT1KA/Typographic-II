import Inferno from 'inferno';
// Small Link replacement for react-router NavLink
function Link({ to, children }: { to: string; children?: any }) {
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    try { window.history.pushState({}, '', to); window.dispatchEvent(new PopStateEvent('popstate')); } catch {}
  };
  const isActive = typeof window !== 'undefined' && window.location && window.location.pathname === to;
  return <a href={to} className={isActive ? 'active' : ''} onClick={onClick as any}>{children}</a>;
}
import { Settings, SquareGanttChart } from 'lucide-react';
import HealthStatus from './HealthStatus';
import '../styles/theme.css';

export default function AppShell({ children }: { children?: any }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <SquareGanttChart size={18} color="var(--accent)" />
          <span className="brand-title">TYPOGRAPHIC</span>
        </div>
        <nav className="app-nav">
          <Link to="/explorer">Explorer</Link>
          <Link to="/workflow">Workflow</Link>
          <Link to="/dashboards">Dashboards</Link>
          <Link to="/reports">Reports</Link>
        </nav>
        <div className="header-actions">
          <HealthStatus />
          <button className="icon-btn" title="Settings">
            <Settings size={16} /> Settings
          </button>
        </div>
      </header>
      <main className="flow-surface">{children}</main>
    </div>
  );
}
