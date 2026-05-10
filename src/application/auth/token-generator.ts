import type { UserRole } from '#src/domain/entities/user.js'
import type { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

export interface AccessTokenPayload {
  sub: UniqueEntityId
  role: UserRole
}

export interface TokenGenerator {
  generate(payload: AccessTokenPayload): Promise<string>
}
