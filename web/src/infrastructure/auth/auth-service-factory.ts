import type { AuthService } from '../../application/auth/auth-service'
import { MockAuthService } from './mock-auth-service'

export function makeAuthService(): AuthService {
  return new MockAuthService()
}
