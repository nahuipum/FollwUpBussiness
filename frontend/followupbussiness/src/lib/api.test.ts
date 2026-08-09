import { expect, test } from 'vitest'
import { ApiConfigurationError, resolveApiUrl } from './api'

test('resolves local login against the single HTTPS backend base URL', () => {
  expect(resolveApiUrl('https://localhost:8080', '/auth/login')).toBe('https://localhost:8080/auth/login')
})

test.each([undefined, '', '   ', 'http://localhost:8080'])('rejects a missing or HTTP API base URL: %s', (baseUrl) => {
  expect(() => resolveApiUrl(baseUrl, '/auth/login')).toThrow(ApiConfigurationError)
})
