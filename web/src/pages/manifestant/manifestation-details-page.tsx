import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'

import { manifestantOnlyRoles } from '../../app/access-policy'
import { buildEvaluationHref, getSearchParams, routes } from '../../app/routes'
import type {
  ManifestationAttachmentInfo,
  ManifestationDetail,
} from '../../application/manifestations/manifestation-detail-contract'
import {
  ACCEPTED_ATTACHMENT_INPUT_ACCEPT,
  canUploadAttachments,
  getRemainingAttachmentSlots,
  validateAttachmentFiles,
} from '../../application/manifestations/attachment-policy'
import { canEvaluate, canFinalize, canSendMessage } from '../../application/manifestations/manifestation-policy'
import { FinalizeAction } from '../../components/manifestations/finalize-action'
import { ManifestationAttachmentsList } from '../../components/manifestations/manifestation-attachments-list'
import { CasePanelBlock, ManifestationCasePanel } from '../../components/manifestations/manifestation-case-panel'
import { ManifestationMessagesThread } from '../../components/manifestations/manifestation-messages-thread'
import { ManifestationTimelineCard } from '../../components/manifestations/manifestation-timeline-card'
import { formatFileSize } from '../../components/forms/form-file-utils'
import { Icon } from '../../components/icons/icon'
import { AuthenticatedAppShell } from '../../components/layout/authenticated-app-shell'
import { SiteFooter } from '../../components/layout/site-footer'
import { useCatalog } from '../../hooks/use-catalog'
import { useManifestationsService } from '../../hooks/use-manifestations-service'
import { resolveApiErrorMessage } from '../../infrastructure/http/resolve-api-error-message'

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
        href={routes.home}
      >
        Voltar para minhas manifestações
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

function AttachmentsUploadForm({ detail, onUploaded }: { detail: ManifestationDetail; onUploaded: () => void }) {
  const manifestationsService = useManifestationsService()
  const fieldId = useId()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const remainingSlots = getRemainingAttachmentSlots(detail.attachments.length)
  const uploadEnabled = canUploadAttachments(detail.status) && remainingSlots > 0

  if (!canUploadAttachments(detail.status)) {
    return null
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const validation = validateAttachmentFiles(files, detail.attachments.length)

    if (!validation.valid) {
      event.target.value = ''
      setSelectedFiles([])
      setError(validation.message)
      return
    }

    setSelectedFiles(files)
    setError(null)
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = validateAttachmentFiles(selectedFiles, detail.attachments.length)

    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      for (const file of selectedFiles) {
        await manifestationsService.uploadAttachment({ file, manifestationId: detail.id })
      }

      setSelectedFiles([])
      onUploaded()
    } catch (uploadError) {
      const message = resolveApiErrorMessage(uploadError, 'Não foi possível enviar os anexos.')
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form className="mt-3" onSubmit={(event) => void handleUpload(event)}>
      <label
        aria-disabled={!uploadEnabled}
        className="flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-home-chip bg-home-action/35 px-4 py-3 text-center text-xs leading-5 text-home-brown transition duration-150 hover:border-home-blue focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-home-blue aria-disabled:cursor-not-allowed aria-disabled:opacity-65"
        htmlFor={fieldId}
      >
        <Icon className="mb-1 size-5 text-home-blue" name="upload-cloud" />
        {uploadEnabled
          ? `Adicionar anexos (${remainingSlots} restante${remainingSlots === 1 ? '' : 's'})`
          : 'Limite de anexos atingido'}
        <input
          accept={ACCEPTED_ATTACHMENT_INPUT_ACCEPT}
          className="sr-only"
          disabled={!uploadEnabled || isUploading}
          id={fieldId}
          multiple
          onChange={handleFileChange}
          type="file"
        />
      </label>

      {selectedFiles.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {selectedFiles.map((file) => (
            <li className="truncate rounded-lg bg-home-action/50 px-3 py-2 text-xs text-home-text" key={file.name}>
              {file.name} • {formatFileSize(file.size)}
            </li>
          ))}
        </ul>
      ) : null}

      {selectedFiles.length > 0 ? (
        <button
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? 'Enviando...' : 'Enviar anexos'}
          <Icon className="size-4" name="upload-cloud" />
        </button>
      ) : null}

      {error !== null ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </form>
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
      const message = resolveApiErrorMessage(sendError, 'Não foi possível enviar a mensagem. Tente novamente.')
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="message-composer-title" className="rounded-2xl border border-login-brown/10 bg-white p-5">
      <h3 className="text-lg font-black text-home-text" id="message-composer-title">
        Enviar mensagem
      </h3>
      <p className="mt-1 text-sm leading-6 text-home-brown">
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
    <div className="flex flex-col items-center gap-3">
      <a
        className="inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-full border-2 border-home-blue bg-transparent px-6 text-sm font-bold tracking-wide text-home-blue no-underline transition duration-150 hover:bg-home-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
        href={buildEvaluationHref(detail.id)}
      >
        Avaliar atendimento
        <Icon className="size-4" name="star" />
      </a>
    </div>
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

  const resolveDownloadUrl = useCallback(
    async (attachment: ManifestationAttachmentInfo) => {
      if (detail === null) {
        throw new Error('Detalhe da manifestação indisponível.')
      }

      return manifestationsService.getAttachmentDownloadUrl({
        attachmentId: attachment.id,
        manifestationId: detail.id,
      })
    },
    [detail, manifestationsService],
  )

  useEffect(() => {
    if (id === null) {
      return
    }

    let isMounted = true

    async function load(manifestationId: string) {
      setStatus('loading')
      setError(null)

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
        const message = resolveApiErrorMessage(loadError, 'Não foi possível carregar esta manifestação.')
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
          <main className="mx-auto w-full max-w-6xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
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
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
              <div className="order-2 space-y-6 lg:order-1">
                <DescriptionCard detail={detail} />
                <ManifestationMessagesThread messages={detail.messages} perspective="manifestant" />
                <MessageComposer detail={detail} onSent={refetch} />
                <ManifestationTimelineCard history={detail.history} />
              </div>

              <div className="order-1 lg:order-2">
                <ManifestationCasePanel catalog={catalog} detail={detail}>
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
                    <AttachmentsUploadForm detail={detail} onUploaded={refetch} />
                  </CasePanelBlock>

                  {canFinalize(detail) || canEvaluate(detail) ? (
                    <CasePanelBlock title="Ações">
                      <div className="space-y-3">
                        <FinalizeAction detail={detail} onFinalized={refetch} />
                        <EvaluationAction detail={detail} />
                      </div>
                    </CasePanelBlock>
                  ) : null}
                </ManifestationCasePanel>
              </div>
            </div>
          ) : null}
        </main>

        <SiteFooter />
      </AuthenticatedAppShell>
    </div>
  )
}
