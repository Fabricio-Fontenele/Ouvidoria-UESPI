import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { Manifestation } from '#src/domain/entities/manifestation.js'

import type { UseCase } from '../use-case.js'
import { InvalidPageNumberError } from './errors/invalid-page-number-error.js'

interface ListUserManifestationsInput {
  authorUserId: string
  page: number
}

interface ListUserManifestationsOutput {
  manifestations: Manifestation[]
}

export class ListUserManifestationsUseCase implements UseCase<
  ListUserManifestationsInput,
  ListUserManifestationsOutput
> {
  constructor(private readonly manifestationsRepository: ManifestationsRepository) {}

  async execute({ authorUserId, page }: ListUserManifestationsInput): Promise<ListUserManifestationsOutput> {
    if (page < 1) {
      throw new InvalidPageNumberError()
    }

    const paginationParams = { page }
    const manifestations = await this.manifestationsRepository.findManyByAuthorUserId(authorUserId, paginationParams)

    return { manifestations }
  }
}
