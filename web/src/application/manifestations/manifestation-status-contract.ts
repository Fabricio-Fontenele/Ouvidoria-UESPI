import { cx } from '../../utils/cx'

export type ManifestationStatus = 'answered' | 'canceled' | 'finalized' | 'in_analysis'

interface ManifestationStatusContract {
  accentClassName: string
  badgeClassName: string
  filterLabel: string
  iconClassName: string
  metricColorClassName?: string
  metricLabel: string
  value: ManifestationStatus
  viewLabel: string
}

export const manifestationStatusContracts: ManifestationStatusContract[] = [
  {
    accentClassName: 'border-l-home-warning',
    badgeClassName: 'bg-home-warning-strong text-home-text',
    filterLabel: 'Em análise',
    iconClassName: 'bg-home-warning text-white',
    metricColorClassName: 'text-home-warning',
    metricLabel: 'Em análise.',
    value: 'in_analysis',
    viewLabel: 'Em análise',
  },
  {
    accentClassName: 'border-l-home-blue',
    badgeClassName: 'bg-home-blue text-white',
    filterLabel: 'Respondidas',
    iconClassName: 'bg-home-blue text-white',
    metricLabel: 'Respondidas.',
    value: 'answered',
    viewLabel: 'Respondida',
  },
  {
    accentClassName: 'border-l-home-success',
    badgeClassName: 'bg-home-success text-white',
    filterLabel: 'Finalizadas',
    iconClassName: 'bg-home-success text-white',
    metricColorClassName: 'text-home-success',
    metricLabel: 'Finalizadas.',
    value: 'finalized',
    viewLabel: 'Finalizada',
  },
  {
    accentClassName: 'border-l-home-brown',
    badgeClassName: 'bg-home-brown text-white',
    filterLabel: 'Canceladas',
    iconClassName: 'bg-home-brown text-white',
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

export function getManifestationStatusBadgeClassName(status: ManifestationStatus, className?: string) {
  return cx(
    'rounded px-2 py-1 text-[10px] leading-[15px] font-black uppercase',
    getManifestationStatusContract(status).badgeClassName,
    className,
  )
}
