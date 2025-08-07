import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        const res = await fetch(queryKey[0] as string, { signal });
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
