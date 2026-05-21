import { useState } from 'react'

import type { ManifestationAttachmentInfo } from '../../application/manifestations/manifestation-detail-contract'
import { Icon } from '../icons/icon'
import { formatFileSize } from '../forms/form-file-utils'

interface ManifestationAttachmentsListProps {
  attachments: ManifestationAttachmentInfo[]
  emptyMessage?: string
  headingId?: string
  onResolveDownloadUrl: (attachment: ManifestationAttachmentInfo) => Promise<string>
}

function AttachmentRow({
  attachment,
  onResolveDownloadUrl,
}: {
  attachment: ManifestationAttachmentInfo
  onResolveDownloadUrl: (attachment: ManifestationAttachmentInfo) => Promise<string>
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setIsDownloading(true)
    setError(null)

    try {
      const downloadUrl = await onResolveDownloadUrl(attachment)
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (downloadError) {
      const message =
        downloadError instanceof Error ? downloadError.message : 'Não foi possível gerar o link de download.'
      setError(message)
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

export function ManifestationAttachmentsList({
  attachments,
  emptyMessage = 'Nenhum anexo enviado ainda.',
  headingId = 'manifestation-attachments-title',
  onResolveDownloadUrl,
}: ManifestationAttachmentsListProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-home-text" id={headingId}>
            Anexos
          </h2>
          <p className="mt-2 text-sm leading-6 text-home-brown">
            {attachments.length} anexo{attachments.length === 1 ? '' : 's'} disponíve
            {attachments.length === 1 ? 'l' : 'is'}.
          </p>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">{emptyMessage}</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <AttachmentRow attachment={attachment} key={attachment.id} onResolveDownloadUrl={onResolveDownloadUrl} />
          ))}
        </ul>
      )}
    </section>
  )
}
