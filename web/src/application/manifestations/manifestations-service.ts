import type { ManifestationDetail, ManifestationMessageEntry } from './manifestation-detail-contract'
import type { ManifestationStatus } from './manifestation-status-contract'
import type { ManifestationSummary } from './manifestation-summary-contract'
import type { ManifestationType } from './manifestation-type-contract'
import type { PaginationMeta } from '../pagination/pagination-contract'
import type { TrackedManifestationDetail } from './tracked-manifestation-contract'

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

export interface UploadManifestationAttachmentInput {
  file: File
  manifestationId: string
}

export interface GetManifestationAttachmentDownloadUrlInput {
  attachmentId: string
  manifestationId: string
}

export interface TrackManifestationInput {
  accessCode: string
  protocol: string
}

export interface UploadTrackedManifestationAttachmentInput extends TrackManifestationInput {
  file: File
}

export interface GetTrackedManifestationAttachmentDownloadUrlInput extends TrackManifestationInput {
  attachmentId: string
}

export interface AttachmentDownloadUrlResult {
  downloadUrl: string
}

export interface ManifestationsListResult extends PaginationMeta {
  manifestations: ManifestationSummary[]
}

export interface ManifestationsService {
  addMessage(input: AddMessageInput): Promise<ManifestationMessageEntry>
  create(input: CreateManifestationInput): Promise<CreateManifestationResult>
  evaluate(input: EvaluateInput): Promise<void>
  finalize(manifestationId: string): Promise<void>
  getAttachmentDownloadUrl(input: GetManifestationAttachmentDownloadUrlInput): Promise<string>
  getById(id: string): Promise<ManifestationDetail>
  getTrackedAttachmentDownloadUrl(input: GetTrackedManifestationAttachmentDownloadUrlInput): Promise<string>
  getTrackedDetails(input: TrackManifestationInput): Promise<TrackedManifestationDetail>
  list(page?: number): Promise<ManifestationsListResult>
  uploadAttachment(input: UploadManifestationAttachmentInput): Promise<void>
  uploadTrackedAttachment(input: UploadTrackedManifestationAttachmentInput): Promise<void>
}
