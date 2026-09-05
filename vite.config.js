import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  root: 'client',
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
