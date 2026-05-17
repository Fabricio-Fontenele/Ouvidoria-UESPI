import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import { AnonymousManifestationAccessService } from '../anonymous-manifestation-access/anonymous-manifestation-access-service.js'
import type { UseCase } from '../use-case.js'

interface TrackManifestationByProtocolInput {
  protocol: string
  accessCode: string
}

interface TrackManifestationByProtocolOutput {
  manifestation: {
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    createdAt: Date
  }
}

export class TrackManifestationByProtocolUseCase implements UseCase<
  TrackManifestationByProtocolInput,
  TrackManifestationByProtocolOutput
> {
  private readonly anonymousManifestationAccessService: AnonymousManifestationAccessService

  constructor(manifestationsRepository: ManifestationsRepository, hashComparer: HashComparer) {
    this.anonymousManifestationAccessService = new AnonymousManifestationAccessService(
      manifestationsRepository,
      hashComparer,
    )
  }

  async execute({
    protocol,
    accessCode,
  }: TrackManifestationByProtocolInput): Promise<TrackManifestationByProtocolOutput> {
    const manifestation = await this.anonymousManifestationAccessService.getAuthorizedManifestation({
      protocol,
      accessCode,
    })

    return {
      manifestation: {
        protocol: manifestation.protocol.getValue(),
        type: manifestation.type,
        status: manifestation.status,
        campusId: manifestation.campusId.getValue(),
        administrativeUnitId: manifestation.administrativeUnitId.getValue(),
        createdAt: manifestation.createdAt,
      },
    }
  }
}
