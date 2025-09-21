import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('React runtime:', (React as any).version, typeof (React as any).useEffect);

const el = document.getElementById('root');
if (!el) throw new Error('#root not found in index.html');
createRoot(el).render(<App />);
