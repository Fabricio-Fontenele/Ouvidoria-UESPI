export type ManifestationStatus = 'answered' | 'awaiting_unit' | 'canceled' | 'finalized' | 'in_analysis'

export interface ManifestationStatusContract {
  filterLabel: string
  metricLabel: string
  value: ManifestationStatus
  viewLabel: string
}

export const manifestationStatusContracts: ManifestationStatusContract[] = [
  {
    filterLabel: 'Em análise',
    metricLabel: 'Em análise.',
    value: 'in_analysis',
    viewLabel: 'Em análise',
  },
  {
    filterLabel: 'Aguardando setor',
    metricLabel: 'Aguardando setor.',
    value: 'awaiting_unit',
    viewLabel: 'Aguardando setor',
  },
  {
    filterLabel: 'Respondidas',
    metricLabel: 'Respondidas.',
    value: 'answered',
    viewLabel: 'Respondida',
  },
  {
    filterLabel: 'Finalizadas',
    metricLabel: 'Finalizadas.',
    value: 'finalized',
    viewLabel: 'Finalizada',
  },
  {
    filterLabel: 'Canceladas',
    metricLabel: 'Canceladas.',
    value: 'canceled',
    viewLabel: 'Cancelada',
  },
]

export const manifestationStatusValues = manifestationStatusContracts.map((status) => status.value)

const manifestationStatusContractByValue = Object.fromEntries(
  manifestationStatusContracts.map((status) => [status.value, status]),
) as Record<ManifestationStatus, ManifestationStatusContract>

export function getManifestationStatusContract(status: ManifestationStatus) {
  return manifestationStatusContractByValue[status]
}
