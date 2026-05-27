import { useEffect, useId, useRef } from 'react'

import { Icon } from '../icons/icon'

interface TermsDialogProps {
  onAccept: () => void
  onClose: () => void
  open: boolean
  privacyHref: string
  topics: { description: string; title: string }[]
}

export function TermsDialog({ onAccept, onClose, open, privacyHref, topics }: TermsDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    acceptButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

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

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6">
      <button
        aria-label="Fechar termos"
        className="absolute inset-0 cursor-default bg-login-text/45"
        onClick={onClose}
        type="button"
      />

      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative flex max-h-[calc(100svh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-login-brown/10 bg-home-surface shadow-login-frame"
        role="dialog"
      >
        <div className="flex shrink-0 items-start gap-4 border-b border-login-brown/10 p-6 sm:p-7">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-home-blue/10 text-home-blue">
            <Icon className="size-6" name="shield" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl leading-7 font-black text-home-text" id={titleId}>
              Termos de uso e privacidade
            </h2>
            <p className="mt-2 text-sm leading-6 text-home-brown" id={descriptionId}>
              Ao criar sua conta, você concorda com os pontos abaixo.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 sm:px-7">
          {topics.map((topic) => (
            <div className="rounded-2xl border border-login-brown/10 bg-white p-4" key={topic.title}>
              <h3 className="text-sm font-bold text-home-text">{topic.title}</h3>
              <p className="mt-1 text-sm leading-6 text-home-brown">{topic.description}</p>
            </div>
          ))}
          <a
            className="inline-flex items-center gap-1 px-1 text-sm font-bold text-home-blue no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            href={privacyHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Ver política de privacidade completa
            <Icon className="size-4" name="arrow-right" />
          </a>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-login-brown/10 p-6 sm:flex-row sm:justify-end sm:p-7">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-login-brown/15 bg-white px-5 text-sm font-bold text-home-text transition duration-150 hover:bg-home-action/40 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            onClick={onAccept}
            ref={acceptButtonRef}
            type="button"
          >
            Li e aceito
          </button>
        </div>
      </div>
    </div>
  )
}
