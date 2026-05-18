import type { ManifestationAttachmentDTO } from '#src/application/dto/manifestation-query-dtos.js'
import {
  ManifestationAttachmentUploadedByType,
  type ManifestationAttachment,
} from '#src/domain/entities/manifestation-attachment.js'

export function isTrackingVisibleAttachment(attachment: ManifestationAttachment): boolean {
  return (
    attachment.uploadedByType === ManifestationAttachmentUploadedByType.MANIFESTANT ||
    attachment.uploadedByType === ManifestationAttachmentUploadedByType.ANONYMOUS_MANIFESTANT
  )
}

export function isTrackingVisibleAttachmentDTO(attachment: ManifestationAttachmentDTO): boolean {
  return attachment.uploadedByType === 'manifestant' || attachment.uploadedByType === 'anonymous_manifestant'
}
