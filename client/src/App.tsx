import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import PhoneVerificationPage from './pages/phone-verification';

const qc = new QueryClient();

function Inner() {
  const { user, isLoading } = useUser();
  if (isLoading) return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Loading…</div>;
  if (!user) return <PhoneVerificationPage onVerified={() => window.location.replace('/chat')} />;
  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      ✅ UserProvider OK. Signed-in shell renders.
    </div>
  );
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
