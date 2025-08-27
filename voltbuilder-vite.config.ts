import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Clean Vite config for VoltBuilder - no Replit-specific plugins
export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, "client"),
  build: {
    outDir: path.join(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@db": path.resolve(__dirname, "./db"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  publicDir: path.join(__dirname, "public"),
});
