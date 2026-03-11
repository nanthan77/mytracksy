import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'offline.html'],
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
    assetsDir: 'assets',
    sourcemap: false,
    // Chunk size warning at 500KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Smart chunk splitting for optimal caching & loading
        entryFileNames: 'assets/app-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // Vendor chunks — cached independently from app code
          if (id.includes('node_modules')) {
            // Firebase — heavy, rarely changes
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase';
            }
            // MUI — large UI library
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            // Charts & data viz
            if (id.includes('recharts') || id.includes('d3-') || id.includes('jspdf') || id.includes('xlsx')) {
              return 'vendor-charts';
            }
            // i18n
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }
            // Everything else from node_modules
            return 'vendor-common';
          }
          // App route chunks (lazy-loaded via React.lazy)
          if (id.includes('/components/LandingPage')) return 'page-landing';
          if (id.includes('/components/DoctorLandingPage')) return 'page-doctor';
          if (id.includes('/components/ProfessionLandingPage')) return 'page-profession';
          if (id.includes('/components/dashboards/')) return 'page-dashboard';
          if (id.includes('/features/voice')) return 'feature-voice';
          if (id.includes('/features/sms')) return 'feature-sms';
        }
      }
    }
  }
})