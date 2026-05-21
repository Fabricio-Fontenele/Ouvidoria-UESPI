import type { ManifestationDetail } from '../manifestations/manifestation-detail-contract'
import type { ManifestationStatus } from '../manifestations/manifestation-status-contract'
import type { ManifestationSummary } from '../manifestations/manifestation-summary-contract'
import type { ManifestationType } from '../manifestations/manifestation-type-contract'

export interface OmbudsmanListFilters {
  administrativeUnitId?: string
  campusId?: string
  from?: string
  page?: number
  status?: ManifestationStatus
  to?: string
  type?: ManifestationType
}

export interface OmbudsmanListResult {
  manifestations: ManifestationSummary[]
  page: number
  totalItems?: number
  totalPages?: number
}

export type OmbudsmanStatusChange = 'canceled' | 'finalized'

export interface AnswerManifestationInput {
  content: string
  manifestationId: string
}

export interface UpdateManifestationStatusInput {
  manifestationId: string
  status: OmbudsmanStatusChange
}

export interface GetAdminAttachmentDownloadUrlInput {
  attachmentId: string
  manifestationId: string
}

export interface OmbudsmanService {
  answer(input: AnswerManifestationInput): Promise<void>
  getAttachmentDownloadUrl(input: GetAdminAttachmentDownloadUrlInput): Promise<string>
  getById(id: string): Promise<ManifestationDetail>
  list(filters: OmbudsmanListFilters): Promise<OmbudsmanListResult>
  updateStatus(input: UpdateManifestationStatusInput): Promise<void>
}
