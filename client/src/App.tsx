import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ⬇️ Pick ONE import that matches your repo.
// Try this first (works if file is client/src/pages/chat/index.tsx):
import ChatPage from '@/pages/chat';
// If build fails, change the line above to one of:
// import ChatPage from './pages/chat';
// import ChatPage from './pages/chat/Chat';

import PhoneVerificationPage from './pages/phone-verification';

const queryClient = new QueryClient();

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

  // Track path changes
  React.useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (path === '/chat') {
    return (
      <QueryClientProvider client={queryClient}>
        <ChatPage />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PhoneVerificationPage
        onVerified={() => {
          window.history.replaceState({}, '', '/chat');
          setPath('/chat');
        }}
      />
    </QueryClientProvider>
  );
}
