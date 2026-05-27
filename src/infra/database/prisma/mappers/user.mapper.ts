import type { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client'

import { User, type UserRole } from '#src/domain/entities/user.js'
import { Email } from '#src/domain/value-objects/email.js'
import { Name } from '#src/domain/value-objects/name.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

export const userMapper = {
  toDomain(raw: PrismaUser): User {
    return User.create(
      {
        name: Name.create(raw.name),
        email: Email.create(raw.email),
        passwordHash: raw.passwordHash,
        role: raw.role as UserRole,
        emailVerifiedAt: raw.emailVerifiedAt,
        emailVerificationCodeHash: raw.emailVerificationCodeHash,
        emailVerificationCodeExpiresAt: raw.emailVerificationCodeExpiresAt,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    )
  },

  toPersistence(user: User): {
    id: string
    name: string
    email: string
    passwordHash: string
    role: PrismaUserRole
    emailVerifiedAt: Date | null
    emailVerificationCodeHash: string | null
    emailVerificationCodeExpiresAt: Date | null
    createdAt: Date
  } {
    return {
      id: user.id.toString(),
      name: user.name.getValue(),
      email: user.email.getValue(),
      passwordHash: user.passwordHash,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerificationCodeHash: user.emailVerificationCodeHash,
      emailVerificationCodeExpiresAt: user.emailVerificationCodeExpiresAt,
      createdAt: user.createdAt,
    }
  },
}
