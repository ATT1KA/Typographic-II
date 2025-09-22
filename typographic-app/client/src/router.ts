import { createBrowserHistory } from 'history';
import { useEffect, useState, createElement } from 'inferno';

export const history = createBrowserHistory();

export interface Route {
  path: string;
  component: () => any;
  exact?: boolean;
}

export function Router({ routes }: { routes: Route[] }) {
  const [location, setLocation] = useState(history.location);

  useEffect(() => {
    const unlisten = history.listen(() => setLocation(history.location));
    return () => unlisten();
  }, []);

  const match = routes.find((r: any) => {
    const p = r.path === '*' ? location.pathname : String(r.path);
    return location.pathname.startsWith(p) && (r.exact ? location.pathname === p : true);
  });

  return match ? match.component() : createElement('div', null, '404');
}

export function navigate(to: string) {
  history.push(to);
}

export function useParams(): Record<string, string> {
  return {};
}