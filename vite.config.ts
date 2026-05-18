import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  define: {
    __APP_COMMIT__: JSON.stringify(getGitCommit()),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  base: '/',
  server: {
    proxy: {
      '/api': {
        target: 'https://api-bptracker.home.vn.ua',
        changeOrigin: true,
        secure: true,
        cookieDomainRewrite: 'localhost',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
