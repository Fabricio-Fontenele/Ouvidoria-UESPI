import type { AuthService } from './auth-service'
import type { AuthSession, SignInCredentials } from './auth-types'

export class EmptyCredentialsError extends Error {
  constructor() {
    super('Informe email e senha para entrar.')
    this.name = 'EmptyCredentialsError'
  }
}

export class SignIn {
  private readonly authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  async execute(credentials: SignInCredentials): Promise<AuthSession> {
    const email = credentials.email.trim()
    const password = credentials.password.trim()

    if (email.length === 0 || password.length === 0) {
      throw new EmptyCredentialsError()
    }

    return this.authService.signIn({ email, password })
  }
}
