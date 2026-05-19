import { useEffect, useMemo, useState } from 'react'

import { buildManifestationFormHref, getSearchParams, normalizeProtocol, replaceWith, routes } from '../app/routes'
import guaraMascot from '../assets/guara-mascot.png'
import { getGuaraInitialMessages, getGuaraSuggestions } from '../application/guara-chat/guara-chat-content'
import type { GuaraChatSuggestion } from '../application/guara-chat/guara-chat-content'
import type { GuaraChatMode, GuaraMessage } from '../application/guara-chat/guara-chat-types'
import { getManifestationStatusContract } from '../application/manifestations/manifestation-status-contract'
import type { ManifestationStatus } from '../application/manifestations/manifestation-status-contract'
import { Icon } from '../components/icons/icon'
import { AppHeader } from '../components/layout/app-header'
import { SiteFooter } from '../components/layout/site-footer'
import { getManifestationStatusBadgeClassName } from '../components/manifestations/manifestation-status-style'
import { useAuth } from '../hooks/use-auth'
import { useGuaraChat } from '../hooks/use-guara-chat'
import { cx } from '../utils/cx'

interface DetailItem {
  label: string
  value: string
}

const manifestationDetailStatus: ManifestationStatus = 'in_analysis'

const manifestationDetails: DetailItem[] = [
  { label: 'Protocolo', value: '#2024-0772' },
  { label: 'Tipo', value: 'Sugestão' },
  { label: 'Área', value: 'Administração Superior' },
  { label: 'Status', value: getManifestationStatusContract(manifestationDetailStatus).viewLabel },
  { label: 'Última atualização', value: '02 Set, 2024' },
]

function resolveMode() {
  const searchParams = getSearchParams()
  const protocol = searchParams.get('protocol')
  const mode = searchParams.get('mode')

  if (protocol !== null && protocol.trim() !== '') {
    return {
      mode: 'manifestation-detail' as const,
      protocol: normalizeProtocol(protocol),
    }
  }

  if (mode === 'new') {
    return {
      mode: 'new-manifestation' as const,
      protocol: null,
    }
  }

  return {
    mode: 'general' as const,
    protocol: null,
  }
}

function getPageCopy(mode: GuaraChatMode, protocol: string | null) {
  if (mode === 'manifestation-detail') {
    return {
      eyebrow: 'Detalhes do chamado',
      title: protocol ?? 'Chamado',
      description:
        'Acompanhe o resumo da manifestação e converse com o Guará para entender o andamento ou preparar uma nova interação.',
    }
  }

  if (mode === 'new-manifestation') {
    return {
      eyebrow: 'Novo registro',
      title: 'Fale com o Guará',
      description: 'O Guará ajuda você a organizar as informações antes de registrar uma manifestação na Ouvidoria.',
    }
  }

  return {
    eyebrow: 'Atendimento assistido',
    title: 'Fale com o Guará',
    description: 'Tire dúvidas sobre a Ouvidoria, entenda tipos de manifestação e receba apoio para usar o sistema.',
  }
}

function MessageBubble({ message }: { message: GuaraMessage }) {
  const isGuara = message.author === 'guara'

  return (
    <li className={cx('flex items-end gap-2', isGuara ? 'justify-start' : 'justify-end')}>
      {isGuara ? (
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-landing-chip bg-landing-surface">
          <img alt="" className="size-7 object-contain" src={guaraMascot} />
        </span>
      ) : null}
      <div
        className={cx(
          'max-w-[min(78%,42rem)] px-4 py-3 text-sm leading-6 shadow-landing-step sm:text-[15px]',
          isGuara
            ? 'rounded-2xl rounded-bl-sm border border-landing-chip bg-landing-surface text-landing-text'
            : 'rounded-2xl rounded-br-sm bg-landing-blue text-white',
        )}
      >
        <span className="sr-only">{isGuara ? 'Mensagem do Guará: ' : 'Sua mensagem: '}</span>
        {message.text}
      </div>
      {!isGuara ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-landing-footer text-landing-brown">
          <Icon className="size-4" name="user" />
        </span>
      ) : null}
    </li>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" role="status">
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-landing-chip bg-landing-surface">
        <img alt="" className="size-7 object-contain" src={guaraMascot} />
      </span>
      <div className="flex min-h-11 items-center gap-2 rounded-2xl rounded-bl-sm border border-landing-chip bg-landing-surface px-4 shadow-landing-step">
        <span className="sr-only">Guará está respondendo</span>
        <span className="size-2 rounded-full bg-landing-blue/70 motion-safe:animate-pulse" />
        <span className="size-2 rounded-full bg-landing-blue/60 motion-safe:animate-pulse" />
        <span className="size-2 rounded-full bg-landing-blue/50 motion-safe:animate-pulse" />
      </div>
    </div>
  )
}

function DetailPanel({ protocol }: { protocol: string }) {
  const formHref = buildManifestationFormHref(protocol)
  const status = getManifestationStatusContract(manifestationDetailStatus)

  return (
    <aside className="rounded-lg border border-landing-chip bg-landing-surface p-5 shadow-landing-step">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs leading-4 font-black tracking-[0.1em] text-landing-blue uppercase">Manifestação</p>
          <h2 className="mt-2 text-2xl leading-8 font-black text-landing-text">{protocol}</h2>
        </div>
        <span className={getManifestationStatusBadgeClassName(manifestationDetailStatus, 'px-2.5 leading-none')}>
          {status.viewLabel}
        </span>
      </div>

      <dl className="mt-6 space-y-4">
        {manifestationDetails.map((item) => (
          <div key={item.label}>
            <dt className="text-xs leading-4 font-bold tracking-[0.08em] text-landing-brown/60 uppercase">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm leading-5 font-semibold text-landing-text">
              {item.label === 'Protocolo' ? protocol : item.value}
            </dd>
          </div>
        ))}
      </dl>

      <a
        className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-landing-blue px-4 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
        href={formHref}
      >
        Editar manifestação
        <Icon className="size-4" name="file-text" />
      </a>

      <a
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border-2 border-landing-blue px-4 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:bg-landing-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
        href={routes.home}
      >
        Voltar para manifestações
      </a>
    </aside>
  )
}

function QuickActions({
  isSending,
  onSelect,
  suggestions,
}: {
  isSending: boolean
  onSelect: (suggestion: GuaraChatSuggestion) => void
  suggestions: GuaraChatSuggestion[]
}) {
  return (
    <div aria-label="Sugestões de mensagens" className="flex gap-2 overflow-x-auto pb-1" role="list">
      {suggestions.map((suggestion) => (
        <div className="shrink-0" key={suggestion.id} role="listitem">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-landing-chip bg-landing-surface px-4 text-xs leading-5 font-bold text-landing-brown transition duration-150 hover:border-landing-blue hover:bg-landing-blue/10 hover:text-landing-blue active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            disabled={isSending}
            onClick={() => onSelect(suggestion)}
            type="button"
          >
            <Icon className="size-4" name="message-circle" />
            {suggestion.label}
          </button>
        </div>
      ))}
    </div>
  )
}

function ChatPanel({ mode, protocol }: { mode: GuaraChatMode; protocol: string | null }) {
  const [draft, setDraft] = useState('')
  const initialMessages = useMemo(() => getGuaraInitialMessages(mode), [mode])
  const suggestions = useMemo(() => getGuaraSuggestions(mode), [mode])
  const formHref =
    mode === 'manifestation-detail' && protocol !== null
      ? buildManifestationFormHref(protocol)
      : routes.manifestationForm
  const formCta = mode === 'manifestation-detail' ? 'Editar manifestação' : 'Preencher manualmente'
  const { error, isSending, messages, sendMessage } = useGuaraChat({
    context: {
      mode,
      protocol,
    },
    initialMessages,
  })

  const handleSubmit = async () => {
    const message = draft.trim()

    if (message.length === 0 || isSending) {
      return
    }

    setDraft('')
    await sendMessage(message)
  }

  const handleSuggestionSelect = async (suggestion: GuaraChatSuggestion) => {
    if (isSending) {
      return
    }

    setDraft('')
    await sendMessage(suggestion.message)
  }

  return (
    <section
      aria-labelledby="guara-chat-title"
      className="isolate flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-landing-chip bg-landing-surface shadow-landing-step md:min-h-[720px]"
    >
      <div className="flex items-center gap-4 border-b border-landing-chip bg-landing-surface px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-landing-chip bg-landing-muted-surface sm:size-14">
            <img alt="" className="size-11 object-contain sm:size-12" src={guaraMascot} />
            <span className="absolute right-1 bottom-1 size-3 rounded-full border-2 border-landing-surface bg-landing-success" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg leading-6 font-black text-landing-text sm:text-xl" id="guara-chat-title">
              Guará
            </h2>
            <p className="truncate text-xs leading-5 text-landing-brown sm:text-sm">Assistente da Ouvidoria UESPI</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-landing-muted-surface px-3 py-5 sm:px-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <div className="flex justify-center">
            <span className="rounded-full border border-landing-chip bg-landing-surface px-3 py-1 text-xs leading-5 font-bold text-landing-menu shadow-landing-step">
              Hoje
            </span>
          </div>
          <ul className="flex flex-col gap-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
          {isSending ? <TypingIndicator /> : null}
        </div>
      </div>

      <div className="space-y-3 border-t border-landing-chip bg-landing-surface px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <QuickActions
            isSending={isSending}
            onSelect={(suggestion) => void handleSuggestionSelect(suggestion)}
            suggestions={suggestions}
          />

          <a
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-landing-blue px-4 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:bg-landing-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
            href={formHref}
          >
            <Icon className="size-4" name="file-text" />
            {formCta}
          </a>
        </div>

        {error !== null ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-landing-brown/20 bg-landing-footer px-3 py-2 text-sm leading-5 font-bold text-landing-brown"
            role="alert"
          >
            <Icon className="mt-0.5 size-4 shrink-0" name="info" />
            <p>{error}</p>
          </div>
        ) : null}

        <form
          className="grid grid-cols-[1fr_48px] items-end gap-2 rounded-full border border-landing-chip bg-landing-muted-surface p-2 transition duration-150 focus-within:border-landing-blue focus-within:bg-landing-surface focus-within:shadow-landing-step"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          <label className="sr-only" htmlFor="guara-message">
            Mensagem para o Guará
          </label>
          <textarea
            className="max-h-32 min-h-11 resize-none rounded-full bg-transparent px-4 py-3 text-sm leading-5 text-landing-text outline-none placeholder:text-landing-menu focus-visible:outline-none"
            id="guara-message"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Mensagem"
            rows={1}
            value={draft}
          />
          <button
            aria-label="Enviar mensagem"
            className="grid size-12 place-items-center self-end rounded-full bg-landing-blue text-white transition duration-150 hover:bg-landing-blue/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue disabled:cursor-not-allowed disabled:bg-landing-menu disabled:opacity-70"
            disabled={isSending || draft.trim().length === 0}
            type="submit"
          >
            <Icon className="size-5" name="send" />
          </button>
        </form>
      </div>
    </section>
  )
}

export function GuaraPage() {
  const { mode, protocol } = resolveMode()
  const { isAuthenticated, isLoading } = useAuth()
  const copy = getPageCopy(mode, protocol)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      replaceWith(routes.login)
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
        <AppHeader />

        <main className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-8 md:pt-14 lg:px-12">
          <p className="text-base leading-7 text-landing-brown" role="status">
            Redirecionando para o acesso ao sistema...
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
      <AppHeader isAuthenticated />

      <main className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-8 md:pt-14 lg:px-12">
        <section>
          <div>
            <p className="text-sm leading-5 font-black tracking-[0.1em] text-landing-blue uppercase">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-[38px] leading-none font-black text-landing-text sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-landing-brown">{copy.description}</p>
          </div>
        </section>

        <div className="mt-8 lg:mt-10">
          <ChatPanel mode={mode} protocol={protocol} />
        </div>

        {mode === 'manifestation-detail' ? (
          <div className="mt-8 lg:mt-10">
            <DetailPanel protocol={protocol ?? '#2024-0772'} />
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
