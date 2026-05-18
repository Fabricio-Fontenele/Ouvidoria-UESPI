import {
  MAX_ATTACHMENTS_PER_MANIFESTATION,
  type AttachmentUploadFile,
} from '#src/application/attachments/attachment-policy.js'
import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationAttachmentUploadedByType } from '#src/domain/entities/manifestation-attachment.js'

import { AnonymousManifestationAccessService } from '../anonymous-manifestation-access/anonymous-manifestation-access-service.js'
import type { UseCase } from '../use-case.js'
import { ManifestationAttachmentsLimitExceededError } from './errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from './errors/manifestation-cannot-receive-attachments-error.js'
import { persistManifestationAttachment } from './persist-manifestation-attachment.js'
import { validateAttachmentFile } from './upload-manifestation-attachment-use-case.js'

interface UploadAnonymousManifestationAttachmentInput {
  protocol: string
  accessCode: string
  file: AttachmentUploadFile
}

type UploadAnonymousManifestationAttachmentOutput = Awaited<ReturnType<typeof persistManifestationAttachment>>

export class UploadAnonymousManifestationAttachmentUseCase implements UseCase<
  UploadAnonymousManifestationAttachmentInput,
  UploadAnonymousManifestationAttachmentOutput
> {
  private readonly anonymousManifestationAccessService: AnonymousManifestationAccessService

  constructor(
    manifestationsRepository: ManifestationsRepository,
    hashComparer: HashComparer,
    private readonly manifestationAttachmentsRepository: ManifestationAttachmentsRepository,
    private readonly attachmentStorage: AttachmentStorage,
  ) {
    this.anonymousManifestationAccessService = new AnonymousManifestationAccessService(
      manifestationsRepository,
      hashComparer,
    )
  }

  async execute({
    protocol,
    accessCode,
    file,
  }: UploadAnonymousManifestationAttachmentInput): Promise<UploadAnonymousManifestationAttachmentOutput> {
    const normalizedFile = await validateAttachmentFile(file)

    const manifestation = await this.anonymousManifestationAccessService.getAuthorizedManifestation({
      protocol,
      accessCode,
    })

    if (!manifestation.canReceiveMessages()) {
      throw new ManifestationCannotReceiveAttachmentsError()
    }

    const manifestationId = manifestation.id.toString()
    const currentAttachmentsCount =
      await this.manifestationAttachmentsRepository.countByManifestationId(manifestationId)

    if (currentAttachmentsCount >= MAX_ATTACHMENTS_PER_MANIFESTATION) {
      throw new ManifestationAttachmentsLimitExceededError()
    }

    return persistManifestationAttachment({
      manifestationId,
      file: normalizedFile,
      uploadedByType: ManifestationAttachmentUploadedByType.ANONYMOUS_MANIFESTANT,
      uploadedByUserId: null,
      manifestationAttachmentsRepository: this.manifestationAttachmentsRepository,
      attachmentStorage: this.attachmentStorage,
    })
  }
}
