import type { AuthSession, EmailVerificationCredentials, SignInCredentials, SignUpCredentials } from './auth-types'

export interface AuthService {
  confirmEmailVerification(credentials: EmailVerificationCredentials): Promise<AuthSession>
  getSession(): Promise<AuthSession | null>
  resendEmailVerificationCode(email: string): Promise<void>
  signIn(credentials: SignInCredentials): Promise<AuthSession>
  signUp(credentials: SignUpCredentials): Promise<void>
  signOut(): Promise<void>
}
