import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    },

    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem'),
    },
  },
  plugins: [react(), tailwindcss()],
    resolve: {
    alias: {
      '@rtypes': path.resolve('./src/types'),
      '@schemas': path.resolve('./src/schemas'),
    },
    },
})