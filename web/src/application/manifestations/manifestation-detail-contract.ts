import type { ManifestationStatus } from './manifestation-status-contract'
import type { ManifestationType } from './manifestation-type-contract'

export const knownHistoryEntryTypes = [
  'registered',
  'administrative_answered',
  'status_changed',
  'finalized_by_author',
  'evaluation_recorded',
] as const

export type ManifestationHistoryEntryType = (typeof knownHistoryEntryTypes)[number] | 'unknown'

export const knownMessageSenderTypes = ['manifestant', 'anonymous_manifestant', 'ombudsman', 'admin', 'system'] as const

export type ManifestationMessageSenderType = (typeof knownMessageSenderTypes)[number] | 'unknown'

export const knownAttachmentUploaderTypes = ['manifestant', 'anonymous_manifestant', 'ombudsman', 'admin'] as const

export type ManifestationAttachmentUploaderType = (typeof knownAttachmentUploaderTypes)[number] | 'unknown'

export interface ManifestationHistoryEntry {
  actorType: ManifestationMessageSenderType
  actorUserId: string | null
  attendantUserId: string | null
  createdAt: string
  description: string
  fromStatus: ManifestationStatus | null
  rating: number | null
  toStatus: ManifestationStatus | null
  type: ManifestationHistoryEntryType
}

export interface ManifestationMessageEntry {
  content: string
  createdAt: string
  id: string
  senderType: ManifestationMessageSenderType
  senderUserId: string | null
}

export interface ManifestationAttachmentInfo {
  createdAt: string
  id: string
  mimeType: string
  originalName: string
  sizeInBytes: number
  uploadedByType: ManifestationAttachmentUploaderType
}

export interface ManifestationDetail {
  administrativeUnitId: string
  attachments: ManifestationAttachmentInfo[]
  attendantUserId: string | null
  authorUserId: string | null
  campusId: string
  createdAt: string
  description: string
  forwardedToUnit: { id: string; name: string } | null
  history: ManifestationHistoryEntry[]
  id: string
  involvedPeople: string | null
  isAnonymous: boolean
  messages: ManifestationMessageEntry[]
  protocol: string
  status: ManifestationStatus
  type: ManifestationType
}

export function narrowHistoryEntryType(value: string): ManifestationHistoryEntryType {
  return knownHistoryEntryTypes.includes(value as (typeof knownHistoryEntryTypes)[number])
    ? (value as ManifestationHistoryEntryType)
    : 'unknown'
}

export function narrowMessageSenderType(value: string): ManifestationMessageSenderType {
  return knownMessageSenderTypes.includes(value as (typeof knownMessageSenderTypes)[number])
    ? (value as ManifestationMessageSenderType)
    : 'unknown'
}

export function narrowAttachmentUploaderType(value: string): ManifestationAttachmentUploaderType {
  return knownAttachmentUploaderTypes.includes(value as (typeof knownAttachmentUploaderTypes)[number])
    ? (value as ManifestationAttachmentUploaderType)
    : 'unknown'
}
