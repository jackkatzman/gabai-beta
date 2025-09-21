import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure all modules get the same React object
      'react': path.resolve(__dirname, './src/react-shim.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Force pre-bundle of core React deps to avoid edge cases
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  build: { outDir: 'dist' },
});
