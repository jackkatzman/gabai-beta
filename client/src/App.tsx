import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import PhoneVerificationPage from './pages/phone-verification';

// Lazy load the real home/chat page
const HomePage = React.lazy(() => import('./pages/home'));

const qc = new QueryClient();

// Minimal error boundary
class AppErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, err };
  }
  componentDidCatch(err: unknown, info: unknown) {
    console.error('AppErrorBoundary caught:', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.err ?? '')}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Inner app that uses user-context to decide
function Inner() {
  const { user, isLoading } = useUser(); // requires UserProvider

  if (isLoading) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <PhoneVerificationPage
        onVerified={() => {
          // After verify, reload so UserProvider refetches /api/auth/user
          window.location.replace('/chat');
        }}
      />
    );
  }

  // Signed in → load HomePage lazily
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          Loading…
        </div>
      }
    >
      <HomePage />
    </React.Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <UserProvider>
        <AppErrorBoundary>
          <Inner />
        </AppErrorBoundary>
      </UserProvider>
    </QueryClientProvider>
  );
}
