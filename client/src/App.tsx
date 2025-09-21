import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Use your actual home/chat page:
import HomePage from './pages/home';
import PhoneVerificationPage from './pages/phone-verification';

const qc = new QueryClient();

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
        <HomePage />
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
