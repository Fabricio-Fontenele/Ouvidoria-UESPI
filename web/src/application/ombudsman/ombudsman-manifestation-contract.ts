import type { ManifestationSearchContract } from '../manifestations/manifestation-summary-contract'

export type OmbudsmanManifestationStatus = 'in_analysis' | 'pending' | 'resolved'

export interface OmbudsmanManifestationStatusContract {
  filterLabel: string
  metricLabel: string
  value: OmbudsmanManifestationStatus
  viewLabel: string
}

export interface OmbudsmanManifestationSummary extends ManifestationSearchContract {
  status: OmbudsmanManifestationStatus
  updatedAt: string
}

export const ombudsmanManifestationStatusContracts: OmbudsmanManifestationStatusContract[] = [
  {
    filterLabel: 'Pendente',
    metricLabel: 'Pendentes',
    value: 'pending',
    viewLabel: 'Pendente',
  },
  {
    filterLabel: 'Em análise',
    metricLabel: 'Em análise',
    value: 'in_analysis',
    viewLabel: 'Em análise',
  },
  {
    filterLabel: 'Resolvida',
    metricLabel: 'Resolvidas',
    value: 'resolved',
    viewLabel: 'Resolvida',
  },
]

const ombudsmanManifestationStatusContractByValue = Object.fromEntries(
  ombudsmanManifestationStatusContracts.map((status) => [status.value, status]),
) as Record<OmbudsmanManifestationStatus, OmbudsmanManifestationStatusContract>

export function getOmbudsmanManifestationStatusContract(status: OmbudsmanManifestationStatus) {
  return ombudsmanManifestationStatusContractByValue[status]
}
