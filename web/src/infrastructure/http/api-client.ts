import { ApiHttpError } from './api-error'
import { clearAuthToken, getAuthToken } from './auth-token-storage'

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  auth?: 'bearer' | 'none'
  signal?: AbortSignal
}

interface ApiErrorPayload {
  error?: unknown
  message?: unknown
}

function readBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL

  if (typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    throw new ApiHttpError({
      code: 'ApiBaseUrlNotConfiguredError',
      message: 'VITE_API_BASE_URL is not configured.',
      status: 0,
    })
  }

  return baseUrl.trim().replace(/\/$/, '')
}

function buildUrl(path: string, query: ApiFetchOptions['query']): string {
  const baseUrl = readBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${baseUrl}${normalizedPath}`)

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue
      }

      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

function buildHeaders(body: unknown, auth: ApiFetchOptions['auth']): Headers {
  const headers = new Headers()

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth !== 'none') {
    const token = getAuthToken()

    if (token !== null) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  return headers
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined
  }

  if (body instanceof FormData) {
    return body
  }

  return JSON.stringify(body)
}

async function readErrorPayload(response: Response): Promise<ApiErrorPayload> {
  try {
    return (await response.json()) as ApiErrorPayload
  } catch {
    return {}
  }
}

function deriveErrorCode(payload: ApiErrorPayload, status: number): string {
  if (typeof payload.error === 'string' && payload.error.length > 0) {
    return payload.error
  }

  return `HttpError${status}`
}

function deriveErrorMessage(payload: ApiErrorPayload, status: number): string {
  if (typeof payload.message === 'string' && payload.message.length > 0) {
    return payload.message
  }

  return `Erro inesperado do servidor (status ${status}).`
}

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const { method = 'GET', body, query, auth = 'bearer', signal } = options
  const url = buildUrl(path, query)
  const headers = buildHeaders(body, auth)

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers,
      body: serializeBody(body),
      signal,
    })
  } catch (networkError) {
    const message = networkError instanceof Error ? networkError.message : 'Falha de rede ao contatar a API.'
    throw new ApiHttpError({ code: 'NetworkError', message, status: 0 })
  }

  if (response.ok) {
    if (response.status === 204) {
      return undefined as TResponse
    }

    return (await response.json()) as TResponse
  }

  const payload = await readErrorPayload(response)
  const code = deriveErrorCode(payload, response.status)
  const message = deriveErrorMessage(payload, response.status)

  if (response.status === 401) {
    clearAuthToken()
  }

  throw new ApiHttpError({ code, message, status: response.status })
}
