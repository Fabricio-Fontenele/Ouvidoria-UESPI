import { useEffect, useId, useRef } from 'react'

import { Icon } from '../icons/icon'
import type { IconName } from '../icons/icon'
import { cx } from '../../utils/cx'

export type ConfirmDialogTone = 'danger' | 'neutral' | 'success'

interface ConfirmDialogProps {
  cancelLabel?: string
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

  useEffect(() => {
    if (!open) {
      return
    }

    cancelButtonRef.current?.focus()

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
        className="relative w-full max-w-md rounded-[28px] border border-login-brown/10 bg-home-surface p-6 shadow-login-frame sm:p-7"
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
            disabled={isConfirming}
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
