import type { AuthService } from '../../application/auth/auth-service'
import { HttpAuthService } from './http-auth-service'

export function makeAuthService(): AuthService {
  return new HttpAuthService()
}
