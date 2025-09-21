import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// If your path is different, adjust this import:
import PhoneVerificationPage from '@/pages/phone-verification';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PhoneVerificationPage />
    </QueryClientProvider>
  );
}
