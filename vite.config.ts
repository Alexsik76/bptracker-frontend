import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'
import type { Plugin } from 'vite'

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

function localConfigPlugin(): Plugin {
  return {
    name: 'inject-local-config',
    transformIndexHtml(html, ctx) {
      if (!ctx.server) return html
      return html.replace(
        '<script src="/config.js"></script>',
        '<script src="/config.js"></script>\n    <script src="/config.local.js" onerror="void 0"></script>',
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [vue(), localConfigPlugin()],
    optimizeDeps: {
      include: ['onnxruntime-web'],
    },
    define: {
      __APP_COMMIT__: JSON.stringify(getGitCommit()),
      __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
    base: '/',
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith('https:'),
          cookieDomainRewrite: 'localhost',
        },
      },
    },
    test: {
      environment: 'happy-dom',
      globals: true,
    },
  }
})
