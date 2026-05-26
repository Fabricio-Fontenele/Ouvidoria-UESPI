import { type FormEvent, useId, useState } from 'react'
import type { ChangeEvent } from 'react'

import { routes } from '../../app/routes'
import type { Catalog } from '../../application/catalog/catalog-types'
import {
  ACCEPTED_ATTACHMENT_INPUT_ACCEPT,
  canUploadAttachments,
  getRemainingAttachmentSlots,
  validateAttachmentFiles,
} from '../../application/manifestations/attachment-policy'
import { canSendMessageByStatus } from '../../application/manifestations/manifestation-policy'
import type {
  TrackedManifestationAttachmentInfo,
  TrackedManifestationDetail,
} from '../../application/manifestations/tracked-manifestation-contract'
import { getManifestationStatusContract } from '../../application/manifestations/manifestation-status-contract'
import { getManifestationTypeLabel } from '../../application/manifestations/manifestation-type-contract'
import { formatFileSize } from '../../components/forms/form-file-utils'
import { Icon } from '../../components/icons/icon'
import { AppHeader } from '../../components/layout/app-header'
import { SiteFooter } from '../../components/layout/site-footer'
import { ManifestationMessagesThread } from '../../components/manifestations/manifestation-messages-thread'
import { useCatalog } from '../../hooks/use-catalog'
import { useManifestationsService } from '../../hooks/use-manifestations-service'
import { formatBrDate } from '../../utils/format-date'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface TrackCredentials {
  accessCode: string
  protocol: string
}

function buildAreaLabel(catalog: Catalog | null, campusId: string, administrativeUnitId: string) {
  const campus = catalog?.campuses.find((entry) => entry.id === campusId)
  const unit = campus?.administrativeUnits.find((entry) => entry.id === administrativeUnitId)

  if (campus === undefined || unit === undefined) {
    return 'Unidade não identificada'
  }

  return `${campus.label} — ${unit.label}`
}

function PublicAttachmentItem({
  attachment,
  credentials,
}: {
  attachment: TrackedManifestationAttachmentInfo
  credentials: TrackCredentials
}) {
  const manifestationsService = useManifestationsService()
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setIsDownloading(true)
    setError(null)

    try {
      const downloadUrl = await manifestationsService.getTrackedAttachmentDownloadUrl({
        accessCode: credentials.accessCode,
        attachmentId: attachment.id,
        protocol: credentials.protocol,
      })
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } catch {
      setError('Não foi possível gerar o link de download.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <li className="rounded-2xl border border-login-brown/10 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-home-blue/10 text-home-blue">
          <Icon className="size-5" name="file-text" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-home-text">{attachment.originalName}</p>
          <p className="mt-1 text-xs leading-5 text-home-brown">
            {formatFileSize(attachment.sizeInBytes)} • {attachment.mimeType}
          </p>
        </div>
      </div>
      <button
        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-home-blue px-4 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
        disabled={isDownloading}
        onClick={() => void handleDownload()}
        type="button"
      >
        {isDownloading ? 'Gerando link...' : 'Baixar anexo'}
        <Icon className="size-4" name="arrow-right" />
      </button>
      {error !== null ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm leading-5 font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

function TrackedMessageComposer({
  credentials,
  detail,
  onSent,
}: {
  credentials: TrackCredentials
  detail: TrackedManifestationDetail
  onSent: () => void
}) {
  const manifestationsService = useManifestationsService()
  const fieldId = useId()
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOpen = canSendMessageByStatus(detail.status)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = content.trim()

    if (trimmed.length === 0) {
      setError('Escreva uma mensagem antes de enviar.')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await manifestationsService.addTrackedMessage({
        accessCode: credentials.accessCode,
        content: trimmed,
        protocol: credentials.protocol,
      })
      setContent('')
      onSent()
    } catch {
      setError('Não foi possível enviar a mensagem. Tente novamente.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6">
      <h2 className="text-2xl font-black text-home-text">Enviar mensagem</h2>
      {isOpen ? (
        <form
          className="mt-5 rounded-[28px] border border-login-brown/10 bg-white p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-bold text-home-text" htmlFor={fieldId}>
            Escreva uma atualização ou responda à Ouvidoria
          </label>
          <textarea
            className="mt-3 min-h-28 w-full resize-y rounded-2xl border border-login-brown/10 bg-home-action/30 px-4 py-3 text-base leading-7 text-home-text outline-none focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
            id={fieldId}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Digite sua mensagem..."
            value={content}
          />
          <button
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
            disabled={isSending || content.trim().length === 0}
            type="submit"
          >
            {isSending ? 'Enviando...' : 'Enviar mensagem'}
            <Icon className="size-4" name="send" />
          </button>
          {error !== null ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="mt-5 rounded-2xl bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">
          Esta manifestação não recebe novas mensagens no status atual.
        </p>
      )}
    </section>
  )
}

function PublicTrackedDetail({
  credentials,
  detail,
  onReload,
}: {
  credentials: TrackCredentials
  detail: TrackedManifestationDetail
  onReload: () => void
}) {
  const manifestationsService = useManifestationsService()
  const { catalog } = useCatalog()
  const fieldId = useId()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const statusContract = getManifestationStatusContract(detail.status)
  const remainingSlots = getRemainingAttachmentSlots(detail.attachments.length)
  const uploadAllowed = canUploadAttachments(detail.status) && remainingSlots > 0

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
        await manifestationsService.uploadTrackedAttachment({
          accessCode: credentials.accessCode,
          file,
          protocol: credentials.protocol,
        })
      }

      setSelectedFiles([])
      onReload()
    } catch {
      setError('Não foi possível enviar os anexos.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="mt-8 space-y-6">
      <article className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6">
        <div className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-black tracking-[0.24em] text-home-blue uppercase">Manifestação anônima</p>
            <h2 className="mt-3 text-2xl leading-9 font-black text-home-text">{detail.protocol}</h2>
            <p className="mt-2 text-sm leading-6 text-home-brown">
              {getManifestationTypeLabel(detail.type)} •{' '}
              {buildAreaLabel(catalog, detail.campusId, detail.administrativeUnitId)}
            </p>
          </div>
          <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-home-blue/10 px-4 text-base leading-6 font-black tracking-[0.04em] text-home-blue uppercase sm:min-h-12 sm:px-5 sm:text-lg">
            {statusContract.viewLabel}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-home-action/50 p-4">
            <dt className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase">Registrada em</dt>
            <dd className="mt-2 text-lg leading-7 font-semibold text-home-text">{formatBrDate(detail.createdAt)}</dd>
          </div>
          <div className="rounded-3xl bg-home-action/50 p-4">
            <dt className="text-xs font-bold tracking-[0.14em] text-home-brown/70 uppercase">Anexos</dt>
            <dd className="mt-2 text-lg leading-7 font-semibold text-home-text">{detail.attachments.length} de 5</dd>
          </div>
        </dl>
      </article>

      <ManifestationMessagesThread messages={detail.messages} perspective="manifestant" />

      <TrackedMessageComposer credentials={credentials} detail={detail} onSent={onReload} />

      <section className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6">
        <h2 className="text-2xl font-black text-home-text">Anexos</h2>
        {detail.attachments.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">
            Nenhum anexo enviado ainda.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {detail.attachments.map((attachment) => (
              <PublicAttachmentItem attachment={attachment} credentials={credentials} key={attachment.id} />
            ))}
          </ul>
        )}

        {canUploadAttachments(detail.status) ? (
          <form
            className="mt-6 rounded-[28px] border border-login-brown/10 bg-white p-4 shadow-sm"
            onSubmit={handleUpload}
          >
            <label
              aria-disabled={!uploadAllowed}
              className="flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-home-chip bg-home-action/35 px-4 py-4 text-center text-sm leading-5 text-home-brown transition duration-150 hover:border-home-blue focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-home-blue aria-disabled:cursor-not-allowed aria-disabled:opacity-65"
              htmlFor={fieldId}
            >
              <Icon className="mb-2 size-5 text-home-blue" name="upload-cloud" />
              {uploadAllowed ? 'Selecionar anexos' : 'Limite de anexos atingido'}
              <input
                accept={ACCEPTED_ATTACHMENT_INPUT_ACCEPT}
                className="sr-only"
                disabled={!uploadAllowed || isUploading}
                id={fieldId}
                multiple
                onChange={handleFileChange}
                type="file"
              />
            </label>

            {selectedFiles.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {selectedFiles.map((file) => (
                  <li
                    className="truncate rounded-xl bg-home-action/50 px-3 py-2 text-sm text-home-text"
                    key={file.name}
                  >
                    {file.name} • {formatFileSize(file.size)}
                  </li>
                ))}
              </ul>
            ) : null}

            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
              disabled={isUploading || selectedFiles.length === 0}
              type="submit"
            >
              {isUploading ? 'Enviando...' : 'Enviar anexos'}
              <Icon className="size-4" name="upload-cloud" />
            </button>

            {error !== null ? (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        ) : (
          <p className="mt-5 rounded-2xl bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">
            Esta manifestação não recebe novos anexos no status atual.
          </p>
        )}
      </section>
    </section>
  )
}

export function TrackPage() {
  const manifestationsService = useManifestationsService()
  const [protocol, setProtocol] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [credentials, setCredentials] = useState<TrackCredentials | null>(null)
  const [detail, setDetail] = useState<TrackedManifestationDetail | null>(null)
  const [status, setStatus] = useState<LoadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  async function loadTrackedManifestation(nextCredentials: TrackCredentials) {
    setStatus('loading')
    setError(null)

    try {
      const nextDetail = await manifestationsService.getTrackedDetails(nextCredentials)
      setCredentials(nextCredentials)
      setDetail(nextDetail)
      setStatus('ready')
    } catch {
      setDetail(null)
      setCredentials(null)
      setError('Não encontramos uma manifestação com o protocolo e código informados.')
      setStatus('error')
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextCredentials = {
      accessCode: accessCode.trim(),
      protocol: protocol.trim(),
    }

    if (nextCredentials.protocol.length === 0 || nextCredentials.accessCode.length === 0) {
      setError('Informe o protocolo e o código de acesso.')
      setStatus('error')
      return
    }

    void loadTrackedManifestation(nextCredentials)
  }

  return (
    <div className="min-h-svh bg-login-bg font-sans text-home-text">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
        <a
          className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm leading-5 font-bold text-home-blue no-underline transition duration-150 hover:text-home-blue/80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
          href={routes.landing}
        >
          <Icon className="size-4" name="chevron-left" />
          Voltar para a página inicial
        </a>

        <section className="mt-8 rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6">
          <h1 className="text-3xl leading-10 font-black text-home-text">Consultar manifestação</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-home-brown">
            Informe o protocolo e o código de acesso recebidos no registro anônimo.
          </p>

          <form className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm leading-5 text-home-text">
              Protocolo
              <input
                className="h-12 rounded-lg border border-login-brown/10 bg-white px-4 text-base text-home-text outline-none focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
                onChange={(event) => setProtocol(event.target.value)}
                placeholder="2026-0002"
                type="text"
                value={protocol}
              />
            </label>
            <label className="grid gap-2 text-sm leading-5 text-home-text">
              Código de acesso
              <input
                className="h-12 rounded-lg border border-login-brown/10 bg-white px-4 text-base text-home-text outline-none focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
                onChange={(event) => setAccessCode(event.target.value)}
                type="password"
                value={accessCode}
              />
            </label>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
              disabled={status === 'loading'}
              type="submit"
            >
              {status === 'loading' ? 'Consultando...' : 'Consultar'}
              <Icon className="size-4" name="search" />
            </button>
          </form>

          {error !== null ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        {status === 'ready' && detail !== null && credentials !== null ? (
          <PublicTrackedDetail
            credentials={credentials}
            detail={detail}
            onReload={() => void loadTrackedManifestation(credentials)}
          />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
