import type { ManifestationAttachment } from '#src/domain/entities/manifestation-attachment.js'

export interface ManifestationAttachmentsRepository {
  countByManifestationId(manifestationId: string): Promise<number>
  findById(attachmentId: string): Promise<ManifestationAttachment | null>
  save(attachment: ManifestationAttachment, maxAttachmentsPerManifestation: number): Promise<void>
}
