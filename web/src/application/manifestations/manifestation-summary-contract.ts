import type { ManifestationStatus } from './manifestation-status-contract'
import type { ManifestationType } from './manifestation-type-contract'

export interface ManifestationSearchContract {
  description: string
  protocol: string
}

export interface ManifestationSummary extends ManifestationSearchContract {
  administrativeUnitId: string
  authorUserId: string | null
  campusId: string
  createdAt: string
  id: string
  status: ManifestationStatus
  type: ManifestationType
}
