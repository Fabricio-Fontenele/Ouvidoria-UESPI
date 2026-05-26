import type {
  ManifestationAttachmentInfo,
  ManifestationDetail,
  ManifestationHistoryEntry,
  ManifestationMessageEntry,
} from '../../application/manifestations/manifestation-detail-contract'
import {
  narrowAttachmentUploaderType,
  narrowHistoryEntryType,
  narrowMessageSenderType,
} from '../../application/manifestations/manifestation-detail-contract'

export interface RawManifestationDetail extends Omit<
  ManifestationDetail,
  'attachments' | 'author' | 'history' | 'messages'
> {
  attachments: RawAttachmentInfo[]
  author?: ManifestationDetail['author']
  history: RawHistoryEntry[]
  messages: RawMessageEntry[]
}

export interface RawHistoryEntry extends Omit<
  ManifestationHistoryEntry,
  'actorType' | 'cancellationNote' | 'cancellationReason' | 'type'
> {
  actorType: string
  cancellationNote?: string | null
  cancellationReason?: string | null
  type: string
}

export interface RawMessageEntry extends Omit<ManifestationMessageEntry, 'senderType'> {
  senderType: string
}

export interface RawAttachmentInfo extends Omit<ManifestationAttachmentInfo, 'uploadedByType'> {
  uploadedByType: string
}

export function mapHistoryEntry(entry: RawHistoryEntry): ManifestationHistoryEntry {
  return {
    ...entry,
    actorType: narrowMessageSenderType(entry.actorType),
    cancellationNote: entry.cancellationNote ?? null,
    cancellationReason: entry.cancellationReason ?? null,
    type: narrowHistoryEntryType(entry.type),
  }
}

export function mapMessageEntry(entry: RawMessageEntry): ManifestationMessageEntry {
  return {
    ...entry,
    senderType: narrowMessageSenderType(entry.senderType),
  }
}

export function mapAttachmentInfo(attachment: RawAttachmentInfo): ManifestationAttachmentInfo {
  return {
    ...attachment,
    uploadedByType: narrowAttachmentUploaderType(attachment.uploadedByType),
  }
}

export function mapManifestationDetail(raw: RawManifestationDetail): ManifestationDetail {
  return {
    ...raw,
    attachments: raw.attachments.map(mapAttachmentInfo),
    author: raw.author ?? null,
    history: raw.history.map(mapHistoryEntry),
    messages: raw.messages.map(mapMessageEntry),
  }
}
