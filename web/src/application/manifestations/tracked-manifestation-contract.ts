import type { ManifestationAttachmentUploaderType } from './manifestation-detail-contract'
import { narrowAttachmentUploaderType } from './manifestation-detail-contract'
import type { ManifestationStatus } from './manifestation-status-contract'
import type { ManifestationType } from './manifestation-type-contract'

export interface TrackedManifestationAttachmentInfo {
  createdAt: string
  id: string
  mimeType: string
  originalName: string
  sizeInBytes: number
  uploadedByType: ManifestationAttachmentUploaderType
}

export interface TrackedManifestationDetail {
  administrativeUnitId: string
  attachments: TrackedManifestationAttachmentInfo[]
  campusId: string
  createdAt: string
  protocol: string
  status: ManifestationStatus
  type: ManifestationType
}

export interface RawTrackedManifestationAttachmentInfo extends Omit<
  TrackedManifestationAttachmentInfo,
  'uploadedByType'
> {
  uploadedByType: string
}

export interface RawTrackedManifestationDetail extends Omit<TrackedManifestationDetail, 'attachments'> {
  attachments: RawTrackedManifestationAttachmentInfo[]
}

export function mapTrackedAttachmentInfo(
  attachment: RawTrackedManifestationAttachmentInfo,
): TrackedManifestationAttachmentInfo {
  return {
    ...attachment,
    uploadedByType: narrowAttachmentUploaderType(attachment.uploadedByType),
  }
}

export function mapTrackedManifestationDetail(raw: RawTrackedManifestationDetail): TrackedManifestationDetail {
  return {
    ...raw,
    attachments: raw.attachments.map(mapTrackedAttachmentInfo),
  }
}
