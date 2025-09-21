import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import PhoneVerificationPage from './pages/phone-verification';
import React from 'react';
import HomePage from './pages/home'; // direct import is fine now

const qc = new QueryClient();

function Inner() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Loading…</div>;
  }

  // Not signed in → show phone verify
  if (!user) {
    return (
      <PhoneVerificationPage
        onVerified={() => {
          // after verify, refresh so UserProvider refetches /api/auth/user
          window.location.replace('/chat');
        }}
      />
    );
  }

  // Signed in → go home
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
