import { useState } from 'react'

import { buildEvaluationHref, routes } from '../../app/routes'
import { manifestantOnlyRoles } from '../../app/access-policy'
import { cx } from '../../utils/cx'
import { Icon } from '../icons/icon'
import type { IconName } from '../icons/icon'
import { AuthenticatedAppShell } from '../layout/authenticated-app-shell'
import { SiteFooter } from '../layout/site-footer'

interface InfoCard {
  description: string
  icon: IconName
  iconClassName: string
  title: string
}

interface ManifestationSubmissionSuccessProps {
  id: string
  protocol: string
}

const infoCards: InfoCard[] = [
  {
    description: 'Sua resposta será enviada em até 30 dias corridos, conforme previsto na Lei de Acesso à Informação.',
    icon: 'clock',
    iconClassName: 'bg-[#ffdeac] text-[#5b403d]',
    title: 'Prazo de resposta',
  },
  {
    description:
      'Seus dados estão protegidos sob sigilo institucional. Apenas a equipe técnica da Ouvidoria terá acesso.',
    icon: 'shield',
    iconClassName: 'bg-[#d9e2ff] text-[#0d47a1]',
    title: 'Privacidade',
  },
]

export function ManifestationSubmissionSuccess({ id, protocol }: ManifestationSubmissionSuccessProps) {
  const [copyStatus, setCopyStatus] = useState<'copied' | 'error' | 'idle'>('idle')

  const handleCopyProtocol = async () => {
    try {
      if (navigator.clipboard === undefined) {
        throw new Error('Clipboard indisponível')
      }

      await navigator.clipboard.writeText(protocol)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <div className="min-h-svh bg-white font-sans text-[#1a1c1d]">
      <AuthenticatedAppShell allowedRoles={manifestantOnlyRoles} fixedHeader>
        <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 pt-10 min-[390px]:px-7 sm:px-8 md:pt-14 lg:px-10">
          <section
            aria-labelledby="submission-success-title"
            className="flex w-full max-w-[448px] flex-col items-center"
          >
            <div className="grid size-24 place-items-center rounded-full bg-[#d9e2ff]" aria-hidden="true">
              <span className="grid size-[50px] place-items-center rounded-full bg-[#0b2a63] text-white">
                <Icon className="size-8" name="check-circle" />
              </span>
            </div>

            <h1
              className="mt-6 text-center text-[30px] leading-9 font-black tracking-[-0.02em] text-[#1a1c1d] sm:text-4xl sm:leading-10"
              id="submission-success-title"
            >
              Manifestação enviada!
            </h1>
            <p className="mt-2 max-w-xs text-center text-lg leading-7 text-[#5b403d]">
              Sua solicitação foi registrada com sucesso.
            </p>

            <div className="mt-7 w-full overflow-hidden rounded-xl border border-[#e4beba]/20 bg-white p-6 shadow-[0_10px_30px_-5px_rgba(26,28,29,0.08)] sm:p-8">
              <p className="text-center text-xs leading-4 font-bold tracking-[0.1em] text-[#5b403d] uppercase">
                Código do protocolo
              </p>

              <div className="mt-3 flex items-center justify-center gap-3">
                <strong className="min-w-0 text-center font-mono text-2xl leading-8 font-bold tracking-[0.05em] break-all text-[#2b5bb5] sm:break-normal">
                  {protocol}
                </strong>
                <button
                  aria-label={`Copiar protocolo ${protocol}`}
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-[#2b5bb5] transition duration-150 hover:bg-[#2b5bb5]/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1]"
                  onClick={() => void handleCopyProtocol()}
                  type="button"
                >
                  <Icon className="size-5" name="copy" />
                </button>
              </div>
            </div>

            <p className="mt-2 text-center text-lg leading-7 text-[#5b403d]">Guarde o número de protocolo.</p>

            <p
              aria-live="polite"
              className={cx(
                'mt-3 min-h-5 text-center text-sm leading-5 font-semibold',
                copyStatus === 'error' ? 'text-[#ba1a1a]' : 'text-[#2b5bb5]',
              )}
              role="status"
            >
              {copyStatus === 'copied' ? 'Protocolo copiado.' : null}
              {copyStatus === 'error' ? 'Não foi possível copiar. Selecione o protocolo manualmente.' : null}
            </p>
          </section>

          <section
            aria-label="Informações sobre o atendimento"
            className="mt-6 grid w-full max-w-[448px] gap-0 overflow-hidden rounded-xl bg-[#f3f3f4] sm:mt-8 sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:bg-transparent"
          >
            {infoCards.map((card) => (
              <article className="bg-[#f3f3f4] p-6 sm:rounded-xl" key={card.title}>
                <span
                  className={cx('grid size-10 place-items-center rounded-lg', card.iconClassName)}
                  aria-hidden="true"
                >
                  <Icon className="size-5" name={card.icon} />
                </span>
                <h2 className="mt-4 text-base leading-6 font-bold text-[#1a1c1d]">{card.title}</h2>
                <p className="mt-1 text-sm leading-[23px] text-[#5b403d]">{card.description}</p>
              </article>
            ))}
          </section>

          <a
            className="mt-7 inline-flex min-h-12 w-full max-w-[448px] items-center justify-center gap-2 rounded-lg bg-[#2b5bb5] px-6 text-base leading-6 font-bold text-white no-underline transition duration-150 hover:bg-[#234d9d] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1]"
            href={buildEvaluationHref(id)}
          >
            <Icon className="size-5" name="star" />
            Avaliar atendimento
          </a>

          <a
            className="mt-3 inline-flex min-h-12 w-full max-w-[448px] items-center justify-center gap-2 rounded-lg border-2 border-[#2b5bb5]/20 px-6 text-base leading-6 font-bold text-[#2b5bb5] no-underline transition duration-150 hover:bg-[#2b5bb5]/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0d47a1]"
            href={routes.home}
          >
            <Icon className="size-5" name="home" />
            Voltar ao início
          </a>
        </main>

        <SiteFooter className="w-full" />
      </AuthenticatedAppShell>
    </div>
  )
}
