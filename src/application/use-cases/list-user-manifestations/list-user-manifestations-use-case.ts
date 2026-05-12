import type { ManifestationListItemDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'

import type { UseCase } from '../use-case.js'
import { InvalidPageNumberError } from './errors/invalid-page-number-error.js'

interface ListUserManifestationsInput {
  userId: string
  page: number
}

interface ListUserManifestationsOutput {
  manifestations: ManifestationListItemDTO[]
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
    const manifestations = await this.manifestationsRepository.findManyByAuthorUserId(userId, paginationParams)

    return { manifestations }
  }
}
