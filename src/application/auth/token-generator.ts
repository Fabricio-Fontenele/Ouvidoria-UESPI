import type { UserRole } from '#src/domain/entities/user.js'

export interface AccessTokenPayload {
  sub: string
  role: UserRole
}

export interface TokenGenerator {
  generate(payload: AccessTokenPayload): Promise<string>
}
