import type { ManifestationAdministrationRepository } from '#src/application/repositories/manifestation-administration-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '../manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import type { UseCase } from '../use-case.js'

interface FinalizeManifestationInput {
  userId: string
  manifestationId: string
}

interface FinalizeManifestationOutput {
  manifestation: {
    id: string
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    involvedPeople: string | null
    authorUserId: string | null
    createdAt: Date
  }
}

export class FinalizeManifestationUseCase implements UseCase<FinalizeManifestationInput, FinalizeManifestationOutput> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationAdministrationRepository: ManifestationAdministrationRepository,
  ) {}

  async execute({ userId, manifestationId }: FinalizeManifestationInput): Promise<FinalizeManifestationOutput> {
    const requesterId = new UniqueEntityId(userId)
    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (!manifestation) {
      throw new ManifestationNotFoundError()
    }

    if (!manifestation.belongsTo(requesterId)) {
      throw new NotAllowedToAccessManifestationError()
    }

    const previousStatus = manifestation.status
    manifestation.finalizeByAuthor()

    await this.manifestationAdministrationRepository.finalizeByAuthor({
      manifestation,
      actorUserId: userId,
      actorType: ManifestationMessageSenderType.MANIFESTANT,
      fromStatus: previousStatus,
      toStatus: manifestation.status,
    })

    return {
      manifestation: {
        id: manifestation.id.toString(),
        protocol: manifestation.protocol.getValue(),
        type: manifestation.type,
        status: manifestation.status,
        campusId: manifestation.campusId.getValue(),
        administrativeUnitId: manifestation.administrativeUnitId.getValue(),
        description: manifestation.description.getValue(),
        involvedPeople: manifestation.involvedPeople?.getValue() ?? null,
        authorUserId: manifestation.authorUserId?.toString() ?? null,
        createdAt: manifestation.createdAt,
      },
    }
  }
}
