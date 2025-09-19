import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, SquareGanttChart } from 'lucide-react';
import HealthStatus from './HealthStatus';
import '../styles/theme.css';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <SquareGanttChart size={18} color="var(--accent)" />
          <span className="brand-title">TYPOGRAPHIC</span>
        </div>
        <nav className="app-nav">
          <NavLink to="/explorer" className={({ isActive }) => isActive ? 'active' : ''}>Explorer</NavLink>
          <NavLink to="/workflow" className={({ isActive }) => isActive ? 'active' : ''}>Workflow</NavLink>
          <NavLink to="/dashboards" className={({ isActive }) => isActive ? 'active' : ''}>Dashboards</NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>Reports</NavLink>
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
