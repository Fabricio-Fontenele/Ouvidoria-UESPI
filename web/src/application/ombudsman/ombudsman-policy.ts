import type { ManifestationDetail } from '../manifestations/manifestation-detail-contract'

export function canAnswer(detail: ManifestationDetail): boolean {
  return detail.status === 'in_analysis' || detail.status === 'answered' || detail.status === 'awaiting_unit'
}

export function canFinalize(detail: ManifestationDetail): boolean {
  return detail.status === 'answered'
}

export function canCancel(detail: ManifestationDetail): boolean {
  return detail.status === 'in_analysis' || detail.status === 'answered' || detail.status === 'awaiting_unit'
}

export function canForward(detail: ManifestationDetail): boolean {
  return detail.status === 'in_analysis' || detail.status === 'awaiting_unit'
}
