import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// NOTE: not adding UserProvider yet — first confirm shell renders
import PhoneVerificationPage from './pages/phone-verification';

const qc = new QueryClient();

export default function App() {
  useEffect(() => console.log('[App] mounted ✅'), []);
  return (
    <QueryClientProvider client={qc}>
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        ✅ App + React Query OK (no UserProvider yet)
        <div style={{ marginTop: 12 }}>
          <PhoneVerificationPage onVerified={() => window.location.replace('/chat')} />
        </div>
      </div>
    </QueryClientProvider>
  );
}
