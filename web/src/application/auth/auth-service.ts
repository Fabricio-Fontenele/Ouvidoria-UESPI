import type { AuthSession, SignInCredentials } from './auth-types'

export interface AuthService {
  getSession(): Promise<AuthSession | null>
  signIn(credentials: SignInCredentials): Promise<AuthSession>
  signOut(): Promise<void>
}
