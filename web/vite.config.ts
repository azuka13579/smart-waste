import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // Backend di-proxy lewat origin yang sama agar cookie sesi (httpOnly, SameSite=Lax) ikut terkirim
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (url) => url.replace(/^\/api/, ''),
        },
      },
    },
  }
})
