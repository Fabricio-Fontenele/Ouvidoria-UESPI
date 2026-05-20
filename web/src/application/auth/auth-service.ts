import type { AuthSession, SignInCredentials, SignUpCredentials } from './auth-types'

export interface AuthService {
  getSession(): Promise<AuthSession | null>
  signIn(credentials: SignInCredentials): Promise<AuthSession>
  signUp(credentials: SignUpCredentials): Promise<AuthSession>
  signOut(): Promise<void>
}
