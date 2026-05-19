import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'

import { AnonymousManifestationAccessService } from '../anonymous-manifestation-access/anonymous-manifestation-access-service.js'
import { ManifestationTrackingNotFoundError } from '../anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import type { UseCase } from '../use-case.js'
import { isTrackingVisibleAttachment } from './public-attachment-visibility.js'

interface GetTrackedManifestationAttachmentDownloadUrlInput {
  attachmentId: string
  protocol: string
  accessCode: string
}

interface GetTrackedManifestationAttachmentDownloadUrlOutput {
  downloadUrl: string
}

export class GetTrackedManifestationAttachmentDownloadUrlUseCase implements UseCase<
  GetTrackedManifestationAttachmentDownloadUrlInput,
  GetTrackedManifestationAttachmentDownloadUrlOutput
> {
  private readonly anonymousManifestationAccessService: AnonymousManifestationAccessService

  constructor(
    manifestationsRepository: ManifestationsRepository,
    hashComparer: HashComparer,
    private readonly manifestationAttachmentsRepository: ManifestationAttachmentsRepository,
    private readonly attachmentStorage: AttachmentStorage,
    private readonly signedUrlExpiresInSeconds: number,
  ) {
    this.anonymousManifestationAccessService = new AnonymousManifestationAccessService(
      manifestationsRepository,
      hashComparer,
    )
  }

  async execute({
    attachmentId,
    protocol,
    accessCode,
  }: GetTrackedManifestationAttachmentDownloadUrlInput): Promise<GetTrackedManifestationAttachmentDownloadUrlOutput> {
    const manifestation = await this.anonymousManifestationAccessService.getAuthorizedManifestation({
      protocol,
      accessCode,
    })

    const attachment = await this.manifestationAttachmentsRepository.findById(attachmentId)

    if (
      attachment === null ||
      attachment.manifestationId.toString() !== manifestation.id.toString() ||
      !isTrackingVisibleAttachment(attachment)
    ) {
      throw new ManifestationTrackingNotFoundError()
    }

    const downloadUrl = await this.attachmentStorage.createSignedDownloadUrl(
      attachment.storageKey,
      this.signedUrlExpiresInSeconds,
    )

    return { downloadUrl }
  }
}
