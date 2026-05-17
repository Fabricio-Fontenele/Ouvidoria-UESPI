export type AuthenticatedUserRole = 'admin' | 'manifestant' | 'ombudsman'

export interface AuthenticatedUser {
  email: string
  id: string
  name: string
  role: AuthenticatedUserRole
}

export interface AuthSession {
  token: string
  user: AuthenticatedUser
}

export interface SignInCredentials {
  email: string
  password: string
}
