import { useState } from 'react'

import type { ManifestationAttachmentInfo } from '../../application/manifestations/manifestation-detail-contract'
import { Icon } from '../icons/icon'
import { formatFileSize } from '../forms/form-file-utils'

interface ManifestationAttachmentsListProps {
  attachments: ManifestationAttachmentInfo[]
  emptyMessage?: string
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
    <li>
      <button
        aria-label={`Baixar ${attachment.originalName}`}
        className="group flex w-full items-center gap-3 rounded-xl border border-login-brown/10 bg-white px-3 py-2.5 text-left transition duration-150 hover:border-home-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isDownloading}
        onClick={() => void handleDownload()}
        type="button"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-home-blue/10 text-home-blue">
          <Icon className="size-4" name="file-text" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-home-text">{attachment.originalName}</span>
          <span className="block text-xs text-home-brown">
            {isDownloading ? 'Gerando link...' : formatFileSize(attachment.sizeInBytes)}
          </span>
        </span>
        <Icon
          className="size-4 shrink-0 text-home-brown transition duration-150 group-hover:text-home-blue"
          name="arrow-right"
        />
      </button>
      {error !== null ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

/** Compact, frameless attachment list — designed to sit inside a `CasePanelBlock`. */
export function ManifestationAttachmentsList({
  attachments,
  emptyMessage = 'Nenhum anexo enviado.',
  onResolveDownloadUrl,
}: ManifestationAttachmentsListProps) {
  if (attachments.length === 0) {
    return <p className="rounded-xl bg-home-chip/60 px-4 py-3 text-sm leading-6 text-home-brown">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <AttachmentRow attachment={attachment} key={attachment.id} onResolveDownloadUrl={onResolveDownloadUrl} />
      ))}
    </ul>
  )
}
