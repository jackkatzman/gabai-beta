import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PhoneVerificationPage from './pages/phone-verification';

// Lazy load the real home/chat page so a bad import can’t white-screen
const HomePage = React.lazy(() => import('./pages/home'));

const qc = new QueryClient();

// Our own error boundary (no mutation of React import)
class AppErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; onError?: (err: unknown) => void; children: React.ReactNode },
  { hasError: boolean; err?: unknown }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, err };
  }
  componentDidCatch(err: unknown) {
    this.props.onError?.(err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
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
        <AppErrorBoundary>
          <React.Suspense
            fallback={
              <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
                Loading…
              </div>
            }
          >
            <HomePage />
          </React.Suspense>
        </AppErrorBoundary>
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
