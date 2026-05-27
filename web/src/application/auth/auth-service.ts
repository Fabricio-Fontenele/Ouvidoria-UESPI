import type {
  AuthSession,
  EmailVerificationCredentials,
  PasswordResetCodeCredentials,
  ResetPasswordCredentials,
  SignInCredentials,
  SignUpCredentials,
} from './auth-types'

export interface AuthService {
  confirmPasswordResetCode(credentials: PasswordResetCodeCredentials): Promise<void>
  confirmEmailVerification(credentials: EmailVerificationCredentials): Promise<AuthSession>
  getSession(): Promise<AuthSession | null>
  requestPasswordReset(email: string): Promise<void>
  resendEmailVerificationCode(email: string): Promise<void>
  resetPassword(credentials: ResetPasswordCredentials): Promise<AuthSession>
  signIn(credentials: SignInCredentials): Promise<AuthSession>
  signUp(credentials: SignUpCredentials): Promise<void>
  signOut(): Promise<void>
}
