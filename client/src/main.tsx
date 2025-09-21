// --- GLOBAL REACT SHIM (safe & temporary) ---
import * as ReactNS from 'react';
import * as ReactDOMClientNS from 'react-dom/client';

declare global {
  interface Window { React?: any; ReactDOM?: any; }
}

// if a legacy UMD lib expects window.React / window.ReactDOM, give it to them
if (!window.React) window.React = ReactNS;
if (!window.ReactDOM) window.ReactDOM = ReactDOMClientNS;
// ------------------------------------------------

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// sanity: log what we actually loaded
console.log('React version (runtime):', (React as any).version);

const el = document.getElementById('root');
if (!el) {
  throw new Error('#root not found in index.html');
}
createRoot(el).render(<App />);
