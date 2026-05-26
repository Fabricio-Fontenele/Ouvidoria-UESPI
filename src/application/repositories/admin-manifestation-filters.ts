import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

export interface AdminManifestationFilters {
  status?: ManifestationStatus
  type?: ManifestationType
  attendantUserId?: string
  campusId?: string
  administrativeUnitId?: string
  from?: Date
  to?: Date
}
