import type { PrismaClient } from '@prisma/client'

import type { AiCatalogItem } from '#src/application/ai/ai-gateway.js'

import type { CampusCatalogProvider } from '#src/application/ai/ai-catalog-providers.js'

export class PrismaCampusCatalogProvider implements CampusCatalogProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<AiCatalogItem[]> {
    const campuses = await this.prisma.campus.findMany({
      orderBy: { name: 'asc' },
    })

    return campuses.map((campus) => ({
      id: campus.id,
      label: campus.name,
    }))
  }
}
