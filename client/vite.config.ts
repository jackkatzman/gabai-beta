import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hard-pin all React entry points to ONE installation under client/node_modules
const reactDir = path.resolve(__dirname, 'node_modules', 'react');
const reactDomDir = path.resolve(__dirname, 'node_modules', 'react-dom');

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: reactDir,
      'react-dom': reactDomDir,
      'react/jsx-runtime': path.join(reactDir, 'jsx-runtime.js'),
    },
    // If any dependency tries to bring its own copy, this collapses it
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    // Prefer modern exports
    mainFields: ['module', 'jsnext:main', 'browser', 'main'],
  },
  optimizeDeps: {
    // Make sure Vite pre-bundles these from THIS install
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    exclude: [],
  },
  build: {
    commonjsOptions: { include: [/node_modules/] },
    rollupOptions: {
      // Ensure nothing is externalized by accident — especially not 'react'
      external: [],
    },
  },
});
