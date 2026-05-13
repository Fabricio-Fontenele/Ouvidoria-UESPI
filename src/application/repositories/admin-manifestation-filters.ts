import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

export interface AdminManifestationFilters {
  status?: ManifestationStatus
  type?: ManifestationType
  campusId?: string
  administrativeUnitId?: string
  from?: Date
  to?: Date
}
