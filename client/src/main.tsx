import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const el = document.getElementById('root');
if (!el) {
  throw new Error('Root element #root not found');
}

console.log('React version:', (React as any).version || 'unknown');

createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
