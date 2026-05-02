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
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_COMMIT__: JSON.stringify(getGitCommit()),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  base: '/',
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
