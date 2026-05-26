import type { ManifestationDetail } from '../manifestations/manifestation-detail-contract'
import type { ManifestationStatus } from '../manifestations/manifestation-status-contract'
import type { ManifestationStatusTotals } from '../manifestations/manifestation-status-contract'
import type { ManifestationSummary } from '../manifestations/manifestation-summary-contract'
import type { ManifestationType } from '../manifestations/manifestation-type-contract'
import type { PaginationMeta } from '../pagination/pagination-contract'

import type { CancellationReason } from './cancellation-reasons'

export interface OmbudsmanListFilters {
  administrativeUnitId?: string
  campusId?: string
  from?: string
  onlyMine?: boolean
  page?: number
  status?: ManifestationStatus
  to?: string
  type?: ManifestationType
}

export interface OmbudsmanListResult extends PaginationMeta {
  manifestations: ManifestationSummary[]
  statusTotals: ManifestationStatusTotals
}

export interface OmbudsmanMetricsResult {
  statusTotals: ManifestationStatusTotals
  totalItems: number
}

// Cancelamento tem fluxo próprio (cancel) com motivo obrigatório; o updateStatus genérico
// cobre apenas a finalização administrativa.
export type OmbudsmanStatusChange = 'finalized'

export interface AnswerManifestationInput {
  content: string
  manifestationId: string
}

export interface UpdateManifestationStatusInput {
  manifestationId: string
  status: OmbudsmanStatusChange
}

export interface CancelManifestationInput {
  manifestationId: string
  note?: string
  reason: CancellationReason
}

export interface GetAdminAttachmentDownloadUrlInput {
  attachmentId: string
  manifestationId: string
}

export interface ForwardManifestationToUnitInput {
  administrativeUnitId: string
  manifestationId: string
}

export interface OmbudsmanService {
  answer(input: AnswerManifestationInput): Promise<void>
  cancel(input: CancelManifestationInput): Promise<void>
  forwardToUnit(input: ForwardManifestationToUnitInput): Promise<void>
  getAttachmentDownloadUrl(input: GetAdminAttachmentDownloadUrlInput): Promise<string>
  getById(id: string): Promise<ManifestationDetail>
  getMetrics(filters: Omit<OmbudsmanListFilters, 'page' | 'status'>): Promise<OmbudsmanMetricsResult>
  list(filters: OmbudsmanListFilters): Promise<OmbudsmanListResult>
  updateStatus(input: UpdateManifestationStatusInput): Promise<void>
}
