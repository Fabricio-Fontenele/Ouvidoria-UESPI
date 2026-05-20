import type {
  CreateManifestationInput,
  CreateManifestationResult,
  ManifestationsService,
} from '../../application/manifestations/manifestations-service'
import type { ManifestationSummary } from '../../application/manifestations/manifestation-summary-contract'
import { apiFetch } from '../http/api-client'

interface ListResponse {
  manifestations: ManifestationSummary[]
}

export class HttpManifestationsService implements ManifestationsService {
  async create(input: CreateManifestationInput): Promise<CreateManifestationResult> {
    return apiFetch<CreateManifestationResult>('/manifestations', {
      body: {
        administrativeUnitId: input.administrativeUnitId,
        campusId: input.campusId,
        description: input.description,
        involvedPeople: input.involvedPeople,
        isAnonymous: input.isAnonymous,
        type: input.type,
      },
      method: 'POST',
    })
  }

  async list(page = 1): Promise<ManifestationSummary[]> {
    const response = await apiFetch<ListResponse>('/manifestations', {
      query: { page },
    })

    return response.manifestations
  }
}
