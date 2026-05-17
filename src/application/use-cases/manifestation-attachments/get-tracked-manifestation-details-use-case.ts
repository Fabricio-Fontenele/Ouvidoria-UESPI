import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type {
  ManifestationAttachmentDTO,
  ManifestationDetailsDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import { AnonymousManifestationAccessService } from '../anonymous-manifestation-access/anonymous-manifestation-access-service.js'
import { ManifestationTrackingNotFoundError } from '../anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import type { UseCase } from '../use-case.js'
import { isTrackingVisibleAttachmentDTO } from './public-attachment-visibility.js'

interface GetTrackedManifestationDetailsInput {
  protocol: string
  accessCode: string
}

interface GetTrackedManifestationDetailsOutput {
  manifestation: {
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    createdAt: Date
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
    createdAt: manifestation.createdAt,
    attachments: manifestation.attachments.filter(isTrackingVisibleAttachmentDTO),
  }
}
