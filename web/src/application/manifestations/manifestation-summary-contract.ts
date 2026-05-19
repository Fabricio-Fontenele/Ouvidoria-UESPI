import type { ManifestationStatus } from './manifestation-status-contract'

export interface ManifestationSearchContract {
  area: string
  description: string
  manifestationType: string
  protocol: string
}

export interface ManifestationSummary extends ManifestationSearchContract {
  createdAt: string
  status: ManifestationStatus
  title: string
  updatedAt: string
}
