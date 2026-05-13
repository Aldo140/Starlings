/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages: if deploying to a project page (username.github.io/repo-name),
// set base to '/repo-name/', otherwise use '/' for root domain
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE || './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-ui': ['lucide-react', 'vaul'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
