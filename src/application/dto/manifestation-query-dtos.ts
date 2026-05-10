import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

export interface ManifestationHistoryEntryDTO {
  description: string
  createdAt: Date
}

export interface ManifestationMessageDTO {
  id: string
  senderUserId: string
  content: string
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
  authorUserId: string | null
  createdAt: Date
  history: ManifestationHistoryEntryDTO[]
  messages: ManifestationMessageDTO[]
}
