import { useState } from 'react'

import { canFinalize } from '../../application/manifestations/manifestation-policy'
import type { ManifestationDetail } from '../../application/manifestations/manifestation-detail-contract'
import { useManifestationsService } from '../../hooks/use-manifestations-service'
import { Icon } from '../icons/icon'

interface FinalizeActionProps {
  detail: ManifestationDetail
  onFinalized: () => void
}

const confirmMessage =
  'Tem certeza que deseja finalizar esta manifestação? Após finalizar, ' +
  'não será mais possível enviar mensagens, apenas avaliar o atendimento.'

export function FinalizeAction({ detail, onFinalized }: FinalizeActionProps) {
  const manifestationsService = useManifestationsService()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canFinalize(detail)) {
    return null
  }

  async function handleClick() {
    if (!window.confirm(confirmMessage)) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await manifestationsService.finalize(detail.id)
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
    <div className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-home-text">Encerrar manifestação</h3>
          <p className="mt-2 text-sm leading-6 text-home-brown">
            Após a resposta da Ouvidoria, você pode encerrar a manifestação para liberar a avaliação do atendimento.
          </p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-home-success px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-success/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-success disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          onClick={() => void handleClick()}
          type="button"
        >
          {isSubmitting ? 'Finalizando...' : 'Finalizar manifestação'}
          <Icon className="size-4" name="check-circle" />
        </button>
      </div>

      {error !== null ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm leading-6 font-bold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
