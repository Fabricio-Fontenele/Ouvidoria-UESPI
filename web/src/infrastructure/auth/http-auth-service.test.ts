import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiHttpError } from '../http/api-error'
import { HttpAuthService } from './http-auth-service'

const apiBaseUrl = 'https://api.example.test'

function buildJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

function encodeJwtSegment(value: unknown) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildToken(payload: Record<string, unknown> = { role: 'ombudsman', sub: 'user-1' }) {
  return `${encodeJwtSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeJwtSegment(payload)}.signature`
}

function buildUserResponse() {
  return {
    user: {
      attendanceRating: { average: 4.5, count: 2 },
      createdAt: '2026-05-25T12:00:00.000Z',
      email: 'ombudsman@example.com',
      id: 'user-1',
      name: 'Ouvidor Oficial',
      role: 'ombudsman',
    },
  }
}

function getFetchCall(index = 0) {
  const fetchMock = vi.mocked(fetch)
  const call = fetchMock.mock.calls[index]

  if (call === undefined) {
    throw new Error(`fetch call ${index.toString()} was not found`)
  }

  return call
}

function stubStorage(token: string | null = null) {
  const storage = {
    getItem: vi.fn().mockReturnValue(token),
    removeItem: vi.fn(),
    setItem: vi.fn(),
  }

  vi.stubGlobal('window', { atob, sessionStorage: storage })
  return storage
}

describe('HttpAuthService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse(buildUserResponse())))
    stubStorage(buildToken())
    import.meta.env.VITE_API_BASE_URL = apiBaseUrl
  })

  it('loads the current session from /me using the stored bearer token', async () => {
    const service = new HttpAuthService()

    const session = await service.getSession()

    const [url, init] = getFetchCall()
    const headers = init?.headers as Headers

    expect(url).toBe(`${apiBaseUrl}/me`)
    expect(headers.get('Authorization')).toBe(`Bearer ${buildToken()}`)
    expect(session).toStrictEqual({
      token: buildToken(),
      user: buildUserResponse().user,
    })
  })

  it('clears the stored token and returns null when /me rejects authentication', async () => {
    const storage = stubStorage(buildToken())
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          buildJsonResponse({ error: 'UnauthenticatedError', message: 'Authentication is required.' }, 401),
        ),
    )
    const service = new HttpAuthService()

    const session = await service.getSession()

    expect(session).toBeNull()
    expect(storage.removeItem).toHaveBeenCalledWith('ouvidoria-uespi-auth-token')
  })

  it('throws when the stored token is valid but /me fails unexpectedly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(buildJsonResponse({ error: 'ServerError', message: 'boom' }, 500)))
    const service = new HttpAuthService()

    await expect(service.getSession()).rejects.toBeInstanceOf(ApiHttpError)
  })

  it('persists the sign-in token and returns the hydrated /me session', async () => {
    const token = buildToken()
    const storage = stubStorage(token)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(buildJsonResponse({ token }))
        .mockResolvedValueOnce(buildJsonResponse(buildUserResponse())),
    )
    const service = new HttpAuthService()

    const session = await service.signIn({ email: 'ombudsman@example.com', password: 'Senha1234' })

    expect(storage.setItem).toHaveBeenCalledWith('ouvidoria-uespi-auth-token', token)
    expect(getFetchCall(0)[0]).toBe(`${apiBaseUrl}/sessions`)
    expect(getFetchCall(1)[0]).toBe(`${apiBaseUrl}/me`)
    expect(session.user).toStrictEqual(buildUserResponse().user)
  })

  it('registers without creating a session before email verification', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        buildJsonResponse({
          emailVerificationRequired: true,
          user: {
            createdAt: '2026-05-25T12:00:00.000Z',
            email: 'ana@example.com',
            id: 'user-1',
            name: 'Ana Souza',
            role: 'manifestant',
          },
        }),
      ),
    )
    const service = new HttpAuthService()

    await service.signUp({ email: 'ana@example.com', name: 'Ana Souza', password: 'Senha1234' })

    expect(getFetchCall(0)[0]).toBe(`${apiBaseUrl}/users`)
    expect(vi.mocked(fetch).mock.calls).toHaveLength(1)
  })

  it('confirms email verification, persists the token and returns the hydrated /me session', async () => {
    const token = buildToken({ role: 'manifestant', sub: 'user-1' })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(buildJsonResponse({ token }))
        .mockResolvedValueOnce(
          buildJsonResponse({
            user: {
              attendanceRating: null,
              createdAt: '2026-05-25T12:00:00.000Z',
              email: 'ana@example.com',
              id: 'user-1',
              name: 'Ana Souza',
              role: 'manifestant',
            },
          }),
        ),
    )
    const service = new HttpAuthService()

    const session = await service.confirmEmailVerification({ code: '123456', email: 'ana@example.com' })

    expect(getFetchCall(0)[0]).toBe(`${apiBaseUrl}/email-verification/confirm`)
    expect(getFetchCall(1)[0]).toBe(`${apiBaseUrl}/me`)
    expect(session.user.attendanceRating).toBeNull()
    expect(session.user.name).toBe('Ana Souza')
  })
})
