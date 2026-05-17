import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { Manifestation } from '#src/domain/entities/manifestation.js'

import { ManifestationTrackingNotFoundError } from './errors/manifestation-tracking-not-found-error.js'

interface AnonymousManifestationAccessInput {
  protocol: string
  accessCode: string
}

export class AnonymousManifestationAccessService {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly hashComparer: HashComparer,
  ) {}

  async getAuthorizedManifestation({
    protocol,
    accessCode,
  }: AnonymousManifestationAccessInput): Promise<Manifestation> {
    const normalizedProtocol = protocol.trim()
    const normalizedAccessCode = accessCode.trim()

    if (normalizedProtocol === '' || normalizedAccessCode === '') {
      throw new ManifestationTrackingNotFoundError()
    }

    const manifestation = await this.manifestationsRepository.findByProtocol(normalizedProtocol)

    if (manifestation === null || !manifestation.isAnonymous() || manifestation.accessCodeHash === null) {
      throw new ManifestationTrackingNotFoundError()
    }

    const accessCodeMatches = await this.hashComparer.compare(normalizedAccessCode, manifestation.accessCodeHash)

    if (!accessCodeMatches) {
      throw new ManifestationTrackingNotFoundError()
    }

    return manifestation
  }
}
