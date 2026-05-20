import type { AuthService } from '../../application/auth/auth-service'
import type {
  AuthenticatedUserRole,
  AuthSession,
  SignInCredentials,
  SignUpCredentials,
} from '../../application/auth/auth-types'
import { apiFetch } from '../http/api-client'
import { clearAuthToken, getAuthToken, setAuthToken } from '../http/auth-token-storage'

interface SessionResponse {
  token: string
}

interface UserResponse {
  user: {
    createdAt: string
    email: string
    id: string
    name: string
    role: AuthenticatedUserRole
  }
}

const authRoles: AuthenticatedUserRole[] = ['admin', 'manifestant', 'ombudsman']

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split('.')

  if (segments.length !== 3) {
    return null
  }

  const payloadSegment = segments[1]

  if (payloadSegment === undefined || payloadSegment.length === 0) {
    return null
  }

  try {
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
    const decoded = window.atob(normalized + padding)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

function buildSessionFromToken(token: string, fallbackEmail: string | null): AuthSession | null {
  const payload = decodeJwtPayload(token)

  if (payload === null) {
    return null
  }

  const sub = payload['sub']
  const role = payload['role']

  if (typeof sub !== 'string' || sub.length === 0) {
    return null
  }

  if (typeof role !== 'string' || !authRoles.includes(role as AuthenticatedUserRole)) {
    return null
  }

  return {
    token,
    user: {
      email: fallbackEmail,
      id: sub,
      name: null,
      role: role as AuthenticatedUserRole,
    },
  }
}

export class HttpAuthService implements AuthService {
  async getSession(): Promise<AuthSession | null> {
    const token = getAuthToken()

    if (token === null) {
      return null
    }

    const session = buildSessionFromToken(token, null)

    if (session === null) {
      clearAuthToken()
      return null
    }

    return session
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    const response = await apiFetch<SessionResponse>('/sessions', {
      auth: 'none',
      body: { email: credentials.email, password: credentials.password },
      method: 'POST',
    })

    const session = buildSessionFromToken(response.token, credentials.email)

    if (session === null) {
      throw new Error('Token retornado pelo servidor não pôde ser interpretado.')
    }

    setAuthToken(response.token)
    return session
  }

  async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
    const createdUser = await apiFetch<UserResponse>('/users', {
      auth: 'none',
      body: { email: credentials.email, name: credentials.name, password: credentials.password },
      method: 'POST',
    })

    const sessionResponse = await apiFetch<SessionResponse>('/sessions', {
      auth: 'none',
      body: { email: credentials.email, password: credentials.password },
      method: 'POST',
    })

    const session: AuthSession = {
      token: sessionResponse.token,
      user: {
        email: createdUser.user.email,
        id: createdUser.user.id,
        name: createdUser.user.name,
        role: createdUser.user.role,
      },
    }

    setAuthToken(sessionResponse.token)
    return session
  }

  async signOut(): Promise<void> {
    clearAuthToken()
  }
}
