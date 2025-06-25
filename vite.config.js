import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

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
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
