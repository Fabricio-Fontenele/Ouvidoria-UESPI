import type { AuthService } from './auth-service'
import type { AuthSession, SignUpCredentials } from './auth-types'

export class EmptySignUpFieldsError extends Error {
  constructor() {
    super('Informe nome, email e senha para criar a conta.')
    this.name = 'EmptySignUpFieldsError'
  }
}

export class SignUp {
  private readonly authService: AuthService

  constructor(authService: AuthService) {
    this.authService = authService
  }

  async execute(credentials: SignUpCredentials): Promise<AuthSession> {
    const name = credentials.name.trim()
    const email = credentials.email.trim()
    const password = credentials.password.trim()

    if (name.length === 0 || email.length === 0 || password.length === 0) {
      throw new EmptySignUpFieldsError()
    }

    return this.authService.signUp({ name, email, password })
  }
}
