import { useMemo, useState } from 'react'

import { buildOmbudsmanManifestationDetailsHref } from '../app/routes'
import { FILTER_ALL_VALUE, ombudsmanAreaRoles } from '../app/access-policy'
import type { DateFilterValue, FilterAllValue } from '../app/access-policy'
import { parseBrazilianShortDateLabel } from '../app/date-utils'
import { searchManifestations } from '../application/manifestations/search-manifestations'
import {
  getOmbudsmanManifestationStatusContract,
  ombudsmanManifestationStatusContracts,
} from '../application/ombudsman/ombudsman-manifestation-contract'
import type {
  OmbudsmanManifestationStatus,
  OmbudsmanManifestationSummary,
} from '../application/ombudsman/ombudsman-manifestation-contract'
import { Icon } from '../components/icons/icon'
import type { IconName } from '../components/icons/icon'
import { AuthenticatedAppShell } from '../components/layout/authenticated-app-shell'
import { SiteFooter } from '../components/layout/site-footer'
import { cx } from '../utils/cx'

type StatusFilter = FilterAllValue | OmbudsmanManifestationStatus
type DateFilter = DateFilterValue
type TextFilter = FilterAllValue | string

interface DashboardMetric {
  anchorId: string
  caption: string
  icon: IconName
  iconClassName: string
  label: string
  trend: string
  value: string
}

interface FilterSelectProps {
  id: string
  label: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}

interface DateFilterInputProps {
  id: string
  label: string
  onChange: (value: DateFilter) => void
  value: DateFilter
}

const dashboardMetrics: DashboardMetric[] = [
  {
    anchorId: 'pendentes',
    caption: 'Aguardam primeira triagem',
    icon: 'clock',
    iconClassName: 'text-home-blue',
    label: 'Pendentes',
    trend: 'priorizar hoje',
    value: '12',
  },
  {
    anchorId: 'em-analise',
    caption: 'Com equipe responsável',
    icon: 'info',
    iconClassName: 'text-home-blue',
    trend: 'em acompanhamento',
    label: 'Em análise',
    value: '45',
  },
  {
    anchorId: 'resolvidas',
    caption: 'Concluídas no histórico',
    icon: 'check-circle',
    iconClassName: 'text-home-blue',
    label: 'Resolvidas',
    trend: 'fluxo estável',
    value: '189',
  },
]

const ombudsmanManifestations: OmbudsmanManifestationSummary[] = [
  {
    area: 'Administração Superior',
    description: 'Solicitação de revisão do fluxo administrativo para atendimento acadêmico.',
    manifestationType: 'Sugestão',
    protocol: '#2024-0775',
    status: 'in_analysis',
    updatedAt: '02 Set, 2024',
  },
  {
    area: 'Infraestrutura e TI',
    description: 'Relato de instabilidade nos sistemas institucionais durante o atendimento ao discente.',
    manifestationType: 'Reclamação',
    protocol: '#2024-0776',
    status: 'pending',
    updatedAt: '01 Set, 2024',
  },
]

const statusBadgeClassNames: Record<OmbudsmanManifestationStatus, string> = {
  in_analysis: 'bg-home-warning/20 text-home-brown',
  pending: 'bg-home-blue/10 text-home-blue',
  resolved: 'bg-home-success/15 text-home-success',
}

const metricCardClasses = [
  'group relative overflow-hidden rounded-lg border border-login-brown/10 bg-home-surface',
  'px-4 py-4 shadow-login-card transition duration-150 hover:-translate-y-0.5 hover:shadow-landing-card',
  'focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-home-blue',
  'min-[390px]:px-5 sm:px-6 sm:py-6 md:px-7 md:py-7',
]

const manifestationCardClasses = [
  'group relative w-full overflow-hidden rounded-lg border bg-home-surface px-5 py-5 shadow-login-card',
  'transition duration-150 hover:-translate-y-0.5 hover:shadow-landing-card sm:px-6 sm:py-6 md:px-7',
]

const statusVisuals: Record<
  OmbudsmanManifestationStatus,
  {
    accentClassName: string
    barClassName: string
    icon: IconName
    iconClassName: string
    label: string
    summary: string
  }
> = {
  in_analysis: {
    accentClassName: 'border-home-warning-strong/45',
    barClassName: 'bg-home-warning-strong',
    icon: 'info',
    iconClassName: 'bg-home-warning/20 text-home-brown',
    label: 'Em acompanhamento',
    summary: 'Requer resposta da área responsável.',
  },
  pending: {
    accentClassName: 'border-home-blue/30',
    barClassName: 'bg-home-blue',
    icon: 'clock',
    iconClassName: 'bg-home-blue/10 text-home-blue',
    label: 'Triagem pendente',
    summary: 'Precisa de conferência inicial.',
  },
  resolved: {
    accentClassName: 'border-home-success/35',
    barClassName: 'bg-home-success',
    icon: 'check-circle',
    iconClassName: 'bg-home-success/15 text-home-success',
    label: 'Concluída',
    summary: 'Resposta final registrada.',
  },
}

function getUniqueOptions(items: string[]) {
  return [...new Set(items)].map((item) => ({ label: item, value: item }))
}

function getDateInputValue(dateLabel: string) {
  return parseBrazilianShortDateLabel(dateLabel) ?? dateLabel
}

function MetricCards() {
  return (
    <section aria-labelledby="ombudsman-metrics-title" className="mt-10">
      <h2 className="sr-only" id="ombudsman-metrics-title">
        Indicadores das demandas
      </h2>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 lg:gap-6">
        {dashboardMetrics.map((metric) => (
          <div
            className={metricCardClasses.join(' ')}
            id={metric.anchorId}
            key={metric.label}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-home-blue/80 opacity-0 transition duration-150 group-hover:opacity-100" />
            <dt className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm leading-5 font-black text-home-text md:text-base">{metric.label}</span>
                <span className="mt-1 block text-xs leading-5 text-home-brown">{metric.caption}</span>
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-home-blue/10 md:size-11">
                <Icon className={cx('size-5 md:size-6', metric.iconClassName)} name={metric.icon} />
              </span>
            </dt>
            <dd className="mt-5 flex items-end justify-between gap-3">
              <span className="text-4xl leading-none font-black tabular-nums text-home-text md:text-5xl">
                {metric.value}
              </span>
              <span className="rounded-full bg-home-action px-3 py-1 text-[11px] leading-4 font-bold text-home-brown">
                {metric.trend}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function SearchField({ onSearchChange, search }: { onSearchChange: (value: string) => void; search: string }) {
  return (
    <label className="mx-auto block w-full md:w-[92%] xl:w-[94%]" htmlFor="ombudsman-manifestation-search">
      <span className="sr-only">Pesquisar manifestações</span>
      <span className="grid h-9 grid-cols-[18px_1fr] items-center gap-4 rounded-full bg-home-field px-4 text-home-muted outline-home-blue focus-within:outline-2 focus-within:outline-offset-2 md:h-10 md:px-5">
        <Icon className="size-[18px]" name="search" />
        <input
          className="min-w-0 bg-transparent text-sm leading-none text-home-text outline-none placeholder:text-home-muted"
          id="ombudsman-manifestation-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por protocolo, tipo, área ou descrição..."
          type="search"
          value={search}
        />
      </span>
    </label>
  )
}

function FilterSelect({ id, label, onChange, options, value }: FilterSelectProps) {
  const isActive = value !== FILTER_ALL_VALUE

  return (
    <label
      className={cx(
        'flex min-h-8 w-full items-center rounded-full px-3 transition duration-150 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-home-blue',
        isActive ? 'bg-home-blue text-white' : 'bg-home-chip text-home-brown hover:bg-home-chip/80',
      )}
    >
      <span className="sr-only">{label}</span>
      <select
        className="min-h-8 w-full cursor-pointer bg-transparent text-xs leading-5 font-semibold outline-none"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value={FILTER_ALL_VALUE}>{label}</option>
        {options.map((option) => (
          <option key={`${id}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function DateFilterInput({ id, label, onChange, value }: DateFilterInputProps) {
  const isActive = value !== FILTER_ALL_VALUE

  return (
    <label
      className={cx(
        'flex min-h-8 w-full items-center rounded-full px-3 transition duration-150 focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-home-blue',
        isActive ? 'bg-home-blue text-white' : 'bg-home-chip text-home-brown hover:bg-home-chip/80',
      )}
    >
      <span className="sr-only">{label}</span>
      <input
        className="min-h-8 w-full cursor-pointer bg-transparent text-xs leading-5 font-semibold outline-none [color-scheme:light]"
        id={id}
        onChange={(event) => onChange(event.target.value === '' ? FILTER_ALL_VALUE : event.target.value)}
        title={label}
        type="date"
        value={value === FILTER_ALL_VALUE ? '' : value}
      />
    </label>
  )
}

function StatusBadge({ status }: { status: OmbudsmanManifestationStatus }) {
  const statusContract = getOmbudsmanManifestationStatusContract(status)

  return (
    <span
      className={cx(
        'inline-flex min-h-8 items-center rounded-lg px-4 text-xs leading-4 font-black tracking-[0.08em] uppercase',
        statusBadgeClassNames[status],
      )}
    >
      {statusContract.viewLabel}
    </span>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] leading-4 font-black tracking-[0.08em] text-home-brown/60 uppercase">{label}</dt>
      <dd className="mt-1 truncate text-sm leading-5 font-semibold text-home-text">{value}</dd>
    </div>
  )
}

function ManifestationCard({ manifestation }: { manifestation: OmbudsmanManifestationSummary }) {
  const protocolId = manifestation.protocol.replace(/[^a-z0-9]/gi, '')
  const statusVisual = statusVisuals[manifestation.status]

  return (
    <article
      aria-labelledby={`${protocolId}-title`}
      className={cx(
        manifestationCardClasses.join(' '),
        statusVisual.accentClassName,
      )}
    >
      <div aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-1 opacity-70', statusVisual.barClassName)} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 grid-cols-[40px_1fr] gap-3">
          <span className={cx('grid size-10 place-items-center rounded-lg', statusVisual.iconClassName)}>
            <Icon className="size-5" name={statusVisual.icon} />
          </span>
          <div className="min-w-0">
            <p className="text-xs leading-4 font-black tracking-[0.1em] text-home-blue uppercase">Manifestação</p>
            <h2 className="mt-1 truncate text-2xl leading-8 font-black text-home-text" id={`${protocolId}-title`}>
              {manifestation.protocol}
            </h2>
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={manifestation.status} />
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-home-brown">{manifestation.description}</p>

      <dl className="mt-5 grid grid-cols-1 gap-4 rounded-lg bg-home-action/75 px-4 py-4 sm:grid-cols-2">
        <DetailItem label="Tipo" value={manifestation.manifestationType} />
        <DetailItem label="Atualização" value={manifestation.updatedAt} />
        <div className="sm:col-span-2">
          <DetailItem label="Área responsável" value={manifestation.area} />
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-4 border-t border-login-brown/10 pt-5 min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between">
        <div className="min-w-0">
          <p className="text-sm leading-5 font-black text-home-text">{statusVisual.label}</p>
          <p className="mt-1 text-sm leading-5 text-home-brown">{statusVisual.summary}</p>
        </div>
        <a
          aria-label={`Abrir manifestação ${manifestation.protocol}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          href={buildOmbudsmanManifestationDetailsHref(manifestation.protocol)}
        >
          Abrir demanda
          <Icon className="size-4" name="chevron-right" />
        </a>
      </div>
    </article>
  )
}

function matchesFilters(
  manifestation: OmbudsmanManifestationSummary,
  statusFilter: StatusFilter,
  typeFilter: TextFilter,
  dateFilter: DateFilter,
) {
  return (
    (statusFilter === FILTER_ALL_VALUE || manifestation.status === statusFilter) &&
    (typeFilter === FILTER_ALL_VALUE || manifestation.manifestationType === typeFilter) &&
    (dateFilter === FILTER_ALL_VALUE || parseBrazilianShortDateLabel(manifestation.updatedAt) === dateFilter)
  )
}

export function OmbudsmanHomePage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(FILTER_ALL_VALUE)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(FILTER_ALL_VALUE)
  const [typeFilter, setTypeFilter] = useState<TextFilter>(FILTER_ALL_VALUE)
  const typeOptions = useMemo(
    () => getUniqueOptions(ombudsmanManifestations.map((manifestation) => manifestation.manifestationType)),
    [],
  )
  const statusOptions = ombudsmanManifestationStatusContracts.map((status) => ({
    label: status.filterLabel,
    value: status.value,
  }))
  const filteredManifestations = useMemo(
    () =>
      searchManifestations(
        ombudsmanManifestations.filter((manifestation) =>
          matchesFilters(manifestation, statusFilter, typeFilter, dateFilter),
        ),
        search,
      ),
    [dateFilter, search, statusFilter, typeFilter],
  )

  const handleClearFilters = () => {
    setDateFilter(FILTER_ALL_VALUE)
    setSearch('')
    setStatusFilter(FILTER_ALL_VALUE)
    setTypeFilter(FILTER_ALL_VALUE)
  }

  return (
    <div className="min-h-svh bg-login-bg font-sans text-home-text">
      <AuthenticatedAppShell allowedRoles={ombudsmanAreaRoles}>
        <main className="mx-auto w-full max-w-6xl px-5 pt-8 pb-12 min-[390px]:px-7 sm:px-8 md:pt-12 lg:px-12">
          <header className="max-w-2xl">
            <h1 className="max-w-[440px] text-[42px] leading-[1.06] font-black text-home-text sm:text-6xl sm:leading-[1.08]">
              Dashboard de Demandas
            </h1>
            <p className="mt-4 max-w-xl text-base leading-[26px] text-home-brown">
              Facilite a gestão das manifestações com o nosso sistema! Combine organização, produtividade e eficiência
              num só lugar.
            </p>
          </header>

          <MetricCards />

          <section
            aria-labelledby="ombudsman-demands-title"
            className="mt-12 rounded-lg bg-home-action px-4 py-6 sm:px-6 md:px-8 md:py-8"
            id="demandas"
          >
            <h2 className="sr-only" id="ombudsman-demands-title">
              Demandas da Ouvidoria
            </h2>

            <div className="flex w-full flex-col items-start gap-5">
              <SearchField onSearchChange={setSearch} search={search} />

              <div className="mx-auto grid w-full gap-2 md:w-[92%] xl:w-[94%] sm:grid-cols-2 lg:grid-cols-3">
                <FilterSelect
                  id="ombudsman-status-filter"
                  label="Status"
                  onChange={(value) => setStatusFilter(value as StatusFilter)}
                  options={statusOptions}
                  value={statusFilter}
                />
                <FilterSelect
                  id="ombudsman-type-filter"
                  label="Tipo"
                  onChange={setTypeFilter}
                  options={typeOptions}
                  value={typeFilter}
                />
                <DateFilterInput
                  id="ombudsman-date-filter"
                  label="Data"
                  onChange={setDateFilter}
                  value={dateFilter}
                />
              </div>
            </div>

            {filteredManifestations.length > 0 ? (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {filteredManifestations.map((manifestation) => (
                  <ManifestationCard key={manifestation.protocol} manifestation={manifestation} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-lg bg-home-surface px-6 py-8 shadow-home-card">
                <h2 className="text-xl leading-7 font-bold text-home-text">Nenhuma manifestação encontrada</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-home-brown">
                  Ajuste a busca ou limpe os filtros para voltar à lista de demandas da Ouvidoria.
                </p>
                <button
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-home-blue px-5 text-sm leading-5 font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
                  onClick={handleClearFilters}
                  type="button"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </section>
        </main>

        <SiteFooter variant="ombudsman" />
      </AuthenticatedAppShell>
    </div>
  )
}
