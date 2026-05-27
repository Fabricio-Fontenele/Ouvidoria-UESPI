import { createContext } from 'react'

import type {
  AuthSession,
  EmailVerificationCredentials,
  PasswordResetCodeCredentials,
  ResetPasswordCredentials,
  SignInCredentials,
  SignUpCredentials,
} from '../application/auth/auth-types'

export interface AuthContextValue {
  confirmPasswordResetCode(credentials: PasswordResetCodeCredentials): Promise<boolean>
  confirmEmailVerification(credentials: EmailVerificationCredentials): Promise<boolean>
  error: string | null
  isAuthenticated: boolean
  isLoading: boolean
  requestPasswordReset(email: string): Promise<boolean>
  resendEmailVerificationCode(email: string): Promise<boolean>
  resetPassword(credentials: ResetPasswordCredentials): Promise<boolean>
  session: AuthSession | null
  signIn(credentials: SignInCredentials): Promise<boolean>
  signUp(credentials: SignUpCredentials): Promise<boolean>
  signOut(): Promise<void>
  user: AuthSession['user'] | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
