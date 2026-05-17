import type { ManifestationAttachmentDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationAttachment } from '#src/domain/entities/manifestation-attachment.js'
import { ManifestationAttachmentUploadedByType } from '#src/domain/entities/manifestation-attachment.js'

const uploadedByTypeMap = {
  [ManifestationAttachmentUploadedByType.MANIFESTANT]: 'manifestant',
  [ManifestationAttachmentUploadedByType.ANONYMOUS_MANIFESTANT]: 'anonymous_manifestant',
  [ManifestationAttachmentUploadedByType.OMBUDSMAN]: 'ombudsman',
  [ManifestationAttachmentUploadedByType.ADMIN]: 'admin',
} as const

export function toManifestationAttachmentDTO(attachment: ManifestationAttachment): ManifestationAttachmentDTO {
  return {
    id: attachment.id.toString(),
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeInBytes: attachment.sizeInBytes,
    uploadedByType: uploadedByTypeMap[attachment.uploadedByType],
    createdAt: attachment.createdAt,
  }
}
