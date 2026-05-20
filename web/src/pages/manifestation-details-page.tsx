import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react'

import { manifestantOnlyRoles } from '../app/access-policy'
import { buildEvaluationHref, getSearchParams, routes } from '../app/routes'
import type { Catalog } from '../application/catalog/catalog-types'
import type {
  ManifestationDetail,
  ManifestationHistoryEntry,
  ManifestationHistoryEntryType,
  ManifestationMessageEntry,
  ManifestationMessageSenderType,
} from '../application/manifestations/manifestation-detail-contract'
import { canEvaluate, canSendMessage } from '../application/manifestations/manifestation-policy'
import { getManifestationStatusContract } from '../application/manifestations/manifestation-status-contract'
import { getManifestationTypeLabel } from '../application/manifestations/manifestation-type-contract'
import { parseSystemMessagePayload } from '../application/manifestations/system-message-payload'
import { FinalizeAction } from '../components/manifestations/finalize-action'
import { getManifestationStatusStyle } from '../components/manifestations/manifestation-status-style'
import { Icon } from '../components/icons/icon'
import type { IconName } from '../components/icons/icon'
import { AuthenticatedAppShell } from '../components/layout/authenticated-app-shell'
import { SiteFooter } from '../components/layout/site-footer'
import { useCatalog } from '../hooks/use-catalog'
import { useManifestationsService } from '../hooks/use-manifestations-service'
import { cx } from '../utils/cx'
import { formatBrDate, formatBrDateTime } from '../utils/format-date'

type LoadStatus = 'loading' | 'ready' | 'error'

const historyIconByType: Record<ManifestationHistoryEntryType, IconName> = {
  administrative_answered: 'message-circle',
  evaluation_recorded: 'star',
  finalized_by_author: 'check-circle',
  registered: 'file-text',
  status_changed: 'info',
  unknown: 'info',
}

function resolveQueryIds() {
  const params = getSearchParams()
  return {
    id: params.get('id'),
    legacyProtocol: params.get('protocol'),
  }
}

function buildAreaLabel(catalog: Catalog | null, campusId: string, administrativeUnitId: string) {
  const campus = catalog?.campuses.find((entry) => entry.id === campusId)
  const unit = campus?.administrativeUnits.find((entry) => entry.id === administrativeUnitId)

  if (campus === undefined || unit === undefined) {
    return 'Unidade não identificada'
  }

  return `${campus.label} — ${unit.label}`
}

function NotFoundCard({ description, title }: { description: string; title: string }) {
  return (
    <section className="rounded-lg bg-home-surface px-6 py-8 shadow-login-frame">
      <h1 className="text-3xl leading-9 font-black text-home-text">{title}</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-home-brown">{description}</p>
      <a
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
        href={routes.home}
      >
        Voltar para minhas manifestações
        <Icon className="size-4" name="chevron-right" />
      </a>
    </section>
  )
}

function SummaryCard({ catalog, detail }: { catalog: Catalog | null; detail: ManifestationDetail }) {
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

function DescriptionCard({ detail }: { detail: ManifestationDetail }) {
  return (
    <section
      aria-labelledby="manifestation-description-title"
      className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6"
    >
      <h2 className="text-2xl font-black text-home-text" id="manifestation-description-title">
        Descrição da manifestação
      </h2>
      <p className="mt-5 text-lg leading-7 text-home-text sm:text-xl">{detail.description}</p>
      {detail.involvedPeople !== null && detail.involvedPeople.length > 0 ? (
        <div className="mt-6 rounded-2xl bg-home-action/40 p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase">Pessoas envolvidas</p>
          <p className="mt-2 text-base leading-6 text-home-text">{detail.involvedPeople}</p>
        </div>
      ) : null}
    </section>
  )
}

function AttachmentsHint({ detail }: { detail: ManifestationDetail }) {
  if (detail.attachments.length === 0) {
    return null
  }

  return (
    <section
      aria-label="Anexos da manifestação"
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-home-blue/10 text-home-blue">
          <Icon className="size-5" name="file-text" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-home-text">
            {detail.attachments.length} anexo{detail.attachments.length === 1 ? '' : 's'}
          </h3>
          <p className="mt-1 text-sm leading-6 text-home-brown">
            O download dos anexos estará disponível em uma próxima fatia desta integração.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-home-brown">
            {detail.attachments.map((attachment) => (
              <li className="truncate" key={attachment.id}>
                • {attachment.originalName}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function describeHistoryEntry(entry: ManifestationHistoryEntry): string {
  if (entry.description.length > 0) {
    return entry.description
  }

  switch (entry.type) {
    case 'registered':
      return 'Manifestação registrada.'
    case 'administrative_answered':
      return 'A Ouvidoria respondeu à manifestação.'
    case 'status_changed':
      return 'O status da manifestação foi atualizado.'
    case 'finalized_by_author':
      return 'A manifestação foi finalizada pelo autor.'
    case 'evaluation_recorded':
      return 'A avaliação do atendimento foi registrada.'
    default:
      return 'Atualização do sistema.'
  }
}

function TimelineCard({ detail }: { detail: ManifestationDetail }) {
  return (
    <section
      aria-labelledby="manifestation-timeline-title"
      className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6"
    >
      <h2 className="text-2xl font-black text-home-text" id="manifestation-timeline-title">
        Linha do tempo
      </h2>

      {detail.history.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-home-chip/60 px-4 py-3 text-sm leading-6 text-home-brown">
          Nenhuma atualização registrada ainda.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {detail.history.map((entry, index) => {
            const icon = historyIconByType[entry.type]
            const description = describeHistoryEntry(entry)
            const detailLine =
              entry.type === 'status_changed' && entry.fromStatus !== null && entry.toStatus !== null
                ? `${getManifestationStatusContract(entry.fromStatus).viewLabel} → ${getManifestationStatusContract(entry.toStatus).viewLabel}`
                : entry.type === 'evaluation_recorded' && entry.rating !== null
                  ? `Nota: ${entry.rating}/5`
                  : null

            return (
              <li className="flex items-start gap-4" key={`${entry.createdAt}-${index}`}>
                <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-home-blue/10 text-home-blue">
                  <Icon className="size-4" name={icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-6 font-semibold text-home-text">{description}</p>
                  {detailLine !== null ? <p className="mt-1 text-sm leading-5 text-home-brown">{detailLine}</p> : null}
                  <p className="mt-1 text-xs leading-5 text-home-brown/80">{formatBrDateTime(entry.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function getSenderLabel(senderType: ManifestationMessageSenderType): string {
  switch (senderType) {
    case 'manifestant':
    case 'anonymous_manifestant':
      return 'Você'
    case 'ombudsman':
      return 'Ouvidoria'
    case 'admin':
      return 'Administração'
    case 'system':
      return 'Sistema'
    default:
      return 'Atualização do sistema'
  }
}

function MessageBubble({ message }: { message: ManifestationMessageEntry }) {
  const isOwn = message.senderType === 'manifestant' || message.senderType === 'anonymous_manifestant'
  const isInstitutional = message.senderType === 'ombudsman' || message.senderType === 'admin'
  const isSystem = !isOwn && !isInstitutional
  const senderLabel = getSenderLabel(message.senderType)
  const systemPayload = isSystem ? parseSystemMessagePayload(message.content) : null
  const contentToRender =
    isSystem && systemPayload !== null ? `Atualização do sistema (${systemPayload.kind}).` : message.content

  return (
    <li className={cx('flex', isOwn ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[85%] rounded-[28px] px-5 py-4 text-base leading-7 shadow-sm',
          isOwn && 'bg-home-blue text-white',
          isInstitutional && 'bg-home-action/60 text-home-text',
          isSystem && 'bg-home-chip/70 text-home-brown text-sm',
        )}
      >
        <p
          className={cx(
            'text-xs font-bold tracking-[0.14em] uppercase',
            isOwn ? 'text-white/80' : 'text-home-brown/80',
          )}
        >
          {senderLabel}
        </p>
        <p className="mt-1 whitespace-pre-line">{contentToRender}</p>
        <p
          className={cx(
            'mt-3 text-xs font-semibold tracking-[0.12em] uppercase',
            isOwn ? 'text-white/70' : 'text-home-brown/70',
          )}
        >
          {formatBrDateTime(message.createdAt)}
        </p>
      </div>
    </li>
  )
}

function MessagesCard({ detail }: { detail: ManifestationDetail }) {
  return (
    <section
      aria-labelledby="manifestation-messages-title"
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black text-home-text" id="manifestation-messages-title">
          Mensagens
        </h2>
        <span className="rounded-full bg-home-chip px-4 py-2 text-sm font-bold text-home-brown">
          {detail.messages.length} mensage{detail.messages.length === 1 ? 'm' : 'ns'}
        </span>
      </div>

      <div className="mt-5 rounded-[28px] border border-login-brown/10 bg-white p-4 shadow-sm">
        {detail.messages.length === 0 ? (
          <p className="rounded-[24px] border border-home-chip bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">
            Nenhuma mensagem trocada ainda. Quando a Ouvidoria responder, a conversa aparece aqui.
          </p>
        ) : (
          <ul className="space-y-4">
            {detail.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function MessageComposer({ detail, onSent }: { detail: ManifestationDetail; onSent: () => void }) {
  const manifestationsService = useManifestationsService()
  const fieldId = useId()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canSendMessage(detail)) {
    return null
  }

  const trimmedLength = content.trim().length
  const isInvalid = trimmedLength === 0 || trimmedLength > 4000

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isInvalid) {
      setError('Escreva uma mensagem entre 1 e 4000 caracteres.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await manifestationsService.addMessage({ content: content.trim(), manifestationId: detail.id })
      setContent('')
      onSent()
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Não foi possível enviar a mensagem. Tente novamente.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="message-composer-title"
      className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6"
    >
      <h3 className="text-xl font-black text-home-text" id="message-composer-title">
        Enviar mensagem
      </h3>
      <p className="mt-2 text-sm leading-6 text-home-brown">
        Use este espaço para esclarecer detalhes do seu relato ou responder à Ouvidoria.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="sr-only" htmlFor={fieldId}>
          Sua mensagem
        </label>
        <textarea
          className="min-h-[120px] w-full resize-y rounded-[26px] border border-login-brown/10 bg-home-action/35 px-4 py-3 text-sm leading-6 text-home-text outline-none placeholder:text-home-brown/70 focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
          id={fieldId}
          maxLength={4000}
          onChange={(event) => {
            setContent(event.target.value)
            setError(null)
          }}
          placeholder="Escreva sua mensagem..."
          value={content}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-home-brown">{trimmedLength}/4000 caracteres</p>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
            disabled={isSubmitting || isInvalid}
            type="submit"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
            <Icon className="size-4" name="send" />
          </button>
        </div>
        {error !== null ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  )
}

function EvaluationAction({ detail }: { detail: ManifestationDetail }) {
  if (!canEvaluate(detail)) {
    return null
  }

  return (
    <section className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-home-text">Avalie o atendimento</h3>
          <p className="mt-2 text-sm leading-6 text-home-brown">
            Sua avaliação ajuda a Ouvidoria a melhorar o serviço. Leva menos de um minuto.
          </p>
        </div>
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-home-blue px-5 text-sm font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          href={buildEvaluationHref(detail.id)}
        >
          Avaliar atendimento
          <Icon className="size-4" name="star" />
        </a>
      </div>
    </section>
  )
}

export function ManifestationDetailsPage() {
  const manifestationsService = useManifestationsService()
  const { catalog } = useCatalog()
  const { id, legacyProtocol } = useMemo(() => resolveQueryIds(), [])
  const [detail, setDetail] = useState<ManifestationDetail | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    if (id === null) {
      return
    }

    let isMounted = true
    setStatus('loading')
    setError(null)

    async function load(manifestationId: string) {
      try {
        const next = await manifestationsService.getById(manifestationId)
        if (!isMounted) {
          return
        }
        setDetail(next)
        setStatus('ready')
      } catch (loadError) {
        if (!isMounted) {
          return
        }
        const message = loadError instanceof Error ? loadError.message : 'Não foi possível carregar esta manifestação.'
        setError(message)
        setStatus('error')
      }
    }

    void load(id)

    return () => {
      isMounted = false
    }
  }, [id, manifestationsService, reloadToken])

  if (id === null) {
    return (
      <div className="min-h-svh bg-login-bg font-sans text-home-text">
        <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles}>
          <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
            {legacyProtocol !== null && legacyProtocol.trim().length > 0 ? (
              <NotFoundCard
                description="Este link usa um formato antigo. Volte para minhas manifestações e abra a manifestação novamente."
                title="Link em formato antigo"
              />
            ) : (
              <NotFoundCard
                description="Não recebemos o identificador desta manifestação. Volte para a lista e abra uma manifestação disponível."
                title="Manifestação não encontrada"
              />
            )}
          </main>
          <SiteFooter />
        </AuthenticatedAppShell>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-login-bg font-sans text-home-text">
      <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles}>
        <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
          <a
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm leading-5 font-bold text-home-blue no-underline transition duration-150 hover:text-home-blue/80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            href={routes.home}
          >
            <Icon className="size-4" name="chevron-left" />
            Voltar para minhas manifestações
          </a>

          {status === 'loading' ? (
            <div className="mt-8 rounded-lg bg-home-action px-5 py-8 text-center text-sm leading-6 text-home-brown">
              Carregando manifestação...
            </div>
          ) : null}

          {status === 'error' ? (
            <div className="mt-8">
              <NotFoundCard
                description={error ?? 'Não foi possível carregar esta manifestação.'}
                title="Não foi possível abrir a manifestação"
              />
            </div>
          ) : null}

          {status === 'ready' && detail !== null ? (
            <div className="mt-8 space-y-10">
              <SummaryCard catalog={catalog} detail={detail} />
              <DescriptionCard detail={detail} />
              <AttachmentsHint detail={detail} />
              <TimelineCard detail={detail} />
              <MessagesCard detail={detail} />
              <MessageComposer detail={detail} onSent={refetch} />
              <FinalizeAction detail={detail} onFinalized={refetch} />
              <EvaluationAction detail={detail} />
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </AuthenticatedAppShell>
    </div>
  )
}
