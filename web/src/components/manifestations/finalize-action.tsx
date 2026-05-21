import { useState } from 'react'

import { canFinalize } from '../../application/manifestations/manifestation-policy'
import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import { useManifestationsService } from '../../hooks/use-manifestations-service'
import { ConfirmDialog } from '../feedback/confirm-dialog'
import { Icon } from '../icons/icon'

interface FinalizeActionProps {
  detail: ManifestationDetail
  onFinalized: () => void
}

export function FinalizeAction({ detail, onFinalized }: FinalizeActionProps) {
  const manifestationsService = useManifestationsService()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canFinalize(detail)) {
    return null
  }

  async function handleConfirm() {
    setError(null)
    setIsSubmitting(true)

    try {
      await manifestationsService.finalize(detail.id)
      setIsConfirming(false)
      onFinalized()
    } catch (finalizeError) {
      const message =
        finalizeError instanceof Error ? finalizeError.message : 'Não foi possível finalizar agora. Tente novamente.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        className="inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-full border-2 border-home-brown bg-transparent px-6 text-sm font-bold tracking-wide text-home-brown transition duration-150 hover:bg-home-brown/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-brown disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        onClick={() => setIsConfirming(true)}
        type="button"
      >
        Encerrar manifestação
        <Icon className="size-4" name="x" />
      </button>

      {error !== null ? (
        <p className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        confirmingLabel="Encerrando..."
        confirmLabel="Encerrar manifestação"
        description="Após encerrar, você não poderá enviar novas mensagens. Apenas a avaliação do atendimento ficará disponível."
        icon="x"
        isConfirming={isSubmitting}
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => void handleConfirm()}
        open={isConfirming}
        title="Encerrar esta manifestação?"
        tone="danger"
      />
    </div>
  )
}
