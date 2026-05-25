export type AuthenticatedUserRole = 'admin' | 'manifestant' | 'ombudsman'

export interface AttendanceRatingSummary {
  average: number | null
  count: number
}

export interface AuthenticatedUser {
  attendanceRating: AttendanceRatingSummary | null
  createdAt: string | null
  email: string | null
  id: string
  name: string | null
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

export interface SignUpCredentials {
  email: string
  name: string
  password: string
}
