import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type RefObject } from 'react'

import { routes } from '../../app/routes'

import guaraMascot from '../../assets/guara-bot-poses03.png'
import guaraShortcutMascot from '../../assets/guara-mascot.png'
import uespiImageBg from '../../assets/uespi-img-bg.webp'
import { Icon, type IconName } from '../../components/icons/icon'
import { AppHeader } from '../../components/layout/app-header'
import { SiteFooter } from '../../components/layout/site-footer'

import { cx } from '../../utils/cx'

interface ManifestationType {
  description: string
  icon: IconName
  label: string
}

interface OverviewPoint {
  icon: IconName
  label: string
}

interface Step {
  accent: 'blue' | 'yellow'
  description: string
  icon: IconName
  title: string
}

interface RegistrationChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}

const modalFocusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const guaraShortcutInactivityDelayInMs = 6000
const guaraShortcutBubbleExitDurationInMs = 220
const guaraShortcutActivityEvents = [
  'click',
  'focusin',
  'keydown',
  'pointerdown',
  'pointermove',
  'scroll',
  'touchstart',
] as const
type GuaraSpeechBubbleState = 'hidden' | 'leaving' | 'visible'

const manifestationTypes: ManifestationType[] = [
  {
    description: 'Informe irregularidades, condutas inadequadas ou situações que precisam de apuração institucional.',
    icon: 'shield',
    label: 'Denúncia',
  },
  {
    description: 'Relate insatisfação com serviços, atendimentos, prazos ou processos da universidade.',
    icon: 'message-circle',
    label: 'Reclamação',
  },
  {
    description: 'Peça providências, documentos, informações ou suporte relacionado aos serviços institucionais.',
    icon: 'file-text',
    label: 'Solicitação',
  },
  {
    description: 'Compartilhe ideias para melhorar fluxos, atendimentos e experiências na comunidade acadêmica.',
    icon: 'edit',
    label: 'Sugestão',
  },
  {
    description: 'Reconheça boas práticas, equipes ou atendimentos que contribuíram positivamente para a UESPI.',
    icon: 'star',
    label: 'Elogio',
  },
]

const overviewPoints: OverviewPoint[] = [
  { icon: 'message-circle', label: 'Escuta ativa' },
  { icon: 'share', label: 'Encaminhamento' },
  { icon: 'check-circle', label: 'Resposta institucional' },
]

const steps: Step[] = [
  {
    accent: 'blue',
    description:
      'Crie a sua conta e, em seguida, faça a sua manifestação de forma anônima ou não, utilizando o formulário digital seguro.',
    icon: 'edit',
    title: 'Registre',
  },
  {
    accent: 'blue',
    description: 'A Ouvidoria recebe sua manifestação, verifica as informações e define o encaminhamento adequado.',
    icon: 'braces',
    title: 'Em análise',
  },
  {
    accent: 'blue',
    description:
      'A manifestação é enviada para o setor responsável. A área técnica analisa o caso e prepara a resposta.',
    icon: 'file-text',
    title: 'Encaminhamento',
  },
  {
    accent: 'yellow',
    description: 'A ouvidoria envia a resposta final. Você pode acompanhar o histórico e avaliar o atendimento.',
    icon: 'check-circle',
    title: 'Resposta',
  },
]

interface SectionPillProps {
  label: string
  variant: 'blue' | 'highlight'
}

function SectionPill({ label, variant }: SectionPillProps) {
  return (
    <span
      className={cx(
        'inline-flex rounded-full px-2.5 py-1 text-[8px] leading-none font-black tracking-[0.08em] uppercase md:px-3 md:py-1.5 md:text-[10px]',
        variant === 'highlight' ? 'bg-[#FFDEAC] text-landing-text' : 'bg-landing-blue text-white',
      )}
    >
      {label}
    </span>
  )
}

function RegistrationChoiceModal({ isOpen, onClose, openerRef }: RegistrationChoiceModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        openerRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, openerRef])

  if (!isOpen) {
    return null
  }

  const handleClose = () => {
    onClose()
    openerRef.current?.focus()
  }

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(modalFocusableSelector)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (firstElement === undefined || lastElement === undefined) {
      return
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid min-h-svh place-items-center overflow-y-auto px-3 py-3 sm:px-4 sm:py-6">
      <button
        aria-label="Fechar opções de registro"
        className="absolute inset-0 cursor-pointer bg-landing-text/50 backdrop-blur-[2px]"
        onClick={handleClose}
        type="button"
      />

      <section
        aria-describedby="registration-choice-description"
        aria-labelledby="registration-choice-title"
        aria-modal="true"
        className="relative flex max-h-[calc(100svh-24px)] w-full max-w-[560px] flex-col overflow-hidden rounded-lg border border-landing-chip bg-landing-surface shadow-landing-drawer sm:max-h-[calc(100svh-48px)]"
        onKeyDown={handleDialogKeyDown}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-landing-chip bg-landing-muted-surface px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] leading-4 font-black tracking-[0.12em] text-landing-blue uppercase">
              Novo registro
            </p>
            <h2
              className="mt-1.5 text-xl leading-7 font-black text-landing-text sm:mt-2 sm:text-2xl sm:leading-8"
              id="registration-choice-title"
            >
              Como deseja registrar?
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-landing-brown transition duration-150 hover:bg-landing-blue/10 hover:text-landing-blue active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
            onClick={handleClose}
            ref={closeButtonRef}
            type="button"
          >
            <Icon className="size-5" name="x" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <p className="text-sm leading-6 text-landing-brown" id="registration-choice-description">
            Escolha o modo mais adequado. O registro com identificação usa sua conta para centralizar o acompanhamento;
            o anônimo preserva seus dados pessoais.
          </p>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
            <a
              className="group flex flex-col rounded-lg border-2 border-landing-blue bg-landing-blue px-4 py-4 text-white no-underline transition duration-150 hover:bg-landing-blue/95 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue sm:min-h-48 sm:py-5"
              href={routes.sign}
            >
              <span className="grid size-11 place-items-center rounded-lg bg-white/14">
                <Icon className="size-5" name="user" />
              </span>
              <strong className="mt-3 text-base leading-6 font-black sm:mt-4 sm:text-lg">
                Registro com identificação
              </strong>
              <span className="mt-2 text-sm leading-6 text-white/85">
                Crie ou use sua conta para registrar a manifestação e acompanhar tudo pelo painel.
              </span>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm leading-5 font-bold">
                Criar conta
                <Icon
                  className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                  name="arrow-right"
                />
              </span>
            </a>

            <a
              className="group flex flex-col rounded-lg border border-landing-chip bg-landing-surface px-4 py-4 text-landing-text no-underline shadow-landing-step transition duration-150 hover:border-landing-blue hover:bg-landing-blue/5 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue sm:min-h-48 sm:py-5"
              href={routes.manifestationForm}
            >
              <span className="grid size-11 place-items-center rounded-lg bg-landing-blue/10 text-landing-blue">
                <Icon className="size-5" name="shield" />
              </span>
              <strong className="mt-3 text-base leading-6 font-black sm:mt-4 sm:text-lg">Registro anônimo</strong>
              <span className="mt-2 text-sm leading-6 text-landing-brown">
                Envie sem criar conta. Guarde o protocolo e o código exibidos ao final.
              </span>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm leading-5 font-bold text-landing-blue">
                Continuar anonimamente
                <Icon
                  className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                  name="arrow-right"
                />
              </span>
            </a>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-landing-menu">
            Já possui conta?{' '}
            <a
              className="font-bold text-landing-blue no-underline transition duration-150 hover:text-landing-blue/80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.login}
            >
              Acesse o sistema
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative min-h-[245px] bg-landing-surface px-[17px] pt-[21px] pb-5 md:min-h-[340px] md:rounded-b-lg md:px-8 md:pt-12 lg:min-h-[390px] lg:px-10 lg:pt-14">
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 h-full w-screen max-w-none -translate-x-1/2 object-cover opacity-[0.12] select-none"
        src={uespiImageBg}
      />
      <div className="relative max-w-[188px] md:max-w-sm lg:max-w-md">
        <h1 className="text-[31px] leading-[1.1] font-black tracking-[-0.02em] text-landing-text md:text-[44px] lg:text-5xl">
          Sua voz constrói a nossa <span className="text-landing-blue">universidade.</span>
        </h1>
        <p className="mt-4 text-[11px] leading-[1.75] text-landing-text md:mt-5 md:max-w-xs md:text-[15px] md:leading-6">
          Sua participação ajuda a melhorar a UESPI. Registre sua manifestação pelo canal oficial da universidade e
          conte com o Guará para orientar seu relato de forma simples, clara e segura.
        </p>
      </div>
    </section>
  )
}

function RegisterTrackSection({
  onRegisterClick,
}: {
  onRegisterClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <section className="px-4 pt-4 pb-9 md:px-0 md:py-12">
      <div className="grid items-stretch gap-4 md:grid-cols-2 md:gap-5">
        <article
          className="flex flex-col rounded-lg bg-landing-blue p-6 text-white shadow-landing-card md:p-8"
          id="registro"
        >
          <span className="grid size-12 place-items-center rounded-lg bg-white/15">
            <Icon className="size-6" name="edit" />
          </span>
          <p className="mt-4 text-[11px] leading-4 font-black tracking-[0.12em] text-white/75 uppercase">
            Novo registro
          </p>
          <h2 className="mt-1.5 text-[22px] leading-tight font-black md:text-3xl">Registre aqui sua manifestação</h2>
          <p className="mt-3 text-[13px] leading-[1.7] text-white/85 md:text-[15px] md:leading-7">
            Envie denúncias, reclamações, solicitações, sugestões ou elogios para a Ouvidoria da UESPI de forma segura.
          </p>
          <button
            className="group mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-white px-5 text-sm leading-5 font-bold text-landing-blue no-underline shadow-landing-step transition duration-150 hover:bg-white/92 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white md:mt-auto"
            onClick={onRegisterClick}
            type="button"
          >
            Registrar manifestação
            <Icon className="size-4 transition-transform duration-150 group-hover:translate-x-1" name="arrow-right" />
          </button>
        </article>

        <article
          className="flex flex-col rounded-lg border border-landing-chip bg-landing-surface p-6 shadow-landing-card md:p-8"
          id="consultar-manifestacao"
        >
          <span className="grid size-12 place-items-center rounded-lg bg-landing-blue/10 text-landing-blue">
            <Icon className="size-6" name="search" />
          </span>
          <p className="mt-4 text-[11px] leading-4 font-black tracking-[0.12em] text-landing-blue uppercase">
            Acompanhamento
          </p>
          <h2 className="mt-1.5 text-[22px] leading-tight font-black text-landing-text md:text-3xl">
            Consulte sua manifestação
          </h2>
          <p className="mt-3 text-[13px] leading-[1.7] text-landing-brown md:text-[15px] md:leading-7">
            Acompanhe o andamento da manifestação anônima com o protocolo e o código de acesso recebidos no registro.
            Por lá, você confere o status, visualiza os anexos e acompanha as atualizações da Ouvidoria.
          </p>
          <a
            className="group mt-6 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-landing-blue/30 bg-landing-surface px-5 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:border-landing-blue hover:bg-landing-blue/5 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue md:mt-auto"
            href={routes.track}
          >
            Consultar manifestação
            <Icon className="size-4 transition-transform duration-150 group-hover:translate-x-1" name="arrow-right" />
          </a>
        </article>
      </div>
    </section>
  )
}

function GuaraCallout() {
  return (
    <section className="px-4 pb-9 md:px-8 md:pb-12" id="guara">
      <div className="mx-auto overflow-hidden rounded-lg border border-landing-chip bg-landing-surface shadow-landing-card md:grid md:max-w-4xl md:grid-cols-[minmax(220px,0.82fr)_minmax(0,1.18fr)]">
        <div className="flex flex-col items-center justify-center border-b border-landing-chip bg-landing-muted-surface px-6 pt-6 pb-5 text-center md:border-r md:border-b-0 md:px-8 md:py-8">
          <img
            alt=""
            className="size-44 shrink-0 object-contain drop-shadow-landing-mascot md:size-64"
            src={guaraMascot}
          />
        </div>

        <div className="px-5 py-6 text-center md:px-8 md:py-8 md:text-left">
          <div className="mx-auto max-w-xl md:mx-0">
            <p className="text-[11px] leading-4 font-black tracking-[0.12em] text-landing-blue uppercase">
              Atendimento digital
            </p>
            <h2 className="mt-2 text-[24px] leading-tight font-black text-landing-text md:text-4xl">
              Fale com o Guará
            </h2>
            <p className="mt-3 text-[13px] leading-[1.7] text-landing-brown md:text-[15px] md:leading-7">
              O Guará é o assistente virtual da Ouvidoria UESPI. Ele conversa com você de forma simples, ajuda a
              entender qual caminho seguir e organiza as informações principais do seu relato, deixando tudo mais claro
              para revisar antes de enviar.
            </p>
          </div>

          <div className="mt-5 grid gap-2 text-center text-[12px] leading-5 font-bold text-landing-text sm:grid-cols-3 md:text-[13px]">
            <span className="inline-flex items-center justify-center gap-2">
              <Icon className="size-4 shrink-0 text-landing-blue" name="message-circle" />
              Orientação rápida
            </span>
            <span className="inline-flex items-center justify-center gap-2">
              <Icon className="size-4 shrink-0 text-landing-blue" name="lock-open" />
              Sem login
            </span>
            <span className="inline-flex items-center justify-center gap-2">
              <Icon className="size-4 shrink-0 text-landing-blue" name="shield" />
              Canal seguro
            </span>
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 md:justify-start">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white no-underline shadow-landing-step transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.guara}
            >
              <Icon className="size-4" name="message-circle" />
              Conversar com o Guará
            </a>
          </div>

          <p className="mt-4 flex items-start justify-center gap-2 text-left text-[11px] leading-5 text-landing-menu md:justify-start md:text-xs">
            <Icon className="mt-0.5 size-4 shrink-0 text-landing-warning" name="info" />
            Sem login, o registro é feito anonimamente — o protocolo e o código de acesso são exibidos apenas uma vez.
          </p>
        </div>
      </div>
    </section>
  )
}

function OmbudsmanOverviewSection() {
  return (
    <section className="px-4 pb-10 md:px-0 md:pb-16" id="o-que-e">
      <div className="px-1 md:px-0">
        <SectionPill label="Sobre o canal" variant="highlight" />
        <h2 className="mt-3 max-w-md text-[24px] leading-tight font-black text-landing-text md:text-4xl">
          O que é a Ouvidoria?
        </h2>
        <p className="mt-4 max-w-3xl text-[13px] leading-[1.75] text-landing-brown md:text-[15px] md:leading-7">
          A Ouvidoria Geral da UESPI é um órgão de natureza mediadora, sem caráter administrativo, deliberativo ou
          judicante. Seu papel é aproximar a comunidade da gestão universitária com escuta qualificada, transparência e
          encaminhamento responsável.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {overviewPoints.map((item) => (
            <div className="flex items-center gap-2.5" key={item.label}>
              <span className="grid size-8 shrink-0 place-items-center text-landing-blue">
                <Icon className="size-5" name={item.icon} />
              </span>
              <span className="text-[12px] leading-5 font-bold text-landing-text md:text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ManifestationTypesSection() {
  return (
    <section className="px-4 pb-10 md:px-0 md:pb-16" id="tipos">
      <SectionPill label="Manifestações" variant="blue" />
      <div className="mt-3 max-w-2xl">
        <h2 className="text-[22px] leading-tight font-black text-landing-text md:text-3xl">Tipos de manifestação</h2>
        <p className="mt-2 text-[12px] leading-5 text-landing-menu md:text-sm md:leading-6">
          Escolha o tipo que melhor representa sua necessidade no momento do registro.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {manifestationTypes.map((type) => (
          <article
            className="rounded-lg border border-landing-chip bg-landing-surface p-4 shadow-landing-step"
            key={type.label}
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-landing-blue/10 text-landing-blue">
                <Icon className="size-5" name={type.icon} />
              </span>
              <div>
                <h3 className="text-sm leading-5 font-black text-landing-text md:text-base">{type.label}</h3>
                <p className="mt-1 text-[12px] leading-5 text-landing-menu md:text-sm md:leading-6">
                  {type.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function StepsSection() {
  const stepRefs = useRef<(HTMLLIElement | null)[]>([])
  const [shouldRevealAllSteps] = useState(
    () =>
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window),
  )
  const [visibleStepIndexes, setVisibleStepIndexes] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    if (shouldRevealAllSteps) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          const stepIndex = Number((entry.target as HTMLElement).dataset.stepIndex)

          setVisibleStepIndexes((currentIndexes) => {
            if (currentIndexes.has(stepIndex)) {
              return currentIndexes
            }

            const nextIndexes = new Set(currentIndexes)
            nextIndexes.add(stepIndex)
            return nextIndexes
          })

          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -18% 0px', threshold: 0.28 },
    )

    stepRefs.current.forEach((stepElement) => {
      if (stepElement !== null) {
        observer.observe(stepElement)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [shouldRevealAllSteps])

  return (
    <section className="px-4 pb-[50px] md:px-0 md:pb-16" id="como-funciona">
      <div className="mx-auto max-w-3xl text-center">
        <SectionPill label="Fluxo de atendimento" variant="blue" />
        <h2 className="mt-3 text-[24px] leading-tight font-black text-landing-text md:text-4xl">Como funciona?</h2>
        <p className="mx-auto mt-4 max-w-xl text-[13px] leading-[1.75] text-landing-brown md:text-[15px] md:leading-7">
          Do registro à resposta final, cada etapa mostra onde sua manifestação está e qual é o próximo movimento da
          Ouvidoria.
        </p>
      </div>

      <ol
        aria-label="Etapas do fluxo da manifestação"
        className="relative mx-auto mt-8 max-w-4xl space-y-6 text-left before:absolute before:top-5 before:bottom-5 before:left-5 before:w-px before:bg-landing-chip md:mt-12 md:space-y-0 md:before:left-1/2 md:before:-translate-x-1/2"
      >
        {steps.map((step, index) => {
          const isVisible = shouldRevealAllSteps || visibleStepIndexes.has(index)
          const isEvenStep = index % 2 === 0

          return (
            <li
              className={cx(
                'relative grid grid-cols-[40px_minmax(0,1fr)] gap-4 transition duration-700 ease-out md:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)] md:gap-0',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
              )}
              data-step-index={index}
              key={step.title}
              ref={(element) => {
                stepRefs.current[index] = element
              }}
              style={{ transitionDelay: isVisible ? `${index * 90}ms` : '0ms' }}
            >
              <div
                aria-hidden="true"
                className={cx(
                  'relative z-10 flex size-10 items-center justify-center rounded-full border-4 border-landing-surface text-sm leading-none font-black shadow-landing-step md:col-start-2 md:mx-auto md:size-12 md:text-base',
                  step.accent === 'blue' ? 'bg-landing-blue text-white' : 'bg-landing-warning text-landing-text',
                )}
              >
                {index + 1}
              </div>

              <article
                className={cx(
                  'py-1 md:py-3',
                  isEvenStep
                    ? 'md:col-start-1 md:row-start-1 md:mr-10 md:text-right'
                    : 'md:col-start-3 md:row-start-1 md:ml-10',
                )}
              >
                <div className={cx('flex items-start gap-3', isEvenStep && 'md:flex-row-reverse')}>
                  <Icon
                    className={cx(
                      'mt-0.5 size-6 shrink-0',
                      step.accent === 'blue' ? 'text-landing-blue' : 'text-landing-warning',
                    )}
                    name={step.icon}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base leading-6 font-black text-landing-text md:text-lg">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-landing-menu">{step.description}</p>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function FloatingGuaraShortcut() {
  const [speechBubbleState, setSpeechBubbleState] = useState<GuaraSpeechBubbleState>('hidden')

  useEffect(() => {
    let speechBubbleExitTimeout: number | null = null
    let inactivityTimeout = window.setTimeout(() => {
      if (speechBubbleExitTimeout !== null) {
        window.clearTimeout(speechBubbleExitTimeout)
        speechBubbleExitTimeout = null
      }

      setSpeechBubbleState('visible')
    }, guaraShortcutInactivityDelayInMs)

    const resetInactivityTimer = () => {
      setSpeechBubbleState((currentState) => {
        if (currentState !== 'visible') {
          return currentState
        }

        if (speechBubbleExitTimeout !== null) {
          window.clearTimeout(speechBubbleExitTimeout)
        }

        speechBubbleExitTimeout = window.setTimeout(() => {
          setSpeechBubbleState('hidden')
          speechBubbleExitTimeout = null
        }, guaraShortcutBubbleExitDurationInMs)

        return 'leaving'
      })

      window.clearTimeout(inactivityTimeout)
      inactivityTimeout = window.setTimeout(() => {
        if (speechBubbleExitTimeout !== null) {
          window.clearTimeout(speechBubbleExitTimeout)
          speechBubbleExitTimeout = null
        }

        setSpeechBubbleState('visible')
      }, guaraShortcutInactivityDelayInMs)
    }

    guaraShortcutActivityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer, { passive: true })
    })

    return () => {
      window.clearTimeout(inactivityTimeout)
      if (speechBubbleExitTimeout !== null) {
        window.clearTimeout(speechBubbleExitTimeout)
      }

      guaraShortcutActivityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer)
      })
    }
  }, [])

  return (
    <div className="fixed right-3 bottom-3 z-30 md:right-6 md:bottom-6">
      {speechBubbleState !== 'hidden' ? (
        <div
          className={cx(
            'absolute right-16 bottom-[84px] w-max max-w-[210px] rounded-lg bg-white px-4 py-2.5 text-sm leading-5 font-black text-landing-text shadow-landing-step md:right-20 md:bottom-[104px] md:text-base md:leading-6',
            speechBubbleState === 'leaving' ? 'animate-guara-bubble-out' : 'animate-guara-bubble-in',
          )}
          role="status"
        >
          Oi! Posso te ajudar?
          <span
            aria-hidden="true"
            className="absolute right-7 -bottom-1.5 size-3 rotate-45 bg-white shadow-landing-step"
          />
        </div>
      ) : null}

      <a
        aria-label="Fale com o Guará"
        className="group block rounded-full transition duration-150 hover:scale-105 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
        href={routes.guara}
        title="Fale com o Guará"
      >
        <img
          alt="Fale com o Guará"
          className="block size-24 object-contain drop-shadow-landing-mascot md:size-28"
          src={guaraShortcutMascot}
        />
      </a>
    </div>
  )
}

export function LandingPage() {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const registrationModalOpenerRef = useRef<HTMLButtonElement | null>(null)

  const openRegistrationModal = (event: MouseEvent<HTMLButtonElement>) => {
    registrationModalOpenerRef.current = event.currentTarget
    setIsRegistrationModalOpen(true)
  }

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false)
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-landing-surface font-sans text-landing-text">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl bg-landing-surface md:px-8">
        <HeroSection />
        <RegisterTrackSection onRegisterClick={openRegistrationModal} />
        <GuaraCallout />
        <ManifestationTypesSection />
        <StepsSection />
        <OmbudsmanOverviewSection />
      </main>
      <FloatingGuaraShortcut />
      <SiteFooter />
      <RegistrationChoiceModal
        isOpen={isRegistrationModalOpen}
        onClose={closeRegistrationModal}
        openerRef={registrationModalOpenerRef}
      />
    </div>
  )
}
