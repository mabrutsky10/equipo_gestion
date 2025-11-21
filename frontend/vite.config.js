import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const loadCustomEnvFile = (mode) => {
  const envFile = path.resolve(process.cwd(), `vite.env.${mode}`)
  if (!fs.existsSync(envFile)) {
    return
  }
  const content = fs.readFileSync(envFile, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) return
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (key) {
      process.env[key] = value
    }
  })
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  loadCustomEnvFile(mode)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5180,
      host: 'localhost',
      strictPort: true,
      hmr: {
        port: 5180,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'build',
    },
    define: {
      'import.meta.env.VITE_API_URL_PROFILE': JSON.stringify(env.VITE_API_URL_PROFILE || process.env.VITE_API_URL_PROFILE || ''),
      'import.meta.env.VITE_API_URL_BO': JSON.stringify(env.VITE_API_URL_BO || process.env.VITE_API_URL_BO || ''),
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV || process.env.VITE_ENV || ''),
    },
  }
})







