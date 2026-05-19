import type { PublicCatalogDTO } from '#src/application/dto/catalog-dtos.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'

import type { UseCase } from '../use-case.js'

type ListCatalogInput = undefined

export class ListCatalogUseCase implements UseCase<ListCatalogInput, PublicCatalogDTO> {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async execute(_input?: ListCatalogInput): Promise<PublicCatalogDTO> {
    return this.catalogRepository.listPublic()
  }
}
