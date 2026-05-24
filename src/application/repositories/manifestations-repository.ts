import type {
  ManifestationDetailsDTO,
  ManifestationListItemDTO,
} from '#src/application/dto/manifestation-query-dtos.js'
import type { Manifestation, ManifestationStatus } from '#src/domain/entities/manifestation.js'

import type { AdminManifestationFilters } from './admin-manifestation-filters.js'
import type { PaginationParams } from './pagination-params.js'

export interface ManifestationsPage {
  manifestations: ManifestationListItemDTO[]
  statusTotals: Record<ManifestationStatus, number>
  totalItems: number
}

export interface ManifestationMetrics {
  statusTotals: Record<ManifestationStatus, number>
  totalItems: number
}

export interface ManifestationsRepository {
  findById(manifestationId: string): Promise<Manifestation | null>
  findByProtocol(protocol: string): Promise<Manifestation | null>
  findDetailsById(manifestationId: string): Promise<ManifestationDetailsDTO | null>
  findManyByAuthorUserId(authorUserId: string, paginationParams: PaginationParams): Promise<ManifestationsPage>
  findManyForAdmin(filters: AdminManifestationFilters, paginationParams: PaginationParams): Promise<ManifestationsPage>
  getMetricsByAuthorUserId(authorUserId: string): Promise<ManifestationMetrics>
  getMetricsForAdmin(filters: AdminManifestationFilters): Promise<ManifestationMetrics>
  save(manifestation: Manifestation): Promise<void>
}
