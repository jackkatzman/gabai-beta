import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import PhoneVerificationPage from './pages/phone-verification';

// Lazy load the real home/chat page
const HomePage = React.lazy(() => import('./pages/home'));

const qc = new QueryClient();

// Local error boundary (do NOT mutate React)
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; err?: unknown }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
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

// Signed in → TEMP stub to isolate HomePage
return (
  <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
    ✅ Auth OK. App shell is rendering.
  </div>
);

  }

  // Not signed in yet → show phone verify screen
  if (!user) {
    return (
      <PhoneVerificationPage
        onVerified={() => {
          // after verify, just reload and UserProvider will fetch /api/auth/user
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
  // Keep QueryClientProvider (your main.tsx might also provide one; double-wrapping is harmless)
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
