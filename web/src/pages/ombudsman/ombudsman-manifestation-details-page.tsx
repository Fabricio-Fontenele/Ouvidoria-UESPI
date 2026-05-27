import { type FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { ombudsmanAreaRoles } from '../../app/access-policy'
import { getSearchParams, routes } from '../../app/routes'
import type {
  ManifestationAttachmentInfo,
  ManifestationDetail,
} from '../../application/manifestations/manifestation-detail-contract'
import type { Catalog } from '../../application/catalog/catalog-types'
import {
  type CancellationReason,
  cancellationReasonOptions,
  cancellationReasonRequiresNote,
} from '../../application/ombudsman/cancellation-reasons'
import { canAnswer, canCancel, canFinalize, canForward } from '../../application/ombudsman/ombudsman-policy'
import { ombudsmanReplyLimits } from '../../application/ombudsman/ombudsman-reply-limits'
import type { OmbudsmanService } from '../../application/ombudsman/ombudsman-service'
import { ConfirmDialog } from '../../components/feedback/confirm-dialog'
import { Icon } from '../../components/icons/icon'
import { AuthenticatedAppShell } from '../../components/layout/authenticated-app-shell'
import { SiteFooter } from '../../components/layout/site-footer'
import { ManifestationAttachmentsList } from '../../components/manifestations/manifestation-attachments-list'
import { CasePanelBlock, ManifestationCasePanel } from '../../components/manifestations/manifestation-case-panel'
import { ManifestationMessagesThread } from '../../components/manifestations/manifestation-messages-thread'
import { ManifestationTimelineCard } from '../../components/manifestations/manifestation-timeline-card'
import { useCatalog } from '../../hooks/use-catalog'
import { resolveApiErrorMessage } from '../../infrastructure/http/resolve-api-error-message'
import { makeOmbudsmanService } from '../../infrastructure/ombudsman/ombudsman-service-factory'

type LoadStatus = 'loading' | 'ready' | 'error'

function resolveQueryIds() {
  const params = getSearchParams()
  return {
    id: params.get('id'),
    legacyProtocol: params.get('protocol'),
  }
}

function NotFoundCard({ description, title }: { description: string; title: string }) {
  return (
    <section className="rounded-lg bg-home-surface px-6 py-8 shadow-login-frame">
      <h1 className="text-3xl leading-9 font-black text-home-text">{title}</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-home-brown">{description}</p>
      <a
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
        href={routes.ombudsmanHome}
      >
        Voltar para demandas
        <Icon className="size-4" name="chevron-right" />
      </a>
    </section>
  )
}

function DescriptionCard({ detail }: { detail: ManifestationDetail }) {
  return (
    <section aria-labelledby="manifestation-description-title">
      <h2 className="text-lg font-black text-home-text" id="manifestation-description-title">
        Descrição da manifestação
      </h2>
      <p className="mt-3 text-base leading-7 break-words whitespace-pre-line text-home-text">{detail.description}</p>
      {detail.involvedPeople !== null && detail.involvedPeople.length > 0 ? (
        <div className="mt-4 rounded-xl bg-home-action/40 p-3">
          <p className="text-[11px] font-bold tracking-[0.14em] text-home-brown/70 uppercase">Pessoas envolvidas</p>
          <p className="mt-1 text-sm leading-6 break-words text-home-text">{detail.involvedPeople}</p>
        </div>
      ) : null}
    </section>
  )
}

function AnswerComposer({
  detail,
  ombudsmanService,
  onAnswered,
}: {
  detail: ManifestationDetail
  ombudsmanService: OmbudsmanService
  onAnswered: () => void
}) {
  const fieldId = useId()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canAnswer(detail)) {
    return null
  }

  const trimmedLength = content.trim().length
  const isInvalid = trimmedLength === 0 || trimmedLength > ombudsmanReplyLimits.maxLength

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isInvalid) {
      setError(`Escreva uma resposta entre 1 e ${ombudsmanReplyLimits.maxLength} caracteres.`)
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await ombudsmanService.answer({ content: content.trim(), manifestationId: detail.id })
      setContent('')
      onAnswered()
    } catch (sendError) {
      const message = resolveApiErrorMessage(sendError, 'Não foi possível enviar a resposta. Tente novamente.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="ombudsman-answer-title" className="rounded-2xl border border-login-brown/10 bg-white p-5">
      <h3 className="text-lg font-black text-home-text" id="ombudsman-answer-title">
        Enviar resposta administrativa
      </h3>
      <p className="mt-1 text-sm leading-6 text-home-brown">
        Sua resposta é registrada no histórico e o status transita para “Respondida” quando a manifestação está em
        análise.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="sr-only" htmlFor={fieldId}>
          Resposta administrativa
        </label>
        <textarea
          className="min-h-[140px] w-full resize-y rounded-[26px] border border-login-brown/10 bg-home-action/35 px-4 py-3 text-sm leading-6 text-home-text outline-none placeholder:text-home-brown/70 focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
          id={fieldId}
          maxLength={ombudsmanReplyLimits.maxLength}
          onChange={(event) => {
            setContent(event.target.value)
            setError(null)
          }}
          placeholder="Escreva sua resposta..."
          value={content}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-home-brown">
            {trimmedLength}/{ombudsmanReplyLimits.maxLength} caracteres
          </p>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
            disabled={isSubmitting || isInvalid}
            type="submit"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar resposta'}
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

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

interface SectorOption {
  campusLabel: string
  id: string
  label: string
  searchText: string
}

function ForwardAction({
  catalog,
  detail,
  ombudsmanService,
  onForwarded,
}: {
  catalog: Catalog | null
  detail: ManifestationDetail
  ombudsmanService: OmbudsmanService
  onForwarded: () => void
}) {
  const inputId = useId()
  const listboxId = useId()
  const [administrativeUnitId, setAdministrativeUnitId] = useState('')
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current !== null && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  if (!canForward(detail)) {
    return null
  }

  const options: SectorOption[] = (catalog?.campuses ?? []).flatMap((campus) => {
    const campusLabel = campus.city !== null ? `${campus.label} (${campus.city})` : campus.label
    return campus.administrativeUnits.map((unit) => ({
      campusLabel,
      id: unit.id,
      label: unit.label,
      searchText: normalizeText(`${unit.label} ${campus.label} ${campus.city ?? ''}`),
    }))
  })
  const normalizedQuery = normalizeText(query)
  const matches =
    normalizedQuery === '' ? options : options.filter((option) => option.searchText.includes(normalizedQuery))
  const hasCatalog = options.length > 0

  function selectOption(option: SectorOption) {
    setAdministrativeUnitId(option.id)
    setQuery(`${option.label} — ${option.campusLabel}`)
    setIsOpen(false)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (administrativeUnitId === '') {
      setError('Selecione o setor responsável para encaminhar.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await ombudsmanService.forwardToUnit({ administrativeUnitId, manifestationId: detail.id })
      setAdministrativeUnitId('')
      setQuery('')
      onForwarded()
    } catch (forwardError) {
      const message = resolveApiErrorMessage(forwardError, 'Não foi possível encaminhar agora. Tente novamente.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <p className="text-xs leading-5 text-home-brown">
        Acione o setor (e-mail/ofício) e registre aqui — o status passa para “Aguardando setor”.
      </p>

      {detail.forwardedToUnit !== null ? (
        <p className="mt-3 rounded-xl bg-home-action/40 px-3 py-2 text-xs leading-5 text-home-text">
          Aguardando retorno de <strong className="font-bold">{detail.forwardedToUnit.name}</strong>.
        </p>
      ) : null}

      <form className="mt-3 grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-2" ref={containerRef}>
          <label className="text-sm font-bold text-home-text" htmlFor={inputId}>
            Setor responsável
          </label>
          <div className="relative">
            <input
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={isOpen}
              autoComplete="off"
              className="min-h-12 w-full rounded-[26px] border border-login-brown/10 bg-home-action/35 px-4 text-sm leading-6 text-home-text outline-none placeholder:text-home-brown/70 focus:border-home-blue focus:ring-2 focus:ring-home-blue/20 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting || !hasCatalog}
              id={inputId}
              onChange={(event) => {
                setQuery(event.target.value)
                setAdministrativeUnitId('')
                setIsOpen(true)
                setError(null)
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Digite para buscar o setor (nome, campus ou cidade)..."
              role="combobox"
              type="text"
              value={query}
            />
            {isOpen && hasCatalog ? (
              <ul
                className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-login-brown/10 bg-white py-1 shadow-login-frame"
                id={listboxId}
                role="listbox"
              >
                {matches.length === 0 ? (
                  <li className="px-4 py-3 text-sm leading-6 text-home-brown">Nenhum setor encontrado.</li>
                ) : (
                  matches.map((option) => (
                    <li aria-selected={option.id === administrativeUnitId} key={option.id} role="option">
                      <button
                        className="block w-full px-4 py-2 text-left transition duration-150 hover:bg-home-action/60 focus-visible:bg-home-action/60 focus-visible:outline-none"
                        onClick={() => {
                          selectOption(option)
                        }}
                        type="button"
                      >
                        <span className="block text-sm font-semibold text-home-text">{option.label}</span>
                        <span className="block text-xs text-home-brown">{option.campusLabel}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        </div>
        <button
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
          disabled={isSubmitting || administrativeUnitId === ''}
          type="submit"
        >
          {isSubmitting ? 'Encaminhando...' : 'Encaminhar ao setor'}
          <Icon className="size-4" name="chevron-right" />
        </button>
        {error !== null ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 font-bold text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  )
}

const cancellationNoteMaxLength = 500

function CancellationReasonPicker({
  noteFieldId,
  noteValue,
  onNoteChange,
  onReasonChange,
  reasonValue,
}: {
  noteFieldId: string
  noteValue: string
  onNoteChange: (value: string) => void
  onReasonChange: (value: CancellationReason) => void
  reasonValue: CancellationReason | null
}) {
  const groupName = useId()
  // A justificativa livre só faz sentido para "Outro motivo" — os demais já são, eles
  // próprios, a justificativa do cancelamento.
  const showNoteField = reasonValue !== null && cancellationReasonRequiresNote(reasonValue)

  return (
    <div className="grid gap-4 text-left">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold text-home-text">Motivo do cancelamento</legend>
        <div className="grid gap-2">
          {cancellationReasonOptions.map((option) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-login-brown/10 bg-home-action/25 px-3 py-2.5 transition duration-150 hover:bg-home-action/45 has-checked:border-home-brown has-checked:bg-home-brown/10"
              key={option.value}
            >
              <input
                checked={reasonValue === option.value}
                className="mt-1 size-4 shrink-0 accent-home-brown"
                name={groupName}
                onChange={() => onReasonChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-home-text">{option.label}</span>
                <span className="block text-xs leading-5 text-home-brown">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {showNoteField ? (
        <div className="grid gap-1.5">
          <label className="text-sm font-bold text-home-text" htmlFor={noteFieldId}>
            Justificativa (obrigatória)
          </label>
          <textarea
            className="min-h-[88px] w-full resize-y rounded-2xl border border-login-brown/10 bg-home-action/25 px-3 py-2 text-sm leading-6 text-home-text outline-none placeholder:text-home-brown/70 focus:border-home-brown focus:ring-2 focus:ring-home-brown/20"
            id={noteFieldId}
            maxLength={cancellationNoteMaxLength}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Descreva o motivo do cancelamento para o autor."
            value={noteValue}
          />
          <p className="text-xs text-home-brown/80">
            {noteValue.trim().length}/{cancellationNoteMaxLength} caracteres
          </p>
        </div>
      ) : null}
    </div>
  )
}

function StatusActions({
  detail,
  ombudsmanService,
  onChanged,
}: {
  detail: ManifestationDetail
  ombudsmanService: OmbudsmanService
  onChanged: () => void
}) {
  const noteFieldId = useId()
  const finalizeEnabled = canFinalize(detail)
  const cancelEnabled = canCancel(detail)
  const [openDialog, setOpenDialog] = useState<'cancel' | 'finalize' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState<CancellationReason | null>(null)
  const [note, setNote] = useState('')

  if (!finalizeEnabled && !cancelEnabled) {
    return null
  }

  function closeDialog() {
    setOpenDialog(null)
    setError(null)
    setReason(null)
    setNote('')
  }

  async function performFinalize() {
    setIsSubmitting(true)
    setError(null)

    try {
      await ombudsmanService.updateStatus({ manifestationId: detail.id, status: 'finalized' })
      closeDialog()
      onChanged()
    } catch (finalizeError) {
      const message = resolveApiErrorMessage(finalizeError, 'Não foi possível finalizar a manifestação.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function performCancel() {
    if (reason === null) {
      return
    }

    const trimmedNote = note.trim()
    setIsSubmitting(true)
    setError(null)

    try {
      await ombudsmanService.cancel({
        manifestationId: detail.id,
        reason,
        ...(trimmedNote.length > 0 ? { note: trimmedNote } : {}),
      })
      closeDialog()
      onChanged()
    } catch (cancelError) {
      const message = resolveApiErrorMessage(cancelError, 'Não foi possível cancelar a manifestação.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelConfirmDisabled = reason === null || (cancellationReasonRequiresNote(reason) && note.trim().length === 0)

  return (
    <div>
      <div className="flex flex-col gap-2">
        <button
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-home-success px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-success/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-success disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
          disabled={!finalizeEnabled || isSubmitting}
          onClick={() => setOpenDialog('finalize')}
          type="button"
        >
          Finalizar manifestação
          <Icon className="size-4" name="check-circle" />
        </button>
        {cancelEnabled ? (
          <button
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-home-brown px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-brown/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-brown disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
            disabled={isSubmitting}
            onClick={() => setOpenDialog('cancel')}
            type="button"
          >
            Cancelar manifestação
            <Icon className="size-4" name="x" />
          </button>
        ) : null}
      </div>

      {error !== null && openDialog === null ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        confirmingLabel="Finalizando..."
        confirmLabel="Finalizar manifestação"
        description="Ao finalizar, a manifestação é encerrada e o autor pode avaliar o atendimento. Você não poderá enviar novas respostas depois disso."
        icon="check-circle"
        isConfirming={isSubmitting}
        onCancel={closeDialog}
        onConfirm={() => void performFinalize()}
        open={openDialog === 'finalize'}
        title="Finalizar esta manifestação?"
        tone="success"
      />

      <ConfirmDialog
        confirmDisabled={cancelConfirmDisabled}
        confirmingLabel="Cancelando..."
        confirmLabel="Cancelar manifestação"
        description="Selecione o motivo do cancelamento. A manifestação ficará registrada como cancelada e o autor não poderá enviar novas mensagens nem avaliar o atendimento."
        icon="x"
        isConfirming={isSubmitting}
        onCancel={closeDialog}
        onConfirm={() => void performCancel()}
        open={openDialog === 'cancel'}
        title="Cancelar esta manifestação?"
        tone="danger"
      >
        <CancellationReasonPicker
          noteFieldId={noteFieldId}
          noteValue={note}
          onNoteChange={(value) => {
            setNote(value)
            setError(null)
          }}
          onReasonChange={(value) => {
            setReason(value)
            setError(null)
            // Limpa a justificativa ao trocar para um motivo que não a exige.
            if (!cancellationReasonRequiresNote(value)) {
              setNote('')
            }
          }}
          reasonValue={reason}
        />
        {error !== null ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 font-bold text-red-800" role="alert">
            {error}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

export function OmbudsmanManifestationDetailsPage() {
  const ombudsmanService = useMemo(() => makeOmbudsmanService(), [])
  const { catalog } = useCatalog()
  const { id, legacyProtocol } = useMemo(() => resolveQueryIds(), [])
  const [detail, setDetail] = useState<ManifestationDetail | null>(null)
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  const resolveDownloadUrl = useCallback(
    async (attachment: ManifestationAttachmentInfo) => {
      if (detail === null) {
        throw new Error('Detalhe da manifestação indisponível.')
      }

      return ombudsmanService.getAttachmentDownloadUrl({
        attachmentId: attachment.id,
        manifestationId: detail.id,
      })
    },
    [detail, ombudsmanService],
  )

  useEffect(() => {
    if (id === null) {
      return
    }

    let isMounted = true

    async function load(manifestationId: string) {
      setLoadStatus('loading')
      setLoadError(null)

      try {
        const next = await ombudsmanService.getById(manifestationId)
        if (!isMounted) {
          return
        }
        setDetail(next)
        setLoadStatus('ready')
      } catch (error) {
        if (!isMounted) {
          return
        }
        const message = resolveApiErrorMessage(error, 'Não foi possível carregar esta manifestação.')
        setLoadError(message)
        setLoadStatus('error')
      }
    }

    void load(id)

    return () => {
      isMounted = false
    }
  }, [id, ombudsmanService, reloadToken])

  if (id === null) {
    return (
      <div className="min-h-svh bg-login-bg font-sans text-home-text">
        <AuthenticatedAppShell allowedRoles={ombudsmanAreaRoles}>
          <main className="mx-auto w-full max-w-6xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
            {legacyProtocol !== null && legacyProtocol.trim().length > 0 ? (
              <NotFoundCard
                description="Este link usa um formato antigo. Volte para a lista de demandas e abra a manifestação novamente."
                title="Link em formato antigo"
              />
            ) : (
              <NotFoundCard
                description="Não recebemos o identificador desta manifestação. Volte para a lista de demandas."
                title="Manifestação não encontrada"
              />
            )}
          </main>
          <SiteFooter variant="ombudsman" />
        </AuthenticatedAppShell>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-login-bg font-sans text-home-text">
      <AuthenticatedAppShell allowedRoles={ombudsmanAreaRoles}>
        <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
          <a
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm leading-5 font-bold text-home-blue no-underline transition duration-150 hover:text-home-blue/80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            href={routes.ombudsmanHome}
          >
            <Icon className="size-4" name="chevron-left" />
            Voltar para demandas
          </a>

          {loadStatus === 'loading' ? (
            <div className="mt-8 rounded-lg bg-home-action px-5 py-8 text-center text-sm leading-6 text-home-brown">
              Carregando manifestação...
            </div>
          ) : null}

          {loadStatus === 'error' ? (
            <div className="mt-8">
              <NotFoundCard
                description={loadError ?? 'Não foi possível carregar esta manifestação.'}
                title="Não foi possível abrir a manifestação"
              />
            </div>
          ) : null}

          {loadStatus === 'ready' && detail !== null ? (
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
              <div className="order-2 space-y-6 lg:order-1">
                <DescriptionCard detail={detail} />
                <ManifestationMessagesThread messages={detail.messages} perspective="institutional" />
                <AnswerComposer detail={detail} ombudsmanService={ombudsmanService} onAnswered={refetch} />
                <ManifestationTimelineCard history={detail.history} />
              </div>

              <div className="order-1 lg:order-2">
                <ManifestationCasePanel catalog={catalog} detail={detail} showRequester>
                  <CasePanelBlock
                    action={
                      <span className="rounded-full bg-home-chip px-2.5 py-1 text-xs font-bold text-home-brown">
                        {detail.attachments.length}
                      </span>
                    }
                    title="Anexos"
                  >
                    <ManifestationAttachmentsList
                      attachments={detail.attachments}
                      onResolveDownloadUrl={resolveDownloadUrl}
                    />
                  </CasePanelBlock>

                  {canForward(detail) ? (
                    <CasePanelBlock title="Encaminhar">
                      <ForwardAction
                        catalog={catalog}
                        detail={detail}
                        ombudsmanService={ombudsmanService}
                        onForwarded={refetch}
                      />
                    </CasePanelBlock>
                  ) : null}

                  {canFinalize(detail) || canCancel(detail) ? (
                    <CasePanelBlock title="Atualizar status">
                      <StatusActions detail={detail} ombudsmanService={ombudsmanService} onChanged={refetch} />
                    </CasePanelBlock>
                  ) : null}
                </ManifestationCasePanel>
              </div>
            </div>
          ) : null}
        </main>

        <SiteFooter variant="ombudsman" />
      </AuthenticatedAppShell>
    </div>
  )
}
