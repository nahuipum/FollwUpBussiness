export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

export type ApiErrorStatus = 401 | 403 | 404 | 409 | 422 | 500 | 503;

export type ApiFieldError = Readonly<{
  field: string;
  code: string;
}>;

export type ApiError = Readonly<{
  status: ApiErrorStatus;
  correlationId: string | null;
  fieldErrors: readonly ApiFieldError[];
}>;

export class ApiRequestObsoleteError extends Error {
  constructor() {
    super("La respuesta pertenece a una sesión reemplazada.");
    this.name = "ApiRequestObsoleteError";
  }
}

type ProblemResponse = {
  correlationId?: unknown;
  fieldErrors?: unknown;
};

const handledStatuses = new Set<number>([401, 403, 404, 409, 422, 500, 503]);
const correlationIdPattern = /^[\x20-\x7e]{1,100}$/;
const fieldPattern = /^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/;
const apiErrorListeners = new Set<
  (error: ApiError, sessionGeneration: number) => void
>();
const pendingRequestControllers = new Map<AbortController, number>();
let activeSessionGeneration = 0;

function safeCorrelationId(value: unknown): string | null {
  return typeof value === "string" && correlationIdPattern.test(value)
    ? value
    : null;
}

function safeFieldErrors(value: unknown): readonly ApiFieldError[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { field, code } = item as { field?: unknown; code?: unknown };
    return typeof field === "string" && fieldPattern.test(field) &&
      typeof code === "string" && code.length > 0 && code.length <= 100
      ? [{ field, code }]
      : [];
  });
}

export function subscribeToApiErrors(
  listener: (error: ApiError, sessionGeneration: number) => void,
): () => void {
  apiErrorListeners.add(listener);
  return () => apiErrorListeners.delete(listener);
}

/** Keeps transport results tied to the in-memory authentication generation. */
export function setApiSessionGeneration(sessionGeneration: number): void {
  if (activeSessionGeneration === sessionGeneration) return;
  activeSessionGeneration = sessionGeneration;
  pendingRequestControllers.forEach((generation, controller) => {
    if (generation !== sessionGeneration) controller.abort();
  });
}

export async function normalizeApiError(response: Response): Promise<ApiError | null> {
  if (!handledStatuses.has(response.status)) return null;

  let problem: ProblemResponse | null = null;
  try {
    const body: unknown = await response.clone().json();
    if (typeof body === "object" && body !== null) problem = body as ProblemResponse;
  } catch {
    // An error response is still safe to show without its body.
  }

  const correlationId =
    safeCorrelationId(response.headers.get("X-Correlation-Id")) ??
    safeCorrelationId(problem?.correlationId);
  return {
    status: response.status as ApiErrorStatus,
    correlationId,
    fieldErrors: safeFieldErrors(problem?.fieldErrors),
  };
}

async function publishApiError(
  response: Response,
  sessionGeneration: number,
): Promise<void> {
  if (sessionGeneration !== activeSessionGeneration) return;
  const error = await normalizeApiError(response);
  if (error !== null && sessionGeneration === activeSessionGeneration)
    apiErrorListeners.forEach((listener) => listener(error, sessionGeneration));
}

export function resolveApiUrl(
  apiBaseUrl: string | undefined,
  path: string,
  development = false,
): string {
  // Development requests use a namespace that cannot collide with SPA routes.
  // The proxy target is server-side configuration, so an old VITE_API_BASE_URL
  // cannot make the browser bypass it (and expose the backend's CORS policy).
  if (development) return `/api/${path.replace(/^\/+/, "")}`;

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
    if (url.protocol !== "https:") {
      throw new ApiConfigurationError(
        "VITE_API_BASE_URL debe usar HTTPS fuera de desarrollo.",
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

export async function apiRequest(
  path: string,
  init: RequestInit,
  { publishErrors = true }: { publishErrors?: boolean } = {},
): Promise<Response> {
  const sessionGeneration = activeSessionGeneration;
  const controller = new AbortController();
  pendingRequestControllers.set(controller, sessionGeneration);
  const signal =
    init.signal == null
      ? controller.signal
      : AbortSignal.any([init.signal, controller.signal]) ?? controller.signal;

  try {
    const response = await fetch(apiUrl(path), { ...init, signal });
    if (sessionGeneration !== activeSessionGeneration)
      throw new ApiRequestObsoleteError();
    if (!response.ok && publishErrors)
      void publishApiError(response, sessionGeneration);
    return response;
  } catch (error) {
    if (sessionGeneration !== activeSessionGeneration)
      throw new ApiRequestObsoleteError();
    throw error;
  } finally {
    pendingRequestControllers.delete(controller);
  }
}
