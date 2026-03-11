import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@admin': path.resolve(__dirname, 'src-admin'),
    },
  },
  build: {
    outDir: 'build-admin',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
      output: {
        entryFileNames: 'admin.js',
        chunkFileNames: 'admin-[hash].js',
        assetFileNames: 'admin-[name].[ext]',
      },
    },
  },
  server: {
    port: 5174,
  },
});
