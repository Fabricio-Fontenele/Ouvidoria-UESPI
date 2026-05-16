import guarapiMascot from '../assets/guarapi-mascot.png'
import { AuthenticatedAppShell } from '../components/authenticated-app-shell'
import { Icon } from '../components/icon'
import { SiteFooter } from '../components/site-footer'
import { cx } from '../utils/cx'

type ManifestationStatus = 'active' | 'waiting' | 'done'

interface Manifestation {
  area: string
  category: string
  protocol: string
  status: ManifestationStatus
  title: string
  updatedAt: string
}

interface Metric {
  colorClassName?: string
  label: string
  value: string
}

interface Filter {
  isActive?: boolean
  label: string
}

const manifestations: Manifestation[] = [
  {
    area: 'Administração Superior',
    category: 'Sugestão',
    protocol: '#2024-0772',
    status: 'active',
    title: 'Solicitação de Ampliação de Horários na Biblioteca Central',
    updatedAt: '02 Set, 2024',
  },
  {
    area: 'Administração Superior',
    category: 'Sugestão',
    protocol: '#2024-0773',
    status: 'waiting',
    title: 'Solicitação de Ampliação de Horários na Biblioteca Central',
    updatedAt: '02 Set, 2024',
  },
  {
    area: 'Administração Superior',
    category: 'Sugestão',
    protocol: '#2024-0774',
    status: 'done',
    title: 'Solicitação de Ampliação de Horários na Biblioteca Central',
    updatedAt: '02 Set, 2024',
  },
]

const metrics: Metric[] = [
  { label: 'Totais.', value: '17' },
  { colorClassName: 'text-home-warning', label: 'Ativas.', value: '03' },
  { colorClassName: 'text-home-success', label: 'Concluídas.', value: '09' },
]

const filters: Filter[] = [
  { isActive: true, label: 'Todos' },
  { label: 'Ativas' },
  { label: 'Concluídos' },
]

const statusStyles: Record<
  ManifestationStatus,
  {
    accentClassName: string
    badgeClassName: string
    iconClassName: string
    label: string
  }
> = {
  active: {
    accentClassName: 'border-l-home-warning',
    badgeClassName: 'bg-home-warning-strong text-home-text',
    iconClassName: 'bg-home-warning text-white',
    label: 'Ativa',
  },
  waiting: {
    accentClassName: 'border-l-home-blue',
    badgeClassName: 'bg-home-blue text-white',
    iconClassName: 'bg-home-blue text-white',
    label: 'Aguardando',
  },
  done: {
    accentClassName: 'border-l-home-success',
    badgeClassName: 'bg-home-success text-white',
    iconClassName: 'bg-home-success text-white',
    label: 'Concluída',
  },
}

function NewRecordCard() {
  return (
    <section
      aria-labelledby="new-record-title"
      className="rounded-lg border-2 border-home-blue bg-home-surface px-4 pt-6 pb-8 shadow-home-card sm:px-6 sm:pt-7 lg:min-h-[257px]"
    >
      <div className="max-w-[310px] lg:max-w-[380px]">
        <h2 className="text-xl leading-7 font-bold text-home-text" id="new-record-title">
          Novo Registro
        </h2>
        <p className="mt-5 text-sm leading-5 text-home-brown sm:text-base sm:leading-6">
          Precisa registrar uma nova manifestação? Faça isso com a ajuda de nossa agente de IA Guarapi.
        </p>
        <a
          className="mt-6 inline-flex min-h-12 w-full max-w-56 items-center justify-center rounded-lg bg-home-blue px-5 text-lg leading-7 font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          href="#guarapi"
        >
          Fale com o Guarapi
        </a>
      </div>
    </section>
  )
}

function GuarapiChatTrigger() {
  return (
    <a
      aria-label="Abrir chat com o Guarapi"
      className="fixed right-1 bottom-5 z-30 block size-32 rounded-full drop-shadow-home-mascot transition duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-home-blue sm:right-5 sm:bottom-8 sm:size-36 lg:right-8 lg:bottom-10"
      href="#chat-guarapi"
    >
      <img alt="" className="size-full rounded-full object-contain" src={guarapiMascot} />
    </a>
  )
}

function Overview() {
  return (
    <section aria-labelledby="overview-title" className="space-y-6">
      <div className="max-w-2xl">
        <p className="text-sm leading-5 font-bold tracking-[0.1em] text-home-blue uppercase">Visão geral</p>
        <h2 className="mt-3 text-[30px] leading-9 font-bold text-home-text" id="overview-title">
          Resumo
        </h2>
        <p className="mt-4 max-w-xl text-base leading-[26px] text-home-brown">
          Veja os números e métricas em relação às suas manifestações.
        </p>
      </div>

      <dl className="grid w-full max-w-[420px] grid-cols-3 gap-5 sm:gap-8 md:mx-auto md:max-w-xl md:text-center lg:max-w-2xl">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dd className={cx('text-[30px] leading-9 font-bold tabular-nums md:text-5xl md:leading-none lg:text-6xl', metric.colorClassName ?? 'text-home-text')}>
              {metric.value}
            </dd>
            <dt className="text-xs leading-5 text-home-brown md:mt-2 md:text-sm">{metric.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function FilterBar() {
  return (
    <div className="mx-auto flex w-full gap-3 overflow-x-auto pr-1 sm:overflow-visible md:w-[92%] xl:w-[94%]">
      {filters.map((filter) => {
        const filterClasses = filter.isActive ? 'bg-home-blue text-white' : 'bg-home-chip text-home-brown hover:bg-home-chip/80'

        return (
          <button
            aria-pressed={filter.isActive ?? false}
            className={cx(
              'min-h-8 min-w-[95px] rounded-full px-4 text-xs leading-5 font-semibold transition duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue',
              filterClasses,
            )}
            key={filter.label}
            type="button"
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}

function SearchField() {
  return (
    <label className="mx-auto block w-full md:w-[92%] xl:w-[94%]" htmlFor="manifestation-search">
      <span className="sr-only">Buscar manifestação</span>
      <span className="grid h-9 grid-cols-[18px_1fr] items-center gap-4 rounded-full bg-home-field px-4 text-home-muted outline-home-blue focus-within:outline-2 focus-within:outline-offset-2 md:h-10 md:px-5">
        <Icon className="size-[18px]" name="search" />
        <input
          className="min-w-0 bg-transparent text-sm leading-none text-home-text outline-none placeholder:text-home-muted"
          id="manifestation-search"
          placeholder="Buscar manifestação..."
          type="search"
        />
      </span>
    </label>
  )
}

function ManifestationCard({ manifestation }: { manifestation: Manifestation }) {
  const styles = statusStyles[manifestation.status]

  return (
    <article className={cx('rounded-lg border-l-4 bg-home-surface px-4 py-4 shadow-home-card sm:px-6 sm:py-5', styles.accentClassName)}>
      <div className="grid grid-cols-[32px_1fr] gap-4">
        <span className={cx('grid size-8 place-items-center rounded-full', styles.iconClassName)}>
          <Icon className="size-4" name="info" />
        </span>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs leading-4 font-bold tracking-[0.05em] text-home-brown/60 uppercase">
              Protocolo
              <br />
              {manifestation.protocol}
            </p>
            <span className={cx('rounded px-2 py-1 text-[10px] leading-[15px] font-black uppercase', styles.badgeClassName)}>{styles.label}</span>
          </div>

          <h3 className="mt-3 text-lg leading-[22.5px] font-bold text-home-text">{manifestation.title}</h3>
          <p className="mt-2 text-sm leading-5 text-home-brown">
            {manifestation.category} • {manifestation.area}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs leading-4 font-bold text-home-brown/40 uppercase">Última atualização</p>
          <p className="mt-1 text-sm leading-5 font-semibold text-home-text">{manifestation.updatedAt}</p>
        </div>
        <a
          aria-label={`Abrir manifestação ${manifestation.protocol}`}
          className="grid size-10 place-items-center rounded-lg bg-home-action text-home-text transition duration-150 hover:bg-home-chip active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          href={`#manifestacao-${manifestation.protocol.replace('#', '')}`}
        >
          <Icon className="size-4" name="chevron-right" />
        </a>
      </div>
    </article>
  )
}

export function HomePage() {
  return (
    <div className="min-h-svh bg-home-surface font-sans text-home-text">
      <AuthenticatedAppShell>
        <main className="mx-auto w-full max-w-6xl px-4 pt-10 min-[375px]:px-[30px] sm:px-8 md:pt-14 lg:px-12">
          <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-start lg:gap-12">
            <div>
              <h1 className="max-w-[342px] text-5xl leading-none font-black text-home-text sm:max-w-xl sm:text-6xl lg:text-7xl">
                Minhas Manifestações
              </h1>
              <p className="mt-4 max-w-[342px] text-base leading-[26px] text-home-brown sm:max-w-lg">
                Acompanhe o progresso e registre suas manifestações.
              </p>
            </div>

            <NewRecordCard />
          </section>

          <section className="mt-14 space-y-8 md:mt-16 lg:space-y-10">
            <Overview />

            <div className="space-y-6" id="buscar-manifestacao">
              <div className="flex w-full flex-col items-start gap-5">
                <FilterBar />
                <SearchField />
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {manifestations.map((manifestation) => (
                  <ManifestationCard key={manifestation.protocol} manifestation={manifestation} />
                ))}
              </div>
            </div>
          </section>
        </main>

        <SiteFooter variant="home" />
        <GuarapiChatTrigger />
      </AuthenticatedAppShell>
    </div>
  )
}
