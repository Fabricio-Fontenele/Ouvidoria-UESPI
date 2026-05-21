import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import type { ManifestationSummary } from '../../application/manifestations/manifestation-summary-contract'
import type {
  AnswerManifestationInput,
  GetAdminAttachmentDownloadUrlInput,
  OmbudsmanListFilters,
  OmbudsmanListResult,
  OmbudsmanService,
  UpdateManifestationStatusInput,
} from '../../application/ombudsman/ombudsman-service'
import { apiFetch } from '../http/api-client'
import type { RawManifestationDetail } from '../manifestations/manifestation-detail-mapper'
import { mapManifestationDetail } from '../manifestations/manifestation-detail-mapper'

interface ListResponse {
  manifestations: ManifestationSummary[]
  page?: number
  totalItems?: number
  totalPages?: number
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

  async list(filters: OmbudsmanListFilters): Promise<OmbudsmanListResult> {
    const requestedPage = filters.page ?? 1
    const response = await apiFetch<ListResponse>('/admin/manifestations', {
      query: buildListQuery({ ...filters, page: requestedPage }),
    })

    const result: OmbudsmanListResult = {
      manifestations: response.manifestations,
      page: response.page ?? requestedPage,
    }

    if (response.totalPages !== undefined) {
      result.totalPages = response.totalPages
    }

    if (response.totalItems !== undefined) {
      result.totalItems = response.totalItems
    }

    return result
  }

  async updateStatus(input: UpdateManifestationStatusInput): Promise<void> {
    await apiFetch<unknown>(`/admin/manifestations/${input.manifestationId}/status`, {
      body: { status: input.status },
      method: 'PATCH',
    })
  }
}
