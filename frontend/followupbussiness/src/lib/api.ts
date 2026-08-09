export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiConfigurationError'
  }
}

export function resolveApiUrl(apiBaseUrl: string | undefined, path: string): string {
  if (apiBaseUrl === undefined || apiBaseUrl.trim() === '') {
    throw new ApiConfigurationError('VITE_API_BASE_URL debe configurar la URL base de la API.')
  }

  try {
    const url = new URL(path.replace(/^\/+/, ''), `${apiBaseUrl.replace(/\/+$/, '')}/`)
    if (url.protocol !== 'https:') {
      throw new ApiConfigurationError('VITE_API_BASE_URL debe usar HTTPS.')
    }
    return url.toString()
  } catch {
    throw new ApiConfigurationError('VITE_API_BASE_URL debe ser una URL absoluta HTTPS válida.')
  }
}

export function apiUrl(path: string): string {
  return resolveApiUrl(import.meta.env.VITE_API_BASE_URL, path)
}

export function apiRequest(path: string, init: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init)
}
