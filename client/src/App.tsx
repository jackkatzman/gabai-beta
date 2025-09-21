import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';
import HomePage from './pages/home';

const qc = new QueryClient();

function Inner() {
  const { user, isLoading } = useUser();
  if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <div style={{ padding: 24 }}>No user</div>;
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
