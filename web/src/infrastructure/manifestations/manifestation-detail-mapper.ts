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

export interface RawManifestationDetail extends Omit<ManifestationDetail, 'attachments' | 'history' | 'messages'> {
  attachments: RawAttachmentInfo[]
  history: RawHistoryEntry[]
  messages: RawMessageEntry[]
}

export interface RawHistoryEntry extends Omit<ManifestationHistoryEntry, 'actorType' | 'type'> {
  actorType: string
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
    history: raw.history.map(mapHistoryEntry),
    messages: raw.messages.map(mapMessageEntry),
  }
}
