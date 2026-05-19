import type { AuthService } from '../../application/auth/auth-service'
import type { AuthSession, SignInCredentials } from '../../application/auth/auth-types'

const mockSessionStorageKey = 'ouvidoria-uespi-auth-session'

const mockSession: AuthSession = {
  token: 'mock-session-token',
  user: {
    email: 'exemplo@uespi.br',
    id: 'mock-user-1',
    name: 'Manifestante UESPI',
    role: 'manifestant',
  },
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email ou senha inválidos.')
    this.name = 'InvalidCredentialsError'
  }
}

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const session = value as Partial<AuthSession>
  const user = session.user as Partial<AuthSession['user']> | undefined

  return (
    typeof session.token === 'string' &&
    typeof user?.email === 'string' &&
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.role === 'string'
  )
}

export class MockAuthService implements AuthService {
  async getSession(): Promise<AuthSession | null> {
    const storedSession = window.sessionStorage.getItem(mockSessionStorageKey)

    if (storedSession === null) {
      return null
    }

    try {
      const parsedSession: unknown = JSON.parse(storedSession)
      return isAuthSession(parsedSession) ? parsedSession : null
    } catch {
      return null
    }
  }

  async signIn(credentials: SignInCredentials): Promise<AuthSession> {
    if (credentials.email !== mockSession.user.email || credentials.password !== '123456') {
      throw new InvalidCredentialsError()
    }

    window.sessionStorage.setItem(mockSessionStorageKey, JSON.stringify(mockSession))
    return mockSession
  }

  async signOut(): Promise<void> {
    window.sessionStorage.removeItem(mockSessionStorageKey)
  }
}
