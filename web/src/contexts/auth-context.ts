import { createContext } from 'react'

import type { AuthSession, SignInCredentials } from '../application/auth/auth-types'

export interface AuthContextValue {
  error: string | null
  isAuthenticated: boolean
  isLoading: boolean
  session: AuthSession | null
  signIn(credentials: SignInCredentials): Promise<boolean>
  signOut(): Promise<void>
  user: AuthSession['user'] | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
