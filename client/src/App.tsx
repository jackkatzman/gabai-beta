import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PhoneVerificationPage from './pages/phone-verification';

// Lazy load the real home/chat page so a bad import can’t white-screen
const HomePage = React.lazy(() => import('./pages/home'));

const qc = new QueryClient();

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = React.useState<Error | null>(null);
  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h2>Something went wrong</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      </div>
    );
  }
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          Loading…
        </div>
      }
    >
      <React.ErrorBoundary onError={setError as any}>{children}</React.ErrorBoundary>
    </React.Suspense>
  );
}

// Polyfill for React.ErrorBoundary (in case your setup doesn’t have one)
// If you already have one, you can remove this block.
declare global {
  namespace React {
    // @ts-ignore minimal shim
    class ErrorBoundary extends React.Component<{ onError?: (err: any) => void }> {}
  }
}
// simple shim for runtime if needed
// @ts-ignore
if (!('ErrorBoundary' in React)) {
  // @ts-ignore
  React.ErrorBoundary = class extends React.Component<any, any> {
    constructor(props: any) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError(err: any) { return { hasError: true, err }; }
    componentDidCatch(err: any) { this.props.onError?.(err); }
    render() { return this.state.hasError ? this.props.fallback ?? null : this.props.children; }
  };
}

export default function App() {
  const [path, setPath] = React.useState(window.location.pathname);

  // Decide initial route based on token
  React.useEffect(() => {
    const token = localStorage.getItem('gabai_token');
    const desired = token ? '/chat' : '/phone';
    if (window.location.pathname !== desired) {
      window.history.replaceState({}, '', desired);
      setPath(desired);
    }
  }, []);

  // Track back/forward
  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <QueryClientProvider client={qc}>
      {path === '/chat' ? (
        <ErrorBoundary>
          <HomePage />
        </ErrorBoundary>
      ) : (
        <PhoneVerificationPage
          onVerified={() => {
            window.history.replaceState({}, '', '/chat');
            setPath('/chat');
          }}
        />
      )}
    </QueryClientProvider>
  );
}
