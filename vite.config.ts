import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true
  }
});
