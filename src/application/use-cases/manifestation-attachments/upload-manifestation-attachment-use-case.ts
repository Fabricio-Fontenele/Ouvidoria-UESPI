import {
  detectAttachmentMimeType,
  isAllowedAttachmentMimeType,
  MAX_ATTACHMENTS_PER_MANIFESTATION,
  MAX_ATTACHMENT_SIZE_IN_BYTES,
  normalizeAttachmentMimeType,
  type AttachmentUploadFile,
} from '#src/application/attachments/attachment-policy.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import { ManifestationAttachmentUploadedByType } from '#src/domain/entities/manifestation-attachment.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationNotFoundError } from '../manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '../manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import type { UseCase } from '../use-case.js'
import { AttachmentFileEmptyError } from './errors/attachment-file-empty-error.js'
import { AttachmentFileTooLargeError } from './errors/attachment-file-too-large-error.js'
import { AttachmentMimeTypeNotAllowedError } from './errors/attachment-mime-type-not-allowed-error.js'
import { ManifestationAttachmentsLimitExceededError } from './errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from './errors/manifestation-cannot-receive-attachments-error.js'
import { persistManifestationAttachment } from './persist-manifestation-attachment.js'

interface UploadManifestationAttachmentInput {
  manifestationId: string
  requesterUserId: string
  file: AttachmentUploadFile
}

type UploadManifestationAttachmentOutput = Awaited<ReturnType<typeof persistManifestationAttachment>>

export class UploadManifestationAttachmentUseCase implements UseCase<
  UploadManifestationAttachmentInput,
  UploadManifestationAttachmentOutput
> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly manifestationAttachmentsRepository: ManifestationAttachmentsRepository,
    private readonly attachmentStorage: AttachmentStorage,
  ) {}

  async execute({
    manifestationId,
    requesterUserId,
    file,
  }: UploadManifestationAttachmentInput): Promise<UploadManifestationAttachmentOutput> {
    const normalizedFile = await validateAttachmentFile(file)

    const manifestation = await this.manifestationsRepository.findById(manifestationId)

    if (manifestation === null) {
      throw new ManifestationNotFoundError()
    }

    if (!manifestation.belongsTo(new UniqueEntityId(requesterUserId))) {
      throw new NotAllowedToAccessManifestationError()
    }

    if (!manifestation.canReceiveMessages()) {
      throw new ManifestationCannotReceiveAttachmentsError()
    }

    const currentAttachmentsCount =
      await this.manifestationAttachmentsRepository.countByManifestationId(manifestationId)

    if (currentAttachmentsCount >= MAX_ATTACHMENTS_PER_MANIFESTATION) {
      throw new ManifestationAttachmentsLimitExceededError()
    }

    return persistManifestationAttachment({
      manifestationId,
      file: normalizedFile,
      uploadedByType: ManifestationAttachmentUploadedByType.MANIFESTANT,
      uploadedByUserId: requesterUserId,
      manifestationAttachmentsRepository: this.manifestationAttachmentsRepository,
      attachmentStorage: this.attachmentStorage,
    })
  }
}

export async function validateAttachmentFile(file: AttachmentUploadFile): Promise<AttachmentUploadFile> {
  if (file.sizeInBytes <= 0) {
    throw new AttachmentFileEmptyError()
  }

  if (file.sizeInBytes > MAX_ATTACHMENT_SIZE_IN_BYTES) {
    throw new AttachmentFileTooLargeError()
  }

  const normalizedMimeType = normalizeAttachmentMimeType(file.mimeType)

  if (!isAllowedAttachmentMimeType(normalizedMimeType)) {
    throw new AttachmentMimeTypeNotAllowedError()
  }

  const detectedMimeType = await detectAttachmentMimeType(file.content)

  if (
    detectedMimeType === null ||
    detectedMimeType !== normalizedMimeType ||
    !isAllowedAttachmentMimeType(detectedMimeType)
  ) {
    throw new AttachmentMimeTypeNotAllowedError()
  }

  return {
    ...file,
    mimeType: detectedMimeType,
  }
}
