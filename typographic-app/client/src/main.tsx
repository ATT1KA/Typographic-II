// no explicit React import required under automatic runtime
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './styles/theme.css';
import './styles/global.css';

// Decide at runtime whether we're in Inferno compat (classic) or standard React 18
const isInfernoCompat = import.meta.env.VITE_INFERNO_COMPAT === '1';

// App component is now in a separate file for tests

async function mountApp() {
  const rootEl = document.getElementById('root')!;
  if (isInfernoCompat) {
    const ReactDOMClassic = await import('react-dom');
    // @ts-expect-error typings are for React18; compat provides render()
    ReactDOMClassic.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
      rootEl
    );
  } else {
    const ReactDOMClient = await import('react-dom/client');
    ReactDOMClient.createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
}

void mountApp();
