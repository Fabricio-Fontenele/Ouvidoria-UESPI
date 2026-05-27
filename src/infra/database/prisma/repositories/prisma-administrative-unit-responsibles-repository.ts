import type { PrismaClient } from '@prisma/client'

import type { AdministrativeUnitResponsiblesRepository } from '#src/application/repositories/administrative-unit-responsibles-repository.js'
import type { User } from '#src/domain/entities/user.js'

import { userMapper } from '../mappers/user.mapper.js'

export class PrismaAdministrativeUnitResponsiblesRepository implements AdministrativeUnitResponsiblesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUsersByAdministrativeUnitId(administrativeUnitId: string): Promise<User[]> {
    const records = await this.prisma.userAdministrativeUnit.findMany({
      where: { administrativeUnitId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    })

    return records.map((record) => userMapper.toDomain(record.user))
  }

  async findAdministrativeUnitIdsByUserId(userId: string): Promise<string[]> {
    const records = await this.prisma.userAdministrativeUnit.findMany({
      where: { userId },
      orderBy: { administrativeUnitId: 'asc' },
      select: { administrativeUnitId: true },
    })

    return records.map((record) => record.administrativeUnitId)
  }

  async saveResponsible(userId: string, administrativeUnitId: string): Promise<void> {
    await this.prisma.userAdministrativeUnit.upsert({
      where: {
        userId_administrativeUnitId: {
          userId,
          administrativeUnitId,
        },
      },
      create: {
        userId,
        administrativeUnitId,
      },
      update: {},
    })
  }

  async removeResponsible(userId: string, administrativeUnitId: string): Promise<void> {
    await this.prisma.userAdministrativeUnit.deleteMany({
      where: {
        userId,
        administrativeUnitId,
      },
    })
  }
}
