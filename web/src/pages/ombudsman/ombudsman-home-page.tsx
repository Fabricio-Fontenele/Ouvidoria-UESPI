import { useEffect, useMemo, useState } from 'react'

import { FILTER_ALL_VALUE, ombudsmanAreaRoles } from '../../app/access-policy'
import type { FilterAllValue } from '../../app/access-policy'
import { buildLocalDateRangeBounds, formatBrazilianShortDate, isLocalDateRangeInOrder } from '../../app/date-utils'
import { buildOmbudsmanManifestationDetailsHref } from '../../app/routes'
import type { Catalog } from '../../application/catalog/catalog-types'
import {
  buildEmptyManifestationStatusTotals,
  getManifestationStatusContract,
  manifestationStatusContracts,
} from '../../application/manifestations/manifestation-status-contract'
import type { ManifestationStatus } from '../../application/manifestations/manifestation-status-contract'
import type { ManifestationStatusTotals } from '../../application/manifestations/manifestation-status-contract'
import type { ManifestationSummary } from '../../application/manifestations/manifestation-summary-contract'
import {
  getManifestationTypeLabel,
  manifestationTypeContracts,
} from '../../application/manifestations/manifestation-type-contract'
import type { ManifestationType } from '../../application/manifestations/manifestation-type-contract'
import { searchManifestations } from '../../application/manifestations/search-manifestations'
import type { OmbudsmanListFilters } from '../../application/ombudsman/ombudsman-service'
import type { PaginationMeta } from '../../application/pagination/pagination-contract'
import { Icon } from '../../components/icons/icon'
import type { IconName } from '../../components/icons/icon'
import { AuthenticatedAppShell } from '../../components/layout/authenticated-app-shell'
import { SiteFooter } from '../../components/layout/site-footer'
import { getManifestationStatusStyle } from '../../components/manifestations/manifestation-status-style'
import { PaginationControls } from '../../components/navigation/pagination-controls'
import { useCatalog } from '../../hooks/use-catalog'
import { makeOmbudsmanService } from '../../infrastructure/ombudsman/ombudsman-service-factory'
import { cx } from '../../utils/cx'

type StatusFilter = FilterAllValue | ManifestationStatus
type TypeFilter = FilterAllValue | ManifestationType
type LoadStatus = 'loading' | 'ready' | 'error'

interface DateRangeFilter {
  from: string
  to: string
}

interface FilterSelectOption {
  label: string
  value: string
}

interface FilterSelectProps {
  id: string
  label: string
  onChange: (value: string) => void
  options: FilterSelectOption[]
  value: string
}

interface DateRangeFilterInputProps {
  error: string | null
  onChange: (range: DateRangeFilter) => void
  value: DateRangeFilter
}

interface CheckboxFilterProps {
  checked: boolean
  id: string
  label: string
  onChange: (checked: boolean) => void
}

const dashboardMetricCards: Array<{
  anchorId: string
  caption: string
  icon: IconName
  label: string
  status: ManifestationStatus | null
}> = [
  {
    anchorId: 'demandas',
    caption: 'Manifestações recebidas pela Ouvidoria',
    icon: 'file-text',
    label: 'Total',
    status: null,
  },
  {
    anchorId: 'em-analise',
    caption: 'Aguardam triagem ou resposta',
    icon: 'clock',
    label: 'Em análise',
    status: 'in_analysis',
  },
  {
    anchorId: 'pendentes',
    caption: 'Encaminhadas para setor responsável',
    icon: 'clock',
    label: 'Aguardando setor',
    status: 'awaiting_unit',
  },
  {
    anchorId: 'respondidas',
    caption: 'Respostas administrativas registradas',
    icon: 'message-circle',
    label: 'Respondidas',
    status: 'answered',
  },
  {
    anchorId: 'finalizadas',
    caption: 'Manifestações encerradas no histórico',
    icon: 'check-circle',
    label: 'Finalizadas',
    status: 'finalized',
  },
  {
    anchorId: 'canceladas',
    caption: 'Registros cancelados no fluxo',
    icon: 'x',
    label: 'Canceladas',
    status: 'canceled',
  },
]

const metricCardClasses = [
  'group relative overflow-hidden rounded-lg border border-login-brown/10 bg-home-surface',
  'px-4 py-4 shadow-login-card transition duration-150 hover:-translate-y-0.5 hover:shadow-landing-card',
  'focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-home-blue',
  'min-[390px]:px-5 sm:px-6 sm:py-6 md:px-7 md:py-7',
]

const manifestationCardClasses = [
  'group relative w-full min-w-0 overflow-hidden rounded-lg bg-home-surface px-5 py-5 shadow-login-card',
  'transition duration-150 hover:-translate-y-0.5 hover:shadow-landing-card sm:px-6 sm:py-6 md:px-7',
]

const filterControlBaseClasses = [
  'flex min-h-10 w-full items-center rounded-lg border px-3 transition duration-150',
  'focus-within:bg-home-action/70 focus-within:outline-none',
].join(' ')

const filterControlActiveClasses = 'border-login-brown/10 bg-home-surface text-home-text hover:bg-home-action/70'
const filterControlErrorClasses = 'border-red-700 bg-home-surface text-home-text'
const filterControlInactiveClasses = 'border-login-brown/10 bg-home-surface/80 text-home-brown hover:bg-home-action/70'
const filterLabelClasses = 'px-1 text-xs leading-4 font-black tracking-[0.08em] text-home-brown/70 uppercase md:text-sm'
const filterSubLabelClasses = 'px-1 text-[11px] leading-4 font-black text-home-brown/70'

const initialPagination: PaginationMeta = {
  page: 1,
  pageSize: 0,
  totalItems: 0,
  totalPages: 1,
}

const emptyDateRangeFilter: DateRangeFilter = {
  from: '',
  to: '',
}

function buildAreaLabel(catalog: Catalog | null, manifestation: ManifestationSummary) {
  const campus = catalog?.campuses.find((entry) => entry.id === manifestation.campusId)
  const unit = campus?.administrativeUnits.find((entry) => entry.id === manifestation.administrativeUnitId)

  if (campus === undefined || unit === undefined) {
    return 'Unidade não identificada'
  }

  return `${campus.label} — ${unit.label}`
}

function buildFiltersForRequest({
  statusFilter,
  typeFilter,
  dateRangeFilter,
  onlyMine,
  page,
}: {
  statusFilter: StatusFilter
  typeFilter: TypeFilter
  dateRangeFilter: DateRangeFilter
  onlyMine: boolean
  page: number
}): OmbudsmanListFilters {
  const filters: OmbudsmanListFilters = { page }

  if (statusFilter !== FILTER_ALL_VALUE) {
    filters.status = statusFilter
  }

  if (typeFilter !== FILTER_ALL_VALUE) {
    filters.type = typeFilter
  }

  if (onlyMine) {
    filters.onlyMine = true
  }

  const dateRangeBounds = buildLocalDateRangeBounds(dateRangeFilter)

  if (dateRangeBounds !== null) {
    if (dateRangeBounds.from !== undefined) {
      filters.from = dateRangeBounds.from
    }

    if (dateRangeBounds.to !== undefined) {
      filters.to = dateRangeBounds.to
    }
  }

  return filters
}

function getDateRangeError(dateRangeFilter: DateRangeFilter) {
  if (!isLocalDateRangeInOrder(dateRangeFilter)) {
    return 'A data final deve ser igual ou posterior à data inicial.'
  }

  return null
}

function MetricCards({
  loadStatus,
  statusTotals,
  totalItems,
}: {
  loadStatus: LoadStatus
  statusTotals: ManifestationStatusTotals
  totalItems: number
}) {
  return (
    <section aria-labelledby="ombudsman-metrics-title" className="mt-10">
      <h2 className="sr-only" id="ombudsman-metrics-title">
        Indicadores das demandas
      </h2>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 lg:gap-6">
        {dashboardMetricCards.map((metric) => {
          const statusStyle = metric.status === null ? null : getManifestationStatusStyle(metric.status)
          const colorClasses =
            statusStyle === null
              ? {
                  badgeClassName: 'bg-home-text text-white',
                  iconClassName: 'bg-home-text text-white',
                  textClassName: 'text-home-text',
                }
              : statusStyle
          const metricValue = metric.status === null ? totalItems : statusTotals[metric.status]

          return (
            <div className={metricCardClasses.join(' ')} id={metric.anchorId} key={metric.label}>
              <div
                className={cx(
                  'absolute inset-x-0 top-0 h-1 opacity-0 transition duration-150 group-hover:opacity-100',
                  colorClasses.iconClassName,
                )}
              />
              <dt className="flex items-start justify-between gap-3">
                <span>
                  <span className={cx('block text-sm leading-5 font-black md:text-base', colorClasses.textClassName)}>
                    {metric.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-home-brown">{metric.caption}</span>
                </span>
                <span
                  className={cx(
                    'grid size-10 shrink-0 place-items-center rounded-lg md:size-11',
                    colorClasses.iconClassName,
                  )}
                >
                  <Icon className="size-5 md:size-6" name={metric.icon} />
                </span>
              </dt>
              <dd className="mt-5">
                <span
                  className={cx(
                    'text-4xl leading-none font-black tabular-nums md:text-5xl',
                    colorClasses.textClassName,
                  )}
                >
                  {loadStatus === 'loading' ? '—' : String(metricValue).padStart(2, '0')}
                </span>
              </dd>
            </div>
          )
        })}
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
          placeholder="Buscar por protocolo ou descrição..."
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
    <label className="grid w-full gap-1.5" htmlFor={id}>
      <span className={filterLabelClasses}>{label}</span>
      <span
        className={cx(filterControlBaseClasses, isActive ? filterControlActiveClasses : filterControlInactiveClasses)}
      >
        <select
          className="min-h-10 w-full cursor-pointer bg-transparent text-xs leading-5 font-semibold outline-none md:text-sm"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option className="bg-home-surface text-home-text" value={FILTER_ALL_VALUE}>
            Todos
          </option>
          {options.map((option) => (
            <option className="bg-home-surface text-home-text" key={`${id}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}

function DateRangeFilterInput({ error, onChange, value }: DateRangeFilterInputProps) {
  const errorId = 'ombudsman-date-range-error'
  const fromId = 'ombudsman-date-range-from'
  const isFromActive = value.from !== ''
  const isToActive = value.to !== ''
  const toId = 'ombudsman-date-range-to'

  return (
    <fieldset aria-describedby={error === null ? undefined : errorId} className="grid w-full gap-1.5 sm:col-span-2">
      <legend className={filterLabelClasses}>Período</legend>
      <div className="grid items-end gap-2 min-[520px]:grid-cols-[1fr_auto_1fr]">
        <label className="grid gap-1.5" htmlFor={fromId}>
          <span className={filterSubLabelClasses}>desde</span>
          <span
            className={cx(
              filterControlBaseClasses,
              error !== null
                ? filterControlErrorClasses
                : isFromActive
                  ? filterControlActiveClasses
                  : filterControlInactiveClasses,
            )}
          >
            <input
              aria-invalid={error === null ? undefined : true}
              className="min-h-10 w-full cursor-pointer bg-transparent text-xs leading-5 font-semibold outline-none [color-scheme:light] md:text-sm"
              id={fromId}
              max={value.to === '' ? undefined : value.to}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
              title="Data inicial"
              type="date"
              value={value.from}
            />
          </span>
        </label>
        <span className="hidden pb-2 text-xs leading-5 font-black text-home-brown/70 min-[520px]:block">até</span>
        <label className="grid gap-1.5" htmlFor={toId}>
          <span className={filterSubLabelClasses}>até</span>
          <span
            className={cx(
              filterControlBaseClasses,
              error !== null
                ? filterControlErrorClasses
                : isToActive
                  ? filterControlActiveClasses
                  : filterControlInactiveClasses,
            )}
          >
            <input
              aria-invalid={error === null ? undefined : true}
              className="min-h-10 w-full cursor-pointer bg-transparent text-xs leading-5 font-semibold outline-none [color-scheme:light] md:text-sm"
              id={toId}
              min={value.from === '' ? undefined : value.from}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
              title="Data final"
              type="date"
              value={value.to}
            />
          </span>
        </label>
      </div>
      {error !== null ? (
        <p className="text-xs leading-5 font-bold text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}

function CheckboxFilter({ checked, id, label, onChange }: CheckboxFilterProps) {
  return (
    <label
      className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border border-login-brown/10 bg-home-surface px-3 text-sm leading-5 font-bold text-home-text transition duration-150 hover:bg-home-action/70 sm:col-span-2 lg:col-span-4"
      htmlFor={id}
    >
      <input
        checked={checked}
        className="size-4 accent-home-blue"
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}

function StatusBadge({ status }: { status: ManifestationStatus }) {
  const statusContract = getManifestationStatusContract(status)
  const statusStyle = getManifestationStatusStyle(status)

  return (
    <span
      className={cx(
        'inline-flex min-h-8 items-center rounded-lg border border-current bg-transparent px-4 text-xs leading-4 font-black tracking-[0.08em] uppercase',
        statusStyle.textClassName,
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

function ManifestationCard({
  catalog,
  manifestation,
}: {
  catalog: Catalog | null
  manifestation: ManifestationSummary
}) {
  const statusStyle = getManifestationStatusStyle(manifestation.status)
  const areaLabel = buildAreaLabel(catalog, manifestation)
  const typeLabel = getManifestationTypeLabel(manifestation.type)
  const createdAtLabel = formatBrazilianShortDate(manifestation.createdAt)
  const protocolId = manifestation.protocol.replace(/[^a-z0-9]/gi, '')

  return (
    <article
      aria-labelledby={`${protocolId}-title`}
      className={cx(manifestationCardClasses.join(' '), 'border-l-4', statusStyle.accentClassName)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-0 grid-cols-[40px_1fr] gap-3">
          <span className={cx('grid size-10 place-items-center rounded-lg', statusStyle.iconClassName)}>
            <Icon className="size-7" name="info" />
          </span>
          <div className="min-w-0">
            <p className={cx('text-xs leading-4 font-black tracking-[0.1em] uppercase', statusStyle.textClassName)}>
              Manifestação
            </p>
            <h2 className="mt-1 truncate text-2xl leading-8 font-black text-home-text" id={`${protocolId}-title`}>
              {manifestation.protocol}
            </h2>
          </div>
        </div>
        <div className="shrink-0">
          <StatusBadge status={manifestation.status} />
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-home-brown break-words">{manifestation.description}</p>

      <dl className="mt-5 grid grid-cols-1 gap-4 rounded-lg bg-home-action/75 px-4 py-4 sm:grid-cols-2">
        <DetailItem label="Tipo" value={typeLabel} />
        <DetailItem label="Área responsável" value={areaLabel} />
      </dl>

      <div className="mt-5 flex flex-col gap-4 border-t border-login-brown/10 pt-5 min-[460px]:flex-row min-[460px]:items-center min-[460px]:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] leading-4 font-black tracking-[0.08em] text-home-brown/60 uppercase">Aberta em</p>
          <p className="mt-1 text-sm leading-5 font-semibold text-home-text">{createdAtLabel}</p>
        </div>
        <a
          aria-label={`Abrir manifestação ${manifestation.protocol}`}
          className={cx(
            'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-current bg-transparent px-5 text-sm leading-5 font-bold no-underline transition duration-150 hover:bg-home-action active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current',
            statusStyle.textClassName,
          )}
          href={buildOmbudsmanManifestationDetailsHref(manifestation.id)}
        >
          Abrir demanda
          <Icon className="size-4" name="chevron-right" />
        </a>
      </div>
    </article>
  )
}

export function OmbudsmanHomePage() {
  const ombudsmanService = useMemo(() => makeOmbudsmanService(), [])
  const { catalog } = useCatalog()
  const [manifestations, setManifestations] = useState<ManifestationSummary[]>([])
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(emptyDateRangeFilter)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(FILTER_ALL_VALUE)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(FILTER_ALL_VALUE)
  const [onlyMine, setOnlyMine] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination)
  const [metricsLoadStatus, setMetricsLoadStatus] = useState<LoadStatus>('loading')
  const [metricsTotalItems, setMetricsTotalItems] = useState(0)
  const [statusTotals, setStatusTotals] = useState<ManifestationStatusTotals>(buildEmptyManifestationStatusTotals)

  const statusOptions: FilterSelectOption[] = manifestationStatusContracts.map((status) => ({
    label: status.filterLabel,
    value: status.value,
  }))
  const typeOptions: FilterSelectOption[] = manifestationTypeContracts.map((type) => ({
    label: type.label,
    value: type.value,
  }))
  const dateRangeError = getDateRangeError(dateRangeFilter)

  useEffect(() => {
    let isMounted = true

    async function loadMetrics() {
      setMetricsLoadStatus('loading')

      try {
        const result = await ombudsmanService.getMetrics({})

        if (!isMounted) {
          return
        }

        setStatusTotals(result.statusTotals)
        setMetricsTotalItems(result.totalItems)
        setMetricsLoadStatus('ready')
      } catch {
        if (!isMounted) {
          return
        }

        setStatusTotals(buildEmptyManifestationStatusTotals())
        setMetricsTotalItems(0)
        setMetricsLoadStatus('error')
      }
    }

    void loadMetrics()

    return () => {
      isMounted = false
    }
  }, [ombudsmanService])

  useEffect(() => {
    let isMounted = true

    async function load() {
      if (dateRangeError !== null) {
        return
      }

      setLoadStatus('loading')
      setLoadError(null)

      try {
        const result = await ombudsmanService.list(
          buildFiltersForRequest({ dateRangeFilter, onlyMine, page, statusFilter, typeFilter }),
        )

        if (!isMounted) {
          return
        }

        setManifestations(result.manifestations)
        setPagination({
          page: result.page,
          pageSize: result.pageSize,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        })
        setLoadStatus('ready')
      } catch (error) {
        if (!isMounted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Não foi possível carregar as manifestações.'
        setLoadError(message)
        setLoadStatus('error')
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [dateRangeError, dateRangeFilter, ombudsmanService, onlyMine, page, statusFilter, typeFilter])

  const filteredManifestations = useMemo(() => searchManifestations(manifestations, search), [manifestations, search])

  const handleClearFilters = () => {
    setDateRangeFilter(emptyDateRangeFilter)
    setOnlyMine(false)
    setPage(1)
    setSearch('')
    setStatusFilter(FILTER_ALL_VALUE)
    setTypeFilter(FILTER_ALL_VALUE)
  }
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setPage(1)
  }
  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as TypeFilter)
    setPage(1)
  }
  const handleDateRangeFilterChange = (value: DateRangeFilter) => {
    setDateRangeFilter(value)
    setPage(1)
  }
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const handleOnlyMineChange = (value: boolean) => {
    setOnlyMine(value)
    setPage(1)
  }

  return (
    <div className="min-h-svh bg-login-bg font-sans text-home-text">
      <AuthenticatedAppShell allowedRoles={ombudsmanAreaRoles}>
        <div className="flex min-h-[calc(100svh-5.5rem)] flex-col md:min-h-[calc(100svh-6rem)]">
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-8 pb-12 min-[390px]:px-7 sm:px-8 md:pt-12 lg:px-12">
            <header className="max-w-2xl">
              <h1 className="max-w-[440px] text-[42px] leading-[1.06] font-black text-home-text sm:text-6xl sm:leading-[1.08]">
                Dashboard de Demandas
              </h1>
              <p className="mt-4 max-w-xl text-base leading-[26px] text-home-brown">
                Acompanhe e atue nas manifestações da Ouvidoria. Use os filtros para priorizar o que precisa de
                resposta.
              </p>
            </header>

            <MetricCards loadStatus={metricsLoadStatus} statusTotals={statusTotals} totalItems={metricsTotalItems} />

            <section
              aria-labelledby="ombudsman-demands-title"
              className="mt-12 rounded-lg bg-home-action px-4 py-6 sm:px-6 md:px-8 md:py-8"
              id="demandas"
            >
              <h2 className="sr-only" id="ombudsman-demands-title">
                Demandas da Ouvidoria
              </h2>

              <div className="flex w-full flex-col items-start gap-5">
                <SearchField onSearchChange={handleSearchChange} search={search} />

                <div className="mx-auto grid w-full gap-2 md:w-[92%] xl:w-[94%] sm:grid-cols-2 lg:grid-cols-4">
                  <FilterSelect
                    id="ombudsman-status-filter"
                    label="Status"
                    onChange={handleStatusFilterChange}
                    options={statusOptions}
                    value={statusFilter}
                  />
                  <FilterSelect
                    id="ombudsman-type-filter"
                    label="Tipo"
                    onChange={handleTypeFilterChange}
                    options={typeOptions}
                    value={typeFilter}
                  />
                  <DateRangeFilterInput
                    error={dateRangeError}
                    onChange={handleDateRangeFilterChange}
                    value={dateRangeFilter}
                  />
                  <CheckboxFilter
                    checked={onlyMine}
                    id="ombudsman-only-mine-filter"
                    label="Minhas demandas"
                    onChange={handleOnlyMineChange}
                  />
                </div>
              </div>

              {loadStatus === 'loading' ? (
                <div className="mt-6 rounded-lg bg-home-surface px-6 py-8 text-center text-sm leading-6 text-home-brown">
                  Carregando manifestações...
                </div>
              ) : null}

              {loadStatus === 'error' ? (
                <div className="mt-6 rounded-lg bg-home-surface px-6 py-8 shadow-home-card">
                  <h2 className="text-xl leading-7 font-bold text-home-text">
                    Não foi possível carregar as manifestações
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-home-brown">
                    {loadError ?? 'Tente novamente em alguns instantes.'}
                  </p>
                </div>
              ) : null}

              {loadStatus === 'ready' ? (
                filteredManifestations.length > 0 ? (
                  <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {filteredManifestations.map((manifestation) => (
                      <ManifestationCard catalog={catalog} key={manifestation.id} manifestation={manifestation} />
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
                )
              ) : null}

              {loadStatus === 'ready' && manifestations.length > 0 ? (
                <div className="mt-8">
                  <PaginationControls
                    ariaLabel="Paginação das demandas da Ouvidoria"
                    onPageChange={setPage}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                  />
                </div>
              ) : null}
            </section>
          </main>

          <SiteFooter className="mt-0" variant="ombudsman" />
        </div>
      </AuthenticatedAppShell>
    </div>
  )
}
