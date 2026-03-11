import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'offline.html'],
      // Use injectManifest for custom sw.js control
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-custom.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
      manifest: false, // We use ManifestUpdater for dynamic manifests
    }),
  ],
  base: '/',
  build: {
    outDir: 'build',
    assetsDir: '.',
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'app[hash].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})