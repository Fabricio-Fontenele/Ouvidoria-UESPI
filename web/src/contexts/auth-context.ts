import { createContext } from 'react'

import type {
  AuthSession,
  EmailVerificationCredentials,
  SignInCredentials,
  SignUpCredentials,
} from '../application/auth/auth-types'

export interface AuthContextValue {
  confirmEmailVerification(credentials: EmailVerificationCredentials): Promise<boolean>
  error: string | null
  isAuthenticated: boolean
  isLoading: boolean
  resendEmailVerificationCode(email: string): Promise<boolean>
  session: AuthSession | null
  signIn(credentials: SignInCredentials): Promise<boolean>
  signUp(credentials: SignUpCredentials): Promise<boolean>
  signOut(): Promise<void>
  user: AuthSession['user'] | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
