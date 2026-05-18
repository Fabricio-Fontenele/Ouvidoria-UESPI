import type {
  ManifestationAttachment as PrismaManifestationAttachment,
  ManifestationAttachmentUploadedByType as PrismaManifestationAttachmentUploadedByType,
} from '@prisma/client'

import type {
  ManifestationAttachmentDTO,
  ManifestationAttachmentUploadedByTypeDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import {
  ManifestationAttachment,
  ManifestationAttachmentUploadedByType,
} from '#src/domain/entities/manifestation-attachment.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

const uploadedByTypeToDto: Record<ManifestationAttachmentUploadedByType, ManifestationAttachmentUploadedByTypeDTO> = {
  [ManifestationAttachmentUploadedByType.MANIFESTANT]: 'manifestant',
  [ManifestationAttachmentUploadedByType.ANONYMOUS_MANIFESTANT]: 'anonymous_manifestant',
  [ManifestationAttachmentUploadedByType.OMBUDSMAN]: 'ombudsman',
  [ManifestationAttachmentUploadedByType.ADMIN]: 'admin',
}

export const manifestationAttachmentMapper = {
  toDomain(raw: PrismaManifestationAttachment): ManifestationAttachment {
    return ManifestationAttachment.create(
      {
        manifestationId: new UniqueEntityId(raw.manifestationId),
        storageKey: raw.storageKey,
        originalName: raw.originalName,
        mimeType: raw.mimeType,
        sizeInBytes: raw.sizeInBytes,
        uploadedByType: raw.uploadedByType as ManifestationAttachmentUploadedByType,
        uploadedByUserId: raw.uploadedByUserId === null ? null : new UniqueEntityId(raw.uploadedByUserId),
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    )
  },

  toPersistence(attachment: ManifestationAttachment): {
    id: string
    manifestationId: string
    storageKey: string
    originalName: string
    mimeType: string
    sizeInBytes: number
    uploadedByType: PrismaManifestationAttachmentUploadedByType
    uploadedByUserId: string | null
    createdAt: Date
  } {
    return {
      id: attachment.id.toString(),
      manifestationId: attachment.manifestationId.toString(),
      storageKey: attachment.storageKey,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeInBytes: attachment.sizeInBytes,
      uploadedByType: attachment.uploadedByType,
      uploadedByUserId: attachment.uploadedByUserId?.toString() ?? null,
      createdAt: attachment.createdAt,
    }
  },

  toDTO(raw: PrismaManifestationAttachment): ManifestationAttachmentDTO {
    return {
      id: raw.id,
      originalName: raw.originalName,
      mimeType: raw.mimeType,
      sizeInBytes: raw.sizeInBytes,
      uploadedByType: uploadedByTypeToDto[raw.uploadedByType as ManifestationAttachmentUploadedByType],
      createdAt: raw.createdAt,
    }
  },
}
