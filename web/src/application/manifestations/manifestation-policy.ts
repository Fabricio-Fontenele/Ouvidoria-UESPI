import type { ManifestationDetail } from './manifestation-detail-contract'

export function canSendMessage(detail: ManifestationDetail): boolean {
  return detail.status === 'in_analysis' || detail.status === 'answered'
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
