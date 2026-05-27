import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type {
  ManifestationAttachmentDTO,
  ManifestationDetailsDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import { isTrackingVisibleAttachmentDTO } from './public-attachment-visibility.js'
import { AnonymousManifestationAccessService } from '../anonymous-manifestation-access/anonymous-manifestation-access-service.js'
import { ManifestationTrackingNotFoundError } from '../anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import type { UseCase } from '../use-case.js'

interface GetTrackedManifestationDetailsInput {
  protocol: string
  accessCode: string
}

interface TrackedManifestationMessage {
  id: string
  senderType: ManifestationMessageSenderType
  content: string
  createdAt: Date
}

interface GetTrackedManifestationDetailsOutput {
  manifestation: {
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    forwardedToUnit: { id: string; name: string } | null
    createdAt: Date
    messages: TrackedManifestationMessage[]
    attachments: ManifestationAttachmentDTO[]
  }
}

export class GetTrackedManifestationDetailsUseCase implements UseCase<
  GetTrackedManifestationDetailsInput,
  GetTrackedManifestationDetailsOutput
> {
  private readonly anonymousManifestationAccessService: AnonymousManifestationAccessService

  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    hashComparer: HashComparer,
  ) {
    this.anonymousManifestationAccessService = new AnonymousManifestationAccessService(
      manifestationsRepository,
      hashComparer,
    )
  }

  async execute({
    protocol,
    accessCode,
  }: GetTrackedManifestationDetailsInput): Promise<GetTrackedManifestationDetailsOutput> {
    const manifestation = await this.anonymousManifestationAccessService.getAuthorizedManifestation({
      protocol,
      accessCode,
    })

    const details = await this.manifestationsRepository.findDetailsById(manifestation.id.toString())

    if (details === null) {
      throw new ManifestationTrackingNotFoundError()
    }

    return {
      manifestation: buildTrackedManifestationOutput(details),
    }
  }
}

function buildTrackedManifestationOutput(manifestation: ManifestationDetailsDTO) {
  return {
    protocol: manifestation.protocol,
    type: manifestation.type,
    status: manifestation.status,
    campusId: manifestation.campusId,
    administrativeUnitId: manifestation.administrativeUnitId,
    description: manifestation.description,
    forwardedToUnit: manifestation.forwardedToUnit,
    createdAt: manifestation.createdAt,
    // Internal sender user ids are intentionally dropped — the anonymous tracker only needs to know
    // who is talking (`senderType`), never which internal account answered.
    messages: manifestation.messages.map((message) => ({
      id: message.id,
      senderType: message.senderType,
      content: message.content,
      createdAt: message.createdAt,
    })),
    attachments: manifestation.attachments.filter(isTrackingVisibleAttachmentDTO),
  }
}
