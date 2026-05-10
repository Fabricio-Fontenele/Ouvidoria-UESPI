import type {
  ManifestationHistoryEntry,
  ManifestationMessage,
  ManifestationsRepository,
} from '#src/application/repositories/manifestations-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import type { UseCase } from '../use-case.js'
import { ManifestationNotFoundError } from './errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from './errors/not-allowed-to-access-manifestation-error.js'

interface GetManifestationDetailsInput {
  manifestationId: string
  userId: string
}

interface GetManifestationDetailsOutput {
  manifestation: {
    id: string
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    createdAt: Date
    history: ManifestationHistoryEntry[]
    messages: ManifestationMessage[]
  }
}

export class GetManifestationDetailsUseCase implements UseCase<
  GetManifestationDetailsInput,
  GetManifestationDetailsOutput
> {
  constructor(private readonly manifestationsRepository: ManifestationsRepository) {}

  async execute({ manifestationId, userId }: GetManifestationDetailsInput): Promise<GetManifestationDetailsOutput> {
    const manifestation = await this.manifestationsRepository.findDetailsById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    if (manifestation.authorUserId !== userId) {
      throw new NotAllowedToAccessManifestationError()
    }

    return {
      manifestation: {
        id: manifestation.id,
        protocol: manifestation.protocol,
        type: manifestation.type,
        status: manifestation.status,
        campusId: manifestation.campusId,
        administrativeUnitId: manifestation.administrativeUnitId,
        description: manifestation.description,
        createdAt: manifestation.createdAt,
        history: manifestation.history,
        messages: manifestation.messages,
      },
    }
  }
}
