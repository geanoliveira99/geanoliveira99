import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5174,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // three.js é grande por natureza — chunk separado com cache longo
    chunkSizeWarningLimit: 1200,
    // CSS em chunk separado por componente (melhor cache)
    cssCodeSplit: true,
    // Target moderno: menos polyfills, código menor
    target: 'es2020',
    rollupOptions: {
      output: {
        // Manual chunks: cada vendor em arquivo separado → cache independente no browser
        manualChunks(id) {
          // three.js core separado do @react-three (download paralelo)
          if (id.includes('/three/') && !id.includes('@react-three')) {
            return 'three-core';
          }
          // @react-three/fiber + @react-three/drei
          if (id.includes('@react-three')) {
            return 'three-react';
          }
          // Framer Motion
          if (id.includes('framer-motion')) {
            return 'framer-vendor';
          }
          // React core + react-dom
          if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-dom'))) {
            return 'react-vendor';
          }
          // Lucide icons
          if (id.includes('lucide-react')) {
            return 'lucide-vendor';
          }
          // Outros node_modules → vendors genérico
          if (id.includes('node_modules')) {
            return 'vendors';
          }
        },
      },
    },
  },
})
