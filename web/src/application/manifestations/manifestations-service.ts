import type { ManifestationDetail, ManifestationMessageEntry } from './manifestation-detail-contract'
import type { ManifestationStatus } from './manifestation-status-contract'
import type { ManifestationSummary } from './manifestation-summary-contract'
import type { ManifestationType } from './manifestation-type-contract'

export interface CreateManifestationInput {
  administrativeUnitId: string
  campusId: string
  description: string
  involvedPeople: string | null
  isAnonymous: boolean
  type: ManifestationType
}

export interface CreatedManifestation {
  administrativeUnitId: string
  authorUserId: string | null
  campusId: string
  createdAt: string
  description: string
  id: string
  involvedPeople: string | null
  isAnonymous: boolean
  protocol: string
  status: ManifestationStatus
  type: ManifestationType
}

export interface CreateManifestationResult {
  accessCode: string | null
  manifestation: CreatedManifestation
}

export interface AddMessageInput {
  content: string
  manifestationId: string
}

export interface EvaluateInput {
  comment: string | null
  manifestationId: string
  rating: number
}

export interface ManifestationsService {
  addMessage(input: AddMessageInput): Promise<ManifestationMessageEntry>
  create(input: CreateManifestationInput): Promise<CreateManifestationResult>
  evaluate(input: EvaluateInput): Promise<void>
  finalize(manifestationId: string): Promise<void>
  getById(id: string): Promise<ManifestationDetail>
  list(page?: number): Promise<ManifestationSummary[]>
}
