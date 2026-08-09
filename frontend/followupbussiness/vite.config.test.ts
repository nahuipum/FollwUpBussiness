import { expect, test } from 'vitest'
import { developmentProxy, localHttpsCredentials, resolveDevApiProxyTarget, viteConfiguration } from './vite.config'

test('requires a local certificate and private key for development HTTPS', () => {
  expect(() => localHttpsCredentials({}, true)).toThrow('FRONTEND_HTTPS_CERT')
  expect(() => localHttpsCredentials({ FRONTEND_HTTPS_CERT: 'certificate.pem' }, true)).toThrow('FRONTEND_HTTPS_KEY')
})

test('uses one HTTPS target for all development proxy paths only', () => {
  const proxy = developmentProxy({})
  expect(Object.values(proxy).map(({ target }) => target)).toEqual(['https://localhost:8080/', 'https://localhost:8080/', 'https://localhost:8080/'])
  expect(Object.values(proxy).every(({ secure }) => secure === false)).toBe(true)
})

test('accepts an HTTPS override and rejects downgrade or malformed targets', () => {
  expect(resolveDevApiProxyTarget('https://api.example.test:8443')).toBe('https://api.example.test:8443/')
  expect(() => resolveDevApiProxyTarget('http://localhost:8080')).toThrow('HTTPS')
  expect(() => resolveDevApiProxyTarget('not-a-url')).toThrow('HTTPS')
})

test('does not include the insecure development proxy in production configuration', () => {
  expect(viteConfiguration('production', {})).not.toHaveProperty('server')
})
