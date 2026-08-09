import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export function localHttpsCredentials(env: Record<string, string | undefined>, required: boolean) {
  const certificate = env.FRONTEND_HTTPS_CERT
  const privateKey = env.FRONTEND_HTTPS_KEY

  if (Boolean(certificate) !== Boolean(privateKey) || (required && (!certificate || !privateKey))) {
    throw new Error('FRONTEND_HTTPS_CERT y FRONTEND_HTTPS_KEY deben configurarse juntos para desarrollo HTTPS local.')
  }

  return certificate && privateKey
    ? { cert: readFileSync(certificate), key: readFileSync(privateKey) }
    : undefined
}

const defaultApiProxyTarget = 'https://localhost:8080'
const proxiedPaths = ['/auth', '/platform', '/api'] as const

export function resolveDevApiProxyTarget(value: string | undefined): string {
  const target = value?.trim() || defaultApiProxyTarget
  let url: URL
  try { url = new URL(target) } catch { throw new Error('VITE_DEV_API_PROXY_TARGET debe ser una URL HTTPS válida.') }
  if (url.protocol !== 'https:') throw new Error('VITE_DEV_API_PROXY_TARGET debe usar HTTPS.')
  return url.toString()
}

export function developmentProxy(env: Record<string, string | undefined>) {
  const target = resolveDevApiProxyTarget(env.VITE_DEV_API_PROXY_TARGET)
  return Object.fromEntries(proxiedPaths.map((path) => [path, { target, secure: false }]))
}

export function developmentServer(env: Record<string, string | undefined>) {
  const https = localHttpsCredentials(env, true)
  return { host: 'localhost', ...(https ? { https } : {}), proxy: developmentProxy(env) }
}

export function viteConfiguration(mode: string, env: Record<string, string | undefined>) {
  return { plugins: [react()], ...(mode === 'development' ? { server: developmentServer(env) } : {}) }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return viteConfiguration(mode, env)
})
