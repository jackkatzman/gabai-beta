import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Toaster removed - using native notifications with Capacitor

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        // FORCE current domain to fix cached domain issue
        let url = queryKey[0] as string;
        if (url.startsWith('/api/')) {
          url = `${window.location.origin}${url}`;
          console.log('🔧 Fixed API URL to current domain:', url);
        }
        
        const res = await fetch(url, { 
          signal,
          credentials: 'include' // Important for auth cookies
        });
        
        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }
          if (res.status === 401) {
            throw new Error(`${res.status}: Unauthorized`);
          }
          const message = await res.text();
          throw new Error(`${res.status}: ${message}`);
        }
        return res.json();
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* <Toaster /> */}
    </QueryClientProvider>
  </React.StrictMode>
);
