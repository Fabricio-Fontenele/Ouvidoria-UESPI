import type { PrismaClient } from '@prisma/client'

import type {
  CatalogAdministrativeUnitRecordDTO,
  CatalogCampusRecordDTO,
  PublicCatalogDTO,
} from '#src/application/dto/catalog-dtos.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublic(): Promise<PublicCatalogDTO> {
    const campuses = await this.prisma.campus.findMany({
      where: {
        isActive: true,
        administrativeUnits: {
          some: {
            isActive: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        city: true,
        administrativeUnits: {
          where: {
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      campuses: campuses.map((campus) => ({
        id: campus.id,
        label: campus.name,
        city: campus.city,
        administrativeUnits: campus.administrativeUnits.map((administrativeUnit) => ({
          id: administrativeUnit.id,
          label: administrativeUnit.name,
        })),
      })),
    }
  }

  async findCampusById(id: string): Promise<CatalogCampusRecordDTO | null> {
    return this.prisma.campus.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        city: true,
        isActive: true,
      },
    })
  }

  async findAdministrativeUnitById(id: string): Promise<CatalogAdministrativeUnitRecordDTO | null> {
    return this.prisma.administrativeUnit.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        campusId: true,
        isActive: true,
      },
    })
  }
}
