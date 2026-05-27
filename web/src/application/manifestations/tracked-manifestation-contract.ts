import type { ManifestationAttachmentUploaderType, ManifestationMessageEntry } from './manifestation-detail-contract'
import { narrowAttachmentUploaderType, narrowMessageSenderType } from './manifestation-detail-contract'
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
  description: string
  messages: ManifestationMessageEntry[]
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

// The tracked endpoint never exposes internal sender user ids, so the raw message omits it.
export interface RawTrackedManifestationMessage {
  content: string
  createdAt: string
  id: string
  senderType: string
}

export interface RawTrackedManifestationDetail extends Omit<TrackedManifestationDetail, 'attachments' | 'messages'> {
  attachments: RawTrackedManifestationAttachmentInfo[]
  messages: RawTrackedManifestationMessage[]
}

export function mapTrackedAttachmentInfo(
  attachment: RawTrackedManifestationAttachmentInfo,
): TrackedManifestationAttachmentInfo {
  return {
    ...attachment,
    uploadedByType: narrowAttachmentUploaderType(attachment.uploadedByType),
  }
}

export function mapTrackedManifestationMessage(message: RawTrackedManifestationMessage): ManifestationMessageEntry {
  return {
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    senderType: narrowMessageSenderType(message.senderType),
    senderUserId: null,
  }
}

export function mapTrackedManifestationDetail(raw: RawTrackedManifestationDetail): TrackedManifestationDetail {
  return {
    ...raw,
    attachments: raw.attachments.map(mapTrackedAttachmentInfo),
    messages: raw.messages.map(mapTrackedManifestationMessage),
  }
}
