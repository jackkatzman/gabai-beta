import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import PhoneVerificationPage from './pages/phone-verification';
import React from 'react';
import HomePage from './pages/home'; // <-- your real UI

const qc = new QueryClient();

function Inner() {
  const { user, isLoading } = useUser();

  // Simple debug — check what's going on
  console.log('[App] isLoading:', isLoading, 'user:', user);

  if (isLoading) {
    return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Loading…</div>;
  }

  // If we still don’t have a user, show verify
  if (!user) {
    return (
      <PhoneVerificationPage
        onVerified={() => {
          // hard swap to ensure context sees the dev-bypass immediately
          window.location.replace('/chat');
        }}
      />
    );
  }

  // ✅ User present → show your real Home UI
  return <HomePage />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <UserProvider>
        <Inner />
      </UserProvider>
    </QueryClientProvider>
  );
}
