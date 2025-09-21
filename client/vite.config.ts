import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // leave React to resolve normally; don't alias 'react' here
      // (optional) these lines are safe but not required:
      // 'react/jsx-runtime': 'react/jsx-runtime',
      // 'react/jsx-dev-runtime': 'react/jsx-dev-runtime',
    },
  },
  build: { outDir: 'dist' },
});
