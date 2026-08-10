export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

export function resolveApiUrl(
  apiBaseUrl: string | undefined,
  path: string,
  allowInsecureLocalhost = false,
): string {
  if (apiBaseUrl === undefined || apiBaseUrl.trim() === "") {
    throw new ApiConfigurationError(
      "VITE_API_BASE_URL debe configurar la URL base de la API.",
    );
  }

  try {
    const url = new URL(
      path.replace(/^\/+/, ""),
      `${apiBaseUrl.replace(/\/+$/, "")}/`,
    );
    if (
      url.protocol !== "https:" &&
      !(
        allowInsecureLocalhost &&
        url.protocol === "http:" &&
        isLocalHostname(url.hostname)
      )
    ) {
      throw new ApiConfigurationError(
        "VITE_API_BASE_URL solo permite HTTP para loopback durante desarrollo local.",
      );
    }
    return url.toString();
  } catch {
    throw new ApiConfigurationError(
      "VITE_API_BASE_URL debe ser una URL absoluta HTTP(S) válida.",
    );
  }
}

export function apiUrl(path: string): string {
  return resolveApiUrl(
    import.meta.env.VITE_API_BASE_URL,
    path,
    import.meta.env.DEV,
  );
}

export function apiRequest(path: string, init: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
