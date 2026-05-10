import type { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

import type { PaginationParams } from './pagination-params.js'

export interface ManifestationHistoryEntry {
  description: string
  createdAt: Date
}

export interface ManifestationMessage {
  id: string
  senderUserId: string
  content: string
  createdAt: Date
}

export interface ManifestationDetails {
  id: string
  protocol: string
  type: ManifestationType
  status: ManifestationStatus
  campusId: string
  administrativeUnitId: string
  description: string
  authorUserId: string | null
  createdAt: Date
  history: ManifestationHistoryEntry[]
  messages: ManifestationMessage[]
}

export interface ManifestationsRepository {
  findDetailsById(manifestationId: string): Promise<ManifestationDetails | null>
  findManyByAuthorUserId(authorUserId: string, paginationParams: PaginationParams): Promise<Manifestation[]>
  save(manifestation: Manifestation): Promise<void>
}
