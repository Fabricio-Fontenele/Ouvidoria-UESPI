import type { ManifestationHistoryEntryDTO } from '#src/application/dto/manifestation-query-dtos.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'

type SystemHistoryType = Exclude<ManifestationHistoryEntryDTO['type'], 'administrative_answered'>

export interface SystemMessagePayload {
  type: SystemHistoryType
  description: string
  actorUserId: string | null
  actorType: ManifestationMessageSenderType
  fromStatus: ManifestationStatus | null
  toStatus: ManifestationStatus | null
}

const HISTORY_TYPES: readonly SystemHistoryType[] = ['registered', 'status_changed', 'finalized_by_author']
const SENDER_TYPES: readonly ManifestationMessageSenderType[] = Object.values(ManifestationMessageSenderType)
const STATUSES: readonly ManifestationStatus[] = Object.values(ManifestationStatus)

function isHistoryType(value: unknown): value is SystemHistoryType {
  return typeof value === 'string' && HISTORY_TYPES.includes(value as SystemHistoryType)
}

function isSenderType(value: unknown): value is ManifestationMessageSenderType {
  return typeof value === 'string' && SENDER_TYPES.includes(value as ManifestationMessageSenderType)
}

function isStatus(value: unknown): value is ManifestationStatus {
  return typeof value === 'string' && STATUSES.includes(value as ManifestationStatus)
}

export function encodeSystemMessagePayload(payload: SystemMessagePayload): string {
  return JSON.stringify(payload)
}

export function decodeSystemMessagePayload(raw: string): SystemMessagePayload | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (parsed === null || typeof parsed !== 'object') {
    return null
  }

  const candidate = parsed as Record<string, unknown>

  if (
    !isHistoryType(candidate['type']) ||
    typeof candidate['description'] !== 'string' ||
    !isSenderType(candidate['actorType'])
  ) {
    return null
  }

  const fromStatus = candidate['fromStatus']
  const toStatus = candidate['toStatus']
  const actorUserId = candidate['actorUserId']

  if (fromStatus !== null && !isStatus(fromStatus)) {
    return null
  }
  if (toStatus !== null && !isStatus(toStatus)) {
    return null
  }
  if (actorUserId !== null && typeof actorUserId !== 'string') {
    return null
  }

  return {
    type: candidate['type'],
    description: candidate['description'],
    actorType: candidate['actorType'],
    actorUserId,
    fromStatus,
    toStatus,
  }
}
