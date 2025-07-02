import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    include: /\.(mdx|js|jsx|ts|tsx)$/
  })],
  base: './',
  server: {
    port: 5174,
    host: true,
    cors: true,
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    chunkSizeWarningLimit: 600, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks to reduce bundle size
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['react-icons', 'styled-components'],
          'chart-vendor': ['recharts'],
          'router-vendor': ['react-router-dom'],
          'crypto-vendor': ['speakeasy'],
          'utils-vendor': ['uuid', 'qrcode', 'qrcode.react'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    loader: 'jsx',
    include: /\.(jsx?|tsx?)$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
