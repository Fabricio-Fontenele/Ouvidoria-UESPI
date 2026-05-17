import type { PrismaClient } from '@prisma/client'

import type { AdministrativeUnitCatalogProvider } from '#src/application/ai/ai-catalog-providers.js'
import type { AiAdministrativeUnitCatalogItem } from '#src/application/ai/ai-gateway.js'

export class PrismaAdministrativeUnitCatalogProvider implements AdministrativeUnitCatalogProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<AiAdministrativeUnitCatalogItem[]> {
    const units = await this.prisma.administrativeUnit.findMany({
      orderBy: { name: 'asc' },
    })

    return units.map((unit) => ({
      id: unit.id,
      label: unit.name,
      campusId: unit.campusId,
    }))
  }
}
