import type { PrismaClient } from '@prisma/client'

import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import type { User } from '#src/domain/entities/user.js'

import { userMapper } from '../mappers/user.mapper.js'

export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(userId: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id: userId } })
    return record === null ? null : userMapper.toDomain(record)
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } })
    return record === null ? null : userMapper.toDomain(record)
  }

  async save(user: User): Promise<void> {
    const data = userMapper.toPersistence(user)
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        emailVerifiedAt: data.emailVerifiedAt,
        emailVerificationCodeHash: data.emailVerificationCodeHash,
        emailVerificationCodeExpiresAt: data.emailVerificationCodeExpiresAt,
        passwordResetCodeHash: data.passwordResetCodeHash,
        passwordResetCodeExpiresAt: data.passwordResetCodeExpiresAt,
      },
    })
  }
}
