import type { ManifestationStatus } from '../../application/manifestations/manifestation-status-contract'
import { cx } from '../../utils/cx'

interface ManifestationStatusStyle {
  accentClassName: string
  badgeClassName: string
  iconClassName: string
  metricColorClassName?: string
}

const manifestationStatusStyles: Record<ManifestationStatus, ManifestationStatusStyle> = {
  answered: {
    accentClassName: 'border-l-home-blue',
    badgeClassName: 'bg-home-blue text-white',
    iconClassName: 'bg-home-blue text-white',
  },
  canceled: {
    accentClassName: 'border-l-home-brown',
    badgeClassName: 'bg-home-brown text-white',
    iconClassName: 'bg-home-brown text-white',
  },
  finalized: {
    accentClassName: 'border-l-home-success',
    badgeClassName: 'bg-home-success text-white',
    iconClassName: 'bg-home-success text-white',
    metricColorClassName: 'text-home-success',
  },
  in_analysis: {
    accentClassName: 'border-l-home-warning',
    badgeClassName: 'bg-home-warning-strong text-home-text',
    iconClassName: 'bg-home-warning text-white',
    metricColorClassName: 'text-home-warning',
  },
}

export function getManifestationStatusStyle(status: ManifestationStatus) {
  return manifestationStatusStyles[status]
}

export function getManifestationStatusBadgeClassName(status: ManifestationStatus, className?: string) {
  return cx(
    'rounded px-2 py-1 text-[10px] leading-[15px] font-black uppercase',
    getManifestationStatusStyle(status).badgeClassName,
    className,
  )
}
