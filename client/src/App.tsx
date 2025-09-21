import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider, useUser } from '@/context/user-context';

const qc = new QueryClient();

function Inner() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 24 }}>
      ✅ UserProvider OK — user: {user ? 'yes' : 'no'}
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
