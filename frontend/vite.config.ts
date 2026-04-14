import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  server: {
      host: "0.0.0.0",
      port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },

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