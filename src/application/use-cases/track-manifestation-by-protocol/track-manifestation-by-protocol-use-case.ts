import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import type { UseCase } from '../use-case.js'
import { ManifestationTrackingNotFoundError } from './errors/manifestation-tracking-not-found-error.js'

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
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly hashComparer: HashComparer,
  ) {}

  async execute({
    protocol,
    accessCode,
  }: TrackManifestationByProtocolInput): Promise<TrackManifestationByProtocolOutput> {
    const normalizedProtocol = protocol.trim()
    const normalizedAccessCode = accessCode.trim()

    if (normalizedProtocol === '' || normalizedAccessCode === '') {
      throw new ManifestationTrackingNotFoundError()
    }

    const manifestation = await this.manifestationsRepository.findByProtocol(normalizedProtocol)

    if (manifestation === null) {
      throw new ManifestationTrackingNotFoundError()
    }

    if (!manifestation.isAnonymous() || manifestation.accessCodeHash === null) {
      throw new ManifestationTrackingNotFoundError()
    }

    const accessCodeMatches = await this.hashComparer.compare(normalizedAccessCode, manifestation.accessCodeHash)

    if (!accessCodeMatches) {
      throw new ManifestationTrackingNotFoundError()
    }

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
