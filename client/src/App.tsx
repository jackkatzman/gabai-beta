import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        ✅ App + React Query OK
      </div>
    </QueryClientProvider>
  );
}
