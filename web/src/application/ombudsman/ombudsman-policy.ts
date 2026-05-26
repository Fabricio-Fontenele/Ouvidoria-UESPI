import type { ManifestationDetail } from '../manifestations/manifestation-detail-contract'

export function canAnswer(detail: ManifestationDetail): boolean {
  return detail.status === 'in_analysis' || detail.status === 'answered' || detail.status === 'awaiting_unit'
}

export function canFinalize(detail: ManifestationDetail): boolean {
  return detail.status === 'answered'
}

export function canCancel(detail: ManifestationDetail): boolean {
  // Espelha o backend (cancelByOmbudsman): é possível cancelar a qualquer momento enquanto
  // a manifestação está aberta — in_analysis, awaiting_unit ou answered — desde que haja
  // justificativa. Estados terminais (finalized/canceled) não podem ser cancelados.
  return detail.status === 'in_analysis' || detail.status === 'awaiting_unit' || detail.status === 'answered'
}

export function canForward(detail: ManifestationDetail): boolean {
  // Espelha o backend: encaminhar enquanto a manifestação estiver aberta
  // (in_analysis, awaiting_unit ou answered). Terminais (finalized/canceled) não.
  return detail.status === 'in_analysis' || detail.status === 'awaiting_unit' || detail.status === 'answered'
}
