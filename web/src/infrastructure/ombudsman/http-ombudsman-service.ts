import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import type { ManifestationSummary } from '../../application/manifestations/manifestation-summary-contract'
import type {
  AnswerManifestationInput,
  ForwardManifestationToUnitInput,
  GetAdminAttachmentDownloadUrlInput,
  OmbudsmanMetricsResult,
  OmbudsmanListFilters,
  OmbudsmanListResult,
  OmbudsmanService,
  UpdateManifestationStatusInput,
} from '../../application/ombudsman/ombudsman-service'
import { apiFetch } from '../http/api-client'
import type { ManifestationStatusTotals } from '../../application/manifestations/manifestation-status-contract'
import { buildEmptyManifestationStatusTotals } from '../../application/manifestations/manifestation-status-contract'
import type { RawManifestationDetail } from '../manifestations/manifestation-detail-mapper'
import { mapManifestationDetail } from '../manifestations/manifestation-detail-mapper'

interface ListResponse {
  manifestations: ManifestationSummary[]
  page?: number
  pageSize?: number
  statusTotals?: ManifestationStatusTotals
  totalItems?: number
  totalPages?: number
}

interface MetricsResponse {
  statusTotals: ManifestationStatusTotals
  totalItems: number
}

interface DetailResponse {
  manifestation: RawManifestationDetail
}

interface DownloadUrlResponse {
  downloadUrl: string
}

function buildListQuery(filters: OmbudsmanListFilters) {
  return {
    administrativeUnitId: filters.administrativeUnitId,
    campusId: filters.campusId,
    from: filters.from,
    page: filters.page,
    status: filters.status,
    to: filters.to,
    type: filters.type,
  }
}

export class HttpOmbudsmanService implements OmbudsmanService {
  async answer(input: AnswerManifestationInput): Promise<void> {
    await apiFetch<unknown>(`/admin/manifestations/${input.manifestationId}/answer`, {
      body: { content: input.content },
      method: 'POST',
    })
  }

  async forwardToUnit(input: ForwardManifestationToUnitInput): Promise<void> {
    await apiFetch<unknown>(`/admin/manifestations/${input.manifestationId}/forward`, {
      body: { administrativeUnitId: input.administrativeUnitId },
      method: 'POST',
    })
  }

  async getAttachmentDownloadUrl(input: GetAdminAttachmentDownloadUrlInput): Promise<string> {
    const response = await apiFetch<DownloadUrlResponse>(
      `/admin/manifestations/${input.manifestationId}/attachments/${input.attachmentId}/download-url`,
      { method: 'POST' },
    )

    return response.downloadUrl
  }

  async getById(id: string): Promise<ManifestationDetail> {
    const response = await apiFetch<DetailResponse>(`/admin/manifestations/${id}`)
    return mapManifestationDetail(response.manifestation)
  }

  async getMetrics(filters: Omit<OmbudsmanListFilters, 'page' | 'status'>): Promise<OmbudsmanMetricsResult> {
    return apiFetch<MetricsResponse>('/admin/manifestations/metrics', {
      query: buildListQuery({ ...filters, page: undefined, status: undefined }),
    })
  }

  async list(filters: OmbudsmanListFilters): Promise<OmbudsmanListResult> {
    const requestedPage = filters.page ?? 1
    const response = await apiFetch<ListResponse>('/admin/manifestations', {
      query: buildListQuery({ ...filters, page: requestedPage }),
    })

    return {
      manifestations: response.manifestations,
      page: response.page ?? requestedPage,
      pageSize: response.pageSize ?? response.manifestations.length,
      statusTotals: response.statusTotals ?? buildEmptyManifestationStatusTotals(),
      totalItems: response.totalItems ?? response.manifestations.length,
      totalPages: response.totalPages ?? 1,
    }
  }

  async updateStatus(input: UpdateManifestationStatusInput): Promise<void> {
    await apiFetch<unknown>(`/admin/manifestations/${input.manifestationId}/status`, {
      body: { status: input.status },
      method: 'PATCH',
    })
  }
}
