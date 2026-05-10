import type { ManifestationDetailsDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { Manifestation } from '#src/domain/entities/manifestation.js'

import type { PaginationParams } from './pagination-params.js'

export interface ManifestationsRepository {
  findDetailsById(manifestationId: string): Promise<ManifestationDetailsDTO | null>
  findManyByAuthorUserId(authorUserId: string, paginationParams: PaginationParams): Promise<Manifestation[]>
  save(manifestation: Manifestation): Promise<void>
}
