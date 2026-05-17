import {
  buildAttachmentStorageKey,
  sanitizeAttachmentOriginalName,
  type AttachmentUploadFile,
  MAX_ATTACHMENTS_PER_MANIFESTATION,
} from '#src/application/attachments/attachment-policy.js'
import type { ManifestationAttachmentsRepository } from '#src/application/repositories/manifestation-attachments-repository.js'
import type { AttachmentStorage } from '#src/application/storage/attachment-storage.js'
import type { ManifestationAttachmentUploadedByType } from '#src/domain/entities/manifestation-attachment.js'
import { ManifestationAttachment } from '#src/domain/entities/manifestation-attachment.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import { ManifestationAttachmentsLimitExceededError } from './errors/manifestation-attachments-limit-exceeded-error.js'
import { toManifestationAttachmentDTO } from './manifestation-attachment-dto.js'

interface PersistManifestationAttachmentParams {
  manifestationId: string
  file: AttachmentUploadFile
  uploadedByType: ManifestationAttachmentUploadedByType
  uploadedByUserId: string | null
  manifestationAttachmentsRepository: ManifestationAttachmentsRepository
  attachmentStorage: AttachmentStorage
}

export async function persistManifestationAttachment({
  manifestationId,
  file,
  uploadedByType,
  uploadedByUserId,
  manifestationAttachmentsRepository,
  attachmentStorage,
}: PersistManifestationAttachmentParams) {
  const attachmentId = new UniqueEntityId()
  const storageKey = buildAttachmentStorageKey(manifestationId, attachmentId)
  const attachment = ManifestationAttachment.create(
    {
      manifestationId: new UniqueEntityId(manifestationId),
      storageKey,
      originalName: sanitizeAttachmentOriginalName(file.originalName),
      mimeType: file.mimeType,
      sizeInBytes: file.sizeInBytes,
      uploadedByType,
      uploadedByUserId: uploadedByUserId === null ? null : new UniqueEntityId(uploadedByUserId),
    },
    attachmentId,
  )

  await attachmentStorage.upload({
    storageKey,
    mimeType: attachment.mimeType,
    content: file.content,
  })

  try {
    await manifestationAttachmentsRepository.save(attachment, MAX_ATTACHMENTS_PER_MANIFESTATION)
  } catch (error) {
    try {
      await attachmentStorage.delete(storageKey)
    } catch {
      // Keep the original persistence error as the observable failure.
    }

    if (error instanceof ManifestationAttachmentsLimitExceededError) {
      throw new ManifestationAttachmentsLimitExceededError()
    }

    throw error
  }

  return {
    attachment: toManifestationAttachmentDTO(attachment),
  }
}
