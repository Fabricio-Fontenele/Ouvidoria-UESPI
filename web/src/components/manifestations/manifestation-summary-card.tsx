import type { ReactNode } from 'react'

import type { Catalog } from '../../application/catalog/catalog-types'
import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import { getManifestationStatusContract } from '../../application/manifestations/manifestation-status-contract'
import { getManifestationTypeLabel } from '../../application/manifestations/manifestation-type-contract'
import { cx } from '../../utils/cx'
import { formatBrDate } from '../../utils/format-date'

import { getManifestationStatusStyle } from './manifestation-status-style'

function buildAreaLabel(catalog: Catalog | null, campusId: string, administrativeUnitId: string) {
  const campus = catalog?.campuses.find((entry) => entry.id === campusId)
  const unit = campus?.administrativeUnits.find((entry) => entry.id === administrativeUnitId)

  if (campus === undefined || unit === undefined) {
    return 'Unidade não identificada'
  }

  return `${campus.label} — ${unit.label}`
}

interface ManifestationSummaryCardProps {
  catalog: Catalog | null
  detail: ManifestationDetail
  extraItems?: Array<{ label: string; value: string }>
  showRequester?: boolean
  titleSlot?: ReactNode
}

export function ManifestationSummaryCard({
  catalog,
  detail,
  extraItems,
  showRequester = false,
  titleSlot,
}: ManifestationSummaryCardProps) {
  const statusContract = getManifestationStatusContract(detail.status)
  const statusStyle = getManifestationStatusStyle(detail.status)
  const areaLabel = buildAreaLabel(catalog, detail.campusId, detail.administrativeUnitId)
  const typeLabel = getManifestationTypeLabel(detail.type)
  const createdAtLabel = formatBrDate(detail.createdAt)

  const items: Array<{ label: string; value: string }> = [
    { label: 'Protocolo', value: detail.protocol },
    { label: 'Tipo', value: typeLabel },
    { label: 'Área', value: areaLabel },
    { label: 'Registrada em', value: createdAtLabel },
    { label: 'Status', value: statusContract.viewLabel },
    ...(extraItems ?? []),
  ]

  return (
    <article
      aria-labelledby="manifestation-detail-title"
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-black tracking-[0.24em] text-home-blue uppercase">Manifestação</p>
          <h1 className="mt-3 text-2xl leading-9 font-black text-home-text" id="manifestation-detail-title">
            {detail.protocol}
          </h1>
          <p className="mt-2 text-sm leading-6 text-home-brown">
            {typeLabel} • {areaLabel}
          </p>
          {titleSlot !== undefined ? <div className="mt-3">{titleSlot}</div> : null}
        </div>
        <span
          className={cx(
            'inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-base leading-6 font-black tracking-[0.04em] uppercase sm:min-h-12 sm:px-5 sm:text-lg',
            statusStyle.badgeClassName,
          )}
        >
          {statusContract.viewLabel}
        </span>
      </div>

      {showRequester ? (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="manifestation-requester-title">
          <p
            className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase"
            id="manifestation-requester-title"
          >
            Solicitante
          </p>
          {detail.author === null ? (
            <p className="mt-3 text-base leading-7 font-semibold text-home-text">Manifestação anônima</p>
          ) : (
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase">Nome</dt>
                <dd className="mt-2 text-lg leading-7 font-semibold text-home-text break-words">
                  {detail.author.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase">E-mail</dt>
                <dd className="mt-2 text-lg leading-7 font-semibold text-home-text break-words">
                  {detail.author.email}
                </dd>
              </div>
            </dl>
          )}
        </section>
      ) : null}

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div className="rounded-3xl bg-home-action/50 p-4" key={item.label}>
            <dt className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase">{item.label}</dt>
            <dd className="mt-2 text-lg leading-7 font-semibold text-home-text">{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
