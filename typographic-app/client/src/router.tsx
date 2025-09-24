import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';

export interface AppRoute {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
}

interface RouterProps {
  routes: AppRoute[];
}

export function Router({ routes }: RouterProps) {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={<AppShell><route.component /></AppShell>}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export function navigate(to: string) {
  window.location.href = to;
}

// useParams function removed - was causing useLocation() error
// If needed, implement as a proper React hook within a component context
