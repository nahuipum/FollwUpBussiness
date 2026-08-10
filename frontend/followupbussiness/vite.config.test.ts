import { expect, test } from 'vitest'
import { developmentProxy, localHttpsCredentials, resolveDevApiProxyTarget, viteConfiguration } from './vite.config'

test('keeps local HTTPS optional and rejects incomplete credentials', () => {
  expect(localHttpsCredentials({})).toBeUndefined()
  expect(() => localHttpsCredentials({ FRONTEND_HTTPS_CERT: 'certificate.pem' })).toThrow('FRONTEND_HTTPS_KEY')
})

test('uses the local HTTP backend for all development proxy paths by default', () => {
  const proxy = developmentProxy({})
  expect(Object.values(proxy).map(({ target }) => target)).toEqual(['http://localhost:8080/', 'http://localhost:8080/', 'http://localhost:8080/'])
  expect(Object.values(proxy).every(({ secure }) => secure === false)).toBe(true)
})

test('accepts local HTTP or HTTPS overrides and rejects remote HTTP or malformed targets', () => {
  expect(resolveDevApiProxyTarget('http://127.0.0.1:8081')).toBe('http://127.0.0.1:8081/')
  expect(resolveDevApiProxyTarget('https://api.example.test:8443')).toBe('https://api.example.test:8443/')
  expect(() => resolveDevApiProxyTarget('http://api.example.test:8080')).toThrow('loopback local')
  expect(() => resolveDevApiProxyTarget('not-a-url')).toThrow('HTTP(S)')
})

test('disables certificate verification only for loopback targets', () => {
  const localProxy = developmentProxy({ VITE_DEV_API_PROXY_TARGET: 'https://localhost:8080' })
  const remoteProxy = developmentProxy({ VITE_DEV_API_PROXY_TARGET: 'https://api.example.test:8443' })

  expect(Object.values(localProxy).every(({ secure }) => secure === false)).toBe(true)
  expect(Object.values(remoteProxy).every(({ secure }) => secure === true)).toBe(true)
})

test('does not include the insecure development proxy in production configuration', () => {
  expect(viteConfiguration('production', {})).not.toHaveProperty('server')
})
