import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '../manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import type { UseCase } from '../use-case.js'
import { AttachmentNotFoundError } from './errors/attachment-not-found-error.js'

interface GetManifestationAttachmentDownloadUrlInput {
  manifestationId: string
  attachmentId: string
  requesterUserId: string
}

interface GetManifestationAttachmentDownloadUrlOutput {
  downloadUrl: string
}

export class GetManifestationAttachmentDownloadUrlUseCase implements UseCase<
  GetManifestationAttachmentDownloadUrlInput,
  GetManifestationAttachmentDownloadUrlOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationAttachmentsRepository: ManifestationAttachmentsRepository,
    private readonly attachmentStorage: AttachmentStorage,
    private readonly signedUrlExpiresInSeconds: number,
  ) {}

  async execute({
    manifestationId,
    attachmentId,
    requesterUserId,
  }: GetManifestationAttachmentDownloadUrlInput): Promise<GetManifestationAttachmentDownloadUrlOutput> {
    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (manifestation === null) {
      throw new ManifestationNotFoundError()
    }

    if (!manifestation.belongsTo(new UniqueEntityId(requesterUserId))) {
      throw new NotAllowedToAccessManifestationError()
    }

    const attachment = await this.manifestationAttachmentsRepository.findById(attachmentId)

    if (attachment === null || attachment.manifestationId.toString() !== manifestationId) {
      throw new AttachmentNotFoundError()
    }

    const downloadUrl = await this.attachmentStorage.createSignedDownloadUrl(
      attachment.storageKey,
      this.signedUrlExpiresInSeconds,
    )

    return { downloadUrl }
  }
}
