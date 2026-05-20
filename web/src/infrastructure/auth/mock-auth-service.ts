import type { AuthService } from '../../application/auth/auth-service'
import type { AuthSession, SignInCredentials } from '../../application/auth/auth-types'

const mockSessionStorageKey = 'ouvidoria-uespi-auth-session'

interface MockAuthAccount {
  password: string
  session: AuthSession
}

const mockAccounts: MockAuthAccount[] = [
  {
    password: '123456',
    session: {
      token: 'mock-manifestant-session-token',
      user: {
        email: 'exemplo@uespi.br',
        id: 'mock-user-1',
        name: 'Manifestante UESPI',
        role: 'manifestant',
      },
    },
  },
  {
    password: 'ouv12345',
    session: {
      token: 'mock-ombudsman-session-token',
      user: {
        email: 'ouvidor@uespi.com.br',
        id: 'mock-ombudsman-1',
        name: 'Ouvidor UESPI',
        role: 'ombudsman',
      },
    },
  },
]

const authRoles: AuthSession['user']['role'][] = ['admin', 'manifestant', 'ombudsman']

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
    authRoles.includes(user.role as AuthSession['user']['role'])
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
    const account = mockAccounts.find(
      (mockAccount) =>
        mockAccount.session.user.email === credentials.email.toLowerCase() &&
        mockAccount.password === credentials.password,
    )

    if (account === undefined) {
      throw new InvalidCredentialsError()
    }

    window.sessionStorage.setItem(mockSessionStorageKey, JSON.stringify(account.session))
    return account.session
  }

  async signOut(): Promise<void> {
    window.sessionStorage.removeItem(mockSessionStorageKey)
  }
}
