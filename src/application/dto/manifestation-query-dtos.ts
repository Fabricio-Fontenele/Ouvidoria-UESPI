import type { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

export type ManifestationHistoryEntryType =
  | 'registered'
  | 'administrative_answered'
  | 'status_changed'
  | 'finalized_by_author'
  | 'evaluation_recorded'

export type ManifestationAttachmentUploadedByTypeDTO = 'manifestant' | 'anonymous_manifestant' | 'ombudsman' | 'admin'

export interface ManifestationListItemDTO {
  id: string
  protocol: string
  type: ManifestationType
  status: ManifestationStatus
  campusId: string
  administrativeUnitId: string
  description: string
  authorUserId: string | null
  createdAt: Date
}

export interface ManifestationHistoryEntryDTO {
  type: ManifestationHistoryEntryType
  description: string
  actorUserId: string | null
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus | null
  toStatus: ManifestationStatus | null
  rating: number | null
  attendantUserId: string | null
  createdAt: Date
}

export interface ManifestationMessageDTO {
  id: string
  senderUserId: string | null
  senderType: ManifestationMessageSenderType
  content: string
  createdAt: Date
}

export interface ManifestationAttachmentDTO {
  id: string
  originalName: string
  mimeType: string
  sizeInBytes: number
  uploadedByType: ManifestationAttachmentUploadedByTypeDTO
  createdAt: Date
}

export interface ManifestationDetailsDTO {
  id: string
  protocol: string
  type: ManifestationType
  status: ManifestationStatus
  campusId: string
  administrativeUnitId: string
  description: string
  involvedPeople: string | null
  authorUserId: string | null
  attendantUserId: string | null
  createdAt: Date
  history: ManifestationHistoryEntryDTO[]
  messages: ManifestationMessageDTO[]
  attachments: ManifestationAttachmentDTO[]
}
