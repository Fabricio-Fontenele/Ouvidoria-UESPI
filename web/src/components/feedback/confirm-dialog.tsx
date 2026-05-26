import { type ReactNode, useEffect, useId, useRef } from 'react'

import { Icon } from '../icons/icon'
import type { IconName } from '../icons/icon'
import { cx } from '../../utils/cx'

export type ConfirmDialogTone = 'danger' | 'neutral' | 'success'

interface ConfirmDialogProps {
  cancelLabel?: string
  children?: ReactNode
  confirmDisabled?: boolean
  confirmingLabel?: string
  confirmLabel: string
  description: string
  icon?: IconName
  isConfirming?: boolean
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
  tone?: ConfirmDialogTone
}

const confirmButtonByTone: Record<ConfirmDialogTone, string> = {
  danger: 'bg-home-brown hover:bg-home-brown/90 focus-visible:outline-home-brown',
  neutral: 'bg-home-blue hover:bg-home-blue/90 focus-visible:outline-home-blue',
  success: 'bg-home-success hover:bg-home-success/90 focus-visible:outline-home-success',
}

const accentByTone: Record<ConfirmDialogTone, string> = {
  danger: 'bg-home-brown/15 text-home-brown',
  neutral: 'bg-home-blue/10 text-home-blue',
  success: 'bg-home-success/15 text-home-success',
}

export function ConfirmDialog({
  cancelLabel = 'Cancelar',
  children,
  confirmDisabled = false,
  confirmingLabel,
  confirmLabel,
  description,
  icon,
  isConfirming = false,
  onCancel,
  onConfirm,
  open,
  title,
  tone = 'neutral',
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)

  // Foca o botão cancelar apenas quando o diálogo abre. Mantendo este efeito atrelado
  // só a `open`, evitamos roubar o foco de campos internos a cada re-render (ex.: digitar
  // a justificativa de cancelamento re-renderiza o pai e mudaria a referência de onCancel).
  useEffect(() => {
    if (!open) {
      return
    }

    cancelButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isConfirming) {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isConfirming, onCancel, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) {
    return null
  }

  function handleBackdropClick() {
    if (isConfirming) {
      return
    }
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6">
      <button
        aria-label="Fechar diálogo"
        className="absolute inset-0 cursor-default bg-login-text/45"
        disabled={isConfirming}
        onClick={handleBackdropClick}
        type="button"
      />

      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative max-h-[calc(100svh-3rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-login-brown/10 bg-home-surface p-6 shadow-login-frame sm:p-7"
        role="dialog"
      >
        <div className="flex items-start gap-4">
          {icon !== undefined ? (
            <span className={cx('grid size-11 shrink-0 place-items-center rounded-2xl', accentByTone[tone])}>
              <Icon className="size-6" name={icon} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-xl leading-7 font-black text-home-text" id={titleId}>
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-home-brown" id={descriptionId}>
              {description}
            </p>
          </div>
        </div>

        {children !== undefined ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-login-brown/15 bg-white px-5 text-sm font-bold text-home-text transition duration-150 hover:bg-home-action/40 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isConfirming}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={cx(
              'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white transition duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:opacity-70',
              confirmButtonByTone[tone],
            )}
            disabled={isConfirming || confirmDisabled}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming && confirmingLabel !== undefined ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
