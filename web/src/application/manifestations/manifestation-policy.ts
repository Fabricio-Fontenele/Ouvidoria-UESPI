import type { ManifestationDetail } from './manifestation-detail-contract'
import type { ManifestationStatus } from './manifestation-status-contract'

export function canSendMessageByStatus(status: ManifestationStatus): boolean {
  return status === 'in_analysis' || status === 'answered'
}

export function canSendMessage(detail: ManifestationDetail): boolean {
  return canSendMessageByStatus(detail.status)
}

export function canFinalize(detail: ManifestationDetail): boolean {
  return detail.status === 'answered'
}

export function hasEvaluationRecorded(detail: ManifestationDetail): boolean {
  return detail.history.some((entry) => entry.type === 'evaluation_recorded')
}

export function canEvaluate(detail: ManifestationDetail): boolean {
  return detail.status === 'finalized' && detail.attendantUserId !== null && !hasEvaluationRecorded(detail)
}
