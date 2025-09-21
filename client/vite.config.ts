import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [] // make sure 'react' is NOT excluded anywhere
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  resolve: {
    alias: {
      // important: do NOT alias react/react-dom to anything weird
    }
  }
});
