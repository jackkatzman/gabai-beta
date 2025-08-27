import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// import "./utils/mobile-content-fix"; // Commented out to prevent loading issues
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

console.log('🚀 React main.tsx starting...');

try {
  const rootElement = document.getElementById("root");
  console.log('📍 Root element found:', !!rootElement);
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ React root created');
  
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {/* <Toaster /> */}
      </QueryClientProvider>
    </React.StrictMode>
  );
  
  console.log('✅ React app rendered');
} catch (error) {
  console.error('❌ React startup failed:', error);
  
  // Fallback: show basic HTML content
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>GabAi</h1>
        <p>Loading error. Please check console.</p>
        <p>Error: ${(error as Error).message}</p>
      </div>
    `;
  }
}
