import type { ManifestationListItemDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import {
  buildManifestationsPaginationMetadata,
  type PaginationMetadata,
} from '#src/application/repositories/pagination-params.js'
import type { ManifestationStatus } from '#src/domain/entities/manifestation.js'

import type { UseCase } from '../use-case.js'
import { InvalidPageNumberError } from './errors/invalid-page-number-error.js'

interface ListUserManifestationsInput {
  userId: string
  page: number
}

interface ListUserManifestationsOutput extends PaginationMetadata {
  manifestations: ManifestationListItemDTO[]
  statusTotals: Record<ManifestationStatus, number>
}

export class ListUserManifestationsUseCase implements UseCase<
  ListUserManifestationsInput,
  ListUserManifestationsOutput
> {
  constructor(private readonly manifestationsRepository: ManifestationsRepository) {}

  async execute({ userId, page }: ListUserManifestationsInput): Promise<ListUserManifestationsOutput> {
    if (page < 1) {
      throw new InvalidPageNumberError()
    }

    const paginationParams = { page }
    const { manifestations, statusTotals, totalItems } = await this.manifestationsRepository.findManyByAuthorUserId(
      userId,
      paginationParams,
    )

    return { manifestations, statusTotals, ...buildManifestationsPaginationMetadata(page, totalItems) }
  }
}
