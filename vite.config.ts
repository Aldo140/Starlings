import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: if deploying to a project page (username.github.io/repo-name),
// set base to '/repo-name/', otherwise use '/' for root domain
// This will be overridden by the GITHUB_PAGES_BASE environment variable if set
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE || '/',
});