import type {
  ManifestationAttachmentDTO,
  ManifestationHistoryEntryDTO,
  ManifestationMessageDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import type { UseCase } from '../use-case.js'

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
    involvedPeople: string | null
    attendantUserId: string | null
    forwardedToUnit: { id: string; name: string } | null
    createdAt: Date
    history: ManifestationHistoryEntryDTO[]
    messages: ManifestationMessageDTO[]
    attachments: ManifestationAttachmentDTO[]
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
        involvedPeople: manifestation.involvedPeople,
        attendantUserId: manifestation.attendantUserId,
        forwardedToUnit: manifestation.forwardedToUnit,
        createdAt: manifestation.createdAt,
        history: manifestation.history,
        messages: manifestation.messages,
        attachments: manifestation.attachments,
      },
    }
  }
}
