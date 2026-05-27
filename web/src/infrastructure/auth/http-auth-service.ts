import type { AuthService } from '../../application/auth/auth-service'
import type {
  AttendanceRatingSummary,
  AuthenticatedUserRole,
  AuthSession,
  EmailVerificationCredentials,
  SignInCredentials,
  SignUpCredentials,
} from '../../application/auth/auth-types'
import { apiFetch } from '../http/api-client'
import { isApiError } from '../http/api-error'
import { clearAuthToken, getAuthToken, setAuthToken } from '../http/auth-token-storage'

interface SessionResponse {
  token: string
}

interface CurrentUserResponse {
  user: {
    attendanceRating: AttendanceRatingSummary | null
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
      attendanceRating: null,
      createdAt: null,
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

    if (buildSessionFromToken(token, null) === null) {
      clearAuthToken()
      return null
    }

    try {
      const response = await apiFetch<CurrentUserResponse>('/me')

      return {
        token,
        user: response.user,
      }
    } catch (error) {
      if (isApiError(error, 'UnauthenticatedError') || isApiError(error, 'UserNotFoundError')) {
        clearAuthToken()
        return null
      }

      throw error
    }
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    const response = await apiFetch<SessionResponse>('/sessions', {
      auth: 'none',
      body: { email: credentials.email, password: credentials.password },
      method: 'POST',
    })

    if (buildSessionFromToken(response.token, credentials.email) === null) {
      throw new Error('Token retornado pelo servidor não pôde ser interpretado.')
    }

    setAuthToken(response.token)
    const session = await this.getSession()

    if (session === null) {
      throw new Error('Não foi possível carregar os dados do usuário autenticado.')
    }

    return session
  }

  async signUp(credentials: SignUpCredentials): Promise<void> {
    await apiFetch('/users', {
      auth: 'none',
      body: { email: credentials.email, name: credentials.name, password: credentials.password },
      method: 'POST',
    })
  }

  async confirmEmailVerification(credentials: EmailVerificationCredentials): Promise<AuthSession> {
    const sessionResponse = await apiFetch<SessionResponse>('/email-verification/confirm', {
      auth: 'none',
      body: { code: credentials.code, email: credentials.email },
      method: 'POST',
    })

    setAuthToken(sessionResponse.token)
    const session = await this.getSession()

    if (session === null) {
      throw new Error('Não foi possível carregar os dados do usuário autenticado.')
    }

    return session
  }

  async resendEmailVerificationCode(email: string): Promise<void> {
    await apiFetch('/email-verification/codes', {
      auth: 'none',
      body: { email },
      method: 'POST',
    })
  }

  async signOut(): Promise<void> {
    clearAuthToken()
  }
}
