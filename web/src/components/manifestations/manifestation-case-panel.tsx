import type { ReactNode } from 'react'

import type { Catalog } from '../../application/catalog/catalog-types'
import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import { getManifestationStatusContract } from '../../application/manifestations/manifestation-status-contract'
import { getManifestationTypeLabel } from '../../application/manifestations/manifestation-type-contract'
import { cx } from '../../utils/cx'
import { formatBrDate } from '../../utils/format-date'

import { getManifestationStatusStyle } from './manifestation-status-style'

function resolveArea(catalog: Catalog | null, campusId: string, administrativeUnitId: string) {
  const campus = catalog?.campuses.find((entry) => entry.id === campusId)
  const unit = campus?.administrativeUnits.find((entry) => entry.id === administrativeUnitId)

  return {
    campus: campus?.label ?? 'Campus não identificado',
    unit: unit?.label ?? 'Unidade não identificada',
  }
}

interface CasePanelBlockProps {
  action?: ReactNode
  children: ReactNode
  title: string
}

/** A divided sub-section inside the case panel (e.g. "Anexos", "Ações"). */
export function CasePanelBlock({ action, children, title }: CasePanelBlockProps) {
  return (
    <section className="mt-5 border-t border-login-brown/10 pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-bold tracking-[0.16em] text-home-brown/70 uppercase">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

interface ManifestationCasePanelProps {
  catalog: Catalog | null
  children?: ReactNode
  detail: ManifestationDetail
  showRequester?: boolean
}

/**
 * Consolidated identity + metadata sidebar for the manifestation detail screens. Replaces the old
 * stack of separate summary/attachments/action cards: identity and meta live here, and `children`
 * receives `CasePanelBlock`s (attachments, actions) so each page composes only what applies.
 */
export function ManifestationCasePanel({
  catalog,
  children,
  detail,
  showRequester = false,
}: ManifestationCasePanelProps) {
  const statusContract = getManifestationStatusContract(detail.status)
  const statusStyle = getManifestationStatusStyle(detail.status)
  const area = resolveArea(catalog, detail.campusId, detail.administrativeUnitId)
  const meta: Array<{ label: string; value: string }> = [
    { label: 'Tipo', value: getManifestationTypeLabel(detail.type) },
    { label: 'Campus', value: area.campus },
    { label: 'Unidade administrativa', value: area.unit },
    { label: 'Registrada em', value: formatBrDate(detail.createdAt) },
  ]

  return (
    <aside
      aria-labelledby="manifestation-case-title"
      className="rounded-2xl border border-login-brown/10 bg-white p-5 shadow-login-frame lg:sticky lg:top-24"
    >
      <span
        className={cx(
          'inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm leading-5 font-black tracking-[0.04em] uppercase',
          statusStyle.badgeClassName,
        )}
      >
        {statusContract.viewLabel}
      </span>
      <p className="mt-4 text-[11px] font-black tracking-[0.24em] text-home-blue uppercase">Protocolo</p>
      <h1 className="mt-1 text-xl leading-7 font-black break-all text-home-text" id="manifestation-case-title">
        {detail.protocol}
      </h1>

      <dl className="mt-5 space-y-3">
        {meta.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] font-bold tracking-[0.14em] text-home-brown/70 uppercase">{item.label}</dt>
            <dd className="mt-0.5 text-sm leading-6 font-semibold break-words text-home-text">{item.value}</dd>
          </div>
        ))}
        {showRequester ? (
          <div>
            <dt className="text-[11px] font-bold tracking-[0.14em] text-home-brown/70 uppercase">Solicitante</dt>
            <dd className="mt-0.5 text-sm leading-6 font-semibold break-words text-home-text">
              {detail.author === null ? 'Manifestação anônima' : detail.author.name}
            </dd>
            {detail.author !== null ? (
              <dd className="text-xs leading-5 break-words text-home-brown">{detail.author.email}</dd>
            ) : null}
          </div>
        ) : null}
      </dl>

      {children}
    </aside>
  )
}
