import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import PhoneVerificationPage from './pages/phone-verification';
import HomeSafe from './pages/home.safe'; // TEMP safe home (see file below)

const qc = new QueryClient();

function Inner() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <div style={{ padding: 24, fontFamily: 'system-ui' }}>Loading…</div>;
  }

  if (!user) {
    return <PhoneVerificationPage onVerified={() => window.location.replace('/chat')} />;
  }

  // Signed in → render safe Home (no heavy imports yet)
  return <HomeSafe />;
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
