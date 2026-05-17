import { useMemo, useState } from 'react'

import guarapiMascot from '../assets/guarapi-mascot.png'
import { getGuarapiInitialMessages, getGuarapiSuggestions } from '../application/guarapi-chat/guarapi-chat-content'
import type { GuarapiChatSuggestion } from '../application/guarapi-chat/guarapi-chat-content'
import type { GuarapiChatMode, GuarapiMessage } from '../application/guarapi-chat/guarapi-chat-types'
import {
  getManifestationStatusBadgeClassName,
  getManifestationStatusContract,
} from '../application/manifestations/manifestation-status-contract'
import type { ManifestationStatus } from '../application/manifestations/manifestation-status-contract'
import { AppHeader } from '../components/app-header'
import { Icon } from '../components/icon'
import { SiteFooter } from '../components/site-footer'
import { useGuarapiChat } from '../hooks/use-guarapi-chat'
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
  const searchParams = new URLSearchParams(window.location.search)
  const protocol = searchParams.get('protocol')
  const mode = searchParams.get('mode')

  if (protocol !== null && protocol.trim() !== '') {
    return {
      mode: 'manifestation-detail' as const,
      protocol: protocol.startsWith('#') ? protocol : `#${protocol}`,
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

function getPageCopy(mode: GuarapiChatMode, protocol: string | null) {
  if (mode === 'manifestation-detail') {
    return {
      eyebrow: 'Detalhes do chamado',
      title: protocol ?? 'Chamado',
      description:
        'Acompanhe o resumo da manifestação e converse com o Guarapi para entender o andamento ou preparar uma nova interação.',
    }
  }

  if (mode === 'new-manifestation') {
    return {
      eyebrow: 'Novo registro',
      title: 'Fale com o Guarapi',
      description: 'O Guarapi ajuda você a organizar as informações antes de registrar uma manifestação na Ouvidoria.',
    }
  }

  return {
    eyebrow: 'Atendimento assistido',
    title: 'Fale com o Guarapi',
    description: 'Tire dúvidas sobre a Ouvidoria, entenda tipos de manifestação e receba apoio para usar o sistema.',
  }
}

function MessageBubble({ message }: { message: GuarapiMessage }) {
  const isGuarapi = message.author === 'guarapi'

  return (
    <div className={cx('flex', isGuarapi ? 'justify-start' : 'justify-end')}>
      <div
        className={cx(
          'max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 shadow-landing-step',
          isGuarapi ? 'bg-landing-footer text-landing-text' : 'bg-landing-blue text-white',
        )}
      >
        {message.text}
      </div>
    </div>
  )
}

function DetailPanel({ protocol }: { protocol: string }) {
  const formHref = `/manifestation-form?protocol=${protocol.replace('#', '')}`
  const status = getManifestationStatusContract(manifestationDetailStatus)

  return (
    <aside className="rounded-lg border border-landing-chip bg-landing-surface p-5 shadow-landing-step lg:sticky lg:top-28">
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
        href="/home"
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
  onSelect: (suggestion: GuarapiChatSuggestion) => void
  suggestions: GuarapiChatSuggestion[]
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {suggestions.map((suggestion) => (
        <button
          className="min-h-9 shrink-0 rounded-full bg-landing-footer px-4 text-xs leading-5 font-bold text-landing-brown transition duration-150 hover:bg-landing-chip active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending}
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          type="button"
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  )
}

function ChatPanel({ mode, protocol }: { mode: GuarapiChatMode; protocol: string | null }) {
  const [draft, setDraft] = useState('')
  const initialMessages = useMemo(() => getGuarapiInitialMessages(mode), [mode])
  const suggestions = useMemo(() => getGuarapiSuggestions(mode), [mode])
  const formHref =
    mode === 'manifestation-detail' && protocol !== null
      ? `/manifestation-form?protocol=${protocol.replace('#', '')}`
      : '/manifestation-form'
  const formCta = mode === 'manifestation-detail' ? 'Editar manifestação' : 'Preencher manualmente'
  const { error, isSending, messages, sendMessage } = useGuarapiChat({
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

  const handleSuggestionSelect = async (suggestion: GuarapiChatSuggestion) => {
    if (isSending) {
      return
    }

    setDraft('')
    await sendMessage(suggestion.message)
  }

  return (
    <section
      aria-labelledby="guarapi-chat-title"
      className="flex min-h-[620px] flex-col rounded-lg border border-landing-chip bg-landing-surface shadow-landing-step"
    >
      <div className="flex items-center gap-4 border-b border-landing-chip px-4 py-4 sm:px-5">
        <img alt="" className="size-16 rounded-full object-contain" src={guarapiMascot} />
        <div>
          <h2 className="text-xl leading-7 font-black text-landing-text" id="guarapi-chat-title">
            Guarapi
          </h2>
          <p className="text-sm leading-5 text-landing-brown">Assistente da Ouvidoria UESPI</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-5">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isSending ? (
          <p className="text-sm leading-5 text-landing-menu" role="status">
            Guarapi está respondendo...
          </p>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-landing-chip px-4 py-4 sm:px-5">
        <QuickActions
          isSending={isSending}
          onSelect={(suggestion) => void handleSuggestionSelect(suggestion)}
          suggestions={suggestions}
        />

        <a
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue sm:w-auto"
          href={formHref}
        >
          {formCta}
          <Icon className="size-4" name="file-text" />
        </a>

        {error !== null ? (
          <p className="text-sm leading-5 font-bold text-landing-brown" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="grid grid-cols-[1fr_44px] gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          <label className="sr-only" htmlFor="guarapi-message">
            Mensagem para o Guarapi
          </label>
          <textarea
            className="min-h-12 resize-none rounded-lg bg-landing-muted-surface px-4 py-3 text-sm leading-5 text-landing-text outline-landing-blue placeholder:text-landing-menu focus-visible:outline-2 focus-visible:outline-offset-2"
            id="guarapi-message"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Digite sua mensagem..."
            rows={1}
            value={draft}
          />
          <button
            aria-label="Enviar mensagem"
            className="grid size-11 place-items-center self-end rounded-lg bg-landing-blue text-white transition duration-150 hover:bg-landing-blue/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
            disabled={isSending}
            type="submit"
          >
            <Icon className="size-5" name="send" />
          </button>
        </form>
      </div>
    </section>
  )
}

export function GuarapiPage() {
  const { mode, protocol } = resolveMode()
  const copy = getPageCopy(mode, protocol)
  const isAuthenticated = mode !== 'general'

  return (
    <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
      <AppHeader isAuthenticated={isAuthenticated} />

      <main className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-8 md:pt-14 lg:px-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            <p className="text-sm leading-5 font-black tracking-[0.1em] text-landing-blue uppercase">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl text-[38px] leading-none font-black text-landing-text sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-landing-brown">{copy.description}</p>
          </div>

          {mode === 'manifestation-detail' ? <DetailPanel protocol={protocol ?? '#2024-0772'} /> : null}
        </section>

        <div className="mt-8 lg:mt-10">
          <ChatPanel mode={mode} protocol={protocol} />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
