import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'

import uespiLogo from '../assets/brasao.png'
import guarapiMascot from '../assets/guarapi-mascot.png'
import { Icon, type IconName } from '../components/icon'
import { cx } from '../utils/cx'

interface MenuItem {
  href: string
  label: string
}

interface ManifestationType {
  label: string
}

interface Step {
  accent: 'blue' | 'yellow'
  description: string
  icon: IconName
  title: string
}

const menuItems: MenuItem[] = [
  { href: '#o-que-e', label: 'O que é' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#tipos', label: 'Tipos de manifestação' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#guarapi', label: 'Fale com o Guarapí' },
  { href: '/login', label: 'Acessar sistema' },
  { href: '#faq', label: 'FAQ' },
]

const manifestationTypes: ManifestationType[] = [
  { label: 'Denúncia' },
  { label: 'Reclamação' },
  { label: 'Solicitação' },
  { label: 'Sugestão' },
  { label: 'Elogio' },
]

const steps: Step[] = [
  {
    accent: 'blue',
    description: 'Crie a sua conta e, em seguida, faça a sua manifestação de forma anônima ou não, utilizando o formulário digital seguro.',
    icon: 'edit',
    title: 'Registre',
  },
  {
    accent: 'blue',
    description: 'Crie a sua conta e, em seguida, faça a sua manifestação de forma anônima ou não, utilizando o formulário digital seguro.',
    icon: 'braces',
    title: 'Em análise',
  },
  {
    accent: 'blue',
    description: 'A manifestação é enviada para o setor responsável. A área técnica analisa o caso e prepara a resposta.',
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

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const headerButtonClasses =
  'grid size-9 place-items-center rounded-full text-landing-blue transition duration-150 hover:bg-landing-blue/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue'

function SectionPill() {
  return (
    <span className="inline-flex rounded-full bg-landing-blue px-2.5 py-1 text-[8px] leading-none font-black tracking-[0.08em] text-white uppercase md:px-3 md:py-1.5 md:text-[10px]">
      Sobre o canal
    </span>
  )
}

function LandingMenu({
  isOpen,
  onClose,
  openerRef,
}: {
  isOpen: boolean
  onClose: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

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

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector)
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
    <div className="fixed inset-0 z-50 bg-landing-surface">
      <aside
        aria-labelledby="landing-menu-title"
        aria-modal="true"
        className="flex min-h-svh flex-col bg-landing-surface"
        onKeyDown={handlePanelKeyDown}
        role="dialog"
      >
        <div className="grid h-[99px] grid-cols-[58px_1fr_42px] items-center gap-4 px-8 shadow-landing-header sm:h-48 sm:grid-cols-[110px_1fr_58px] sm:px-16">
          <img alt="Brasão da UESPI" className="h-16 w-11 object-contain sm:h-24 sm:w-16" src={uespiLogo} />
          <strong className="text-center text-[22px] leading-7 font-bold text-landing-blue sm:text-[40px] sm:leading-none" id="landing-menu-title">
            Ouvidoria UESPI
          </strong>
          <button aria-label="Fechar menu" className={headerButtonClasses} onClick={handleClose} ref={closeButtonRef} type="button">
            <Icon className="size-8 sm:size-11" name="x" />
          </button>
        </div>

        <nav aria-label="Menu da landing page" className="pt-8 pr-8 sm:pt-9 sm:pr-16">
          <ul className="flex flex-col items-end gap-9 sm:gap-[52px]">
            {menuItems.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <a
                  className="rounded-sm text-right text-xl leading-none font-medium text-landing-menu no-underline transition duration-150 hover:text-landing-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-landing-blue sm:text-[32px]"
                  href={item.href}
                  onClick={onClose}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <img
          alt=""
          className="mt-auto mb-[19vh] ml-auto mr-8 h-28 w-28 rounded-full object-contain p-1 drop-shadow-landing-mascot sm:mr-16 sm:mb-52 sm:h-36 sm:w-36"
          src={guarapiMascot}
        />
      </aside>
    </div>
  )
}

function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <header className="sticky top-0 z-40 h-11 bg-landing-surface shadow-landing-header">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-[42px_1fr_42px] items-center px-2 sm:px-6 lg:px-10">
          <a className="justify-self-start" href="/" aria-label="Página inicial">
            <img alt="Brasão da UESPI" className="h-8 w-5 object-contain md:h-9 md:w-6" src={uespiLogo} />
          </a>
          <strong className="text-center text-[11px] leading-none font-bold text-landing-blue md:text-sm">Ouvidoria UESPI</strong>
          <button
            aria-controls="landing-menu"
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu"
            className={cx(headerButtonClasses, 'justify-self-end')}
            onClick={() => setIsMenuOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <Icon className="size-4" name="menu" />
          </button>
        </div>
      </header>

      <div id="landing-menu">
        <LandingMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} openerRef={menuButtonRef} />
      </div>
    </>
  )
}

function HeroSection() {
  return (
    <section className="landing-hero-bg relative min-h-[245px] overflow-hidden px-[17px] pt-[21px] pb-5 md:min-h-[340px] md:rounded-b-lg md:px-8 md:pt-12 lg:min-h-[390px] lg:px-10 lg:pt-14">
      <div className="relative max-w-[188px] md:max-w-sm lg:max-w-md">
        <h1 className="text-[31px] leading-[1.1] font-black tracking-[-0.02em] text-landing-text md:text-[44px] lg:text-5xl">
          Sua voz constrói a nossa <span className="text-landing-blue">universidade.</span>
        </h1>
        <p className="mt-4 text-[9px] leading-[1.85] text-landing-text md:mt-5 md:max-w-xs md:text-sm md:leading-6">
          O canal oficial para manifestações, sugestões e elogios. Participe ativamente da evolução acadêmica e administrativa da UESPI.
        </p>
      </div>
    </section>
  )
}

function LoginCallout() {
  return (
    <section className="relative px-4 pt-4 pb-9 text-center md:px-8 md:py-12">
      <span className="mx-auto grid size-8 place-items-center text-landing-blue md:size-10">
        <Icon className="size-7 md:size-8" name="lock-open" />
      </span>
      <h2 className="mx-auto mt-1 max-w-[150px] text-[18px] leading-[1.12] font-black text-landing-text md:max-w-xs md:text-3xl">Já possui um Cadastro?</h2>
      <p className="mx-auto mt-5 max-w-[142px] text-[10px] leading-[1.65] text-landing-text md:max-w-sm md:text-sm md:leading-6">
        Entre na sua conta para gerenciar seus chamados ou criar novos registros identificados.
      </p>
      <a
        className="mx-auto mt-[22px] inline-flex min-h-[26px] min-w-[124px] items-center justify-center rounded-[3px] bg-landing-blue px-4 text-[9px] leading-none font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:min-h-10 md:min-w-48 md:rounded-lg md:text-sm"
        href="/login"
      >
        Entrar na sua conta
      </a>
      <p className="mt-3 text-[8px] leading-3 text-landing-menu md:text-xs md:leading-5">
        Não tem uma conta?{' '}
        <a className="text-landing-blue no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue" href="/sign">
          Cadastre-se aqui.
        </a>
      </p>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="px-[18px] pb-[28px] md:px-0 md:pb-0" id="o-que-e">
      <SectionPill />
      <h2 className="mt-3 text-[20px] leading-none font-black text-landing-text md:text-2xl md:leading-8">O que é a Ouvidoria?</h2>
      <p className="mt-3 text-[10px] leading-[1.8] text-landing-text md:text-sm md:leading-6">
        A Ouvidoria Geral da UESPI é um órgão de natureza mediadora, sem caráter administrativo, deliberativo ou judicante.
        Nosso papel é promover o diálogo entre a comunidade e a gestão universitária, assegurando a transparência e a eficiência nos serviços públicos.
      </p>
    </section>
  )
}

function TypesSection() {
  return (
    <section className="px-[18px] pb-[30px] md:px-0 md:pb-0" id="tipos">
      <SectionPill />
      <h2 className="mt-3 text-[20px] leading-none font-black text-landing-text md:text-2xl md:leading-8">Tipos de manifestação</h2>
      <ul className="mt-3 list-disc pl-[18px] text-[10px] leading-[1.6] text-landing-text md:text-sm md:leading-6">
        {manifestationTypes.map((type) => (
          <li key={type.label}>{type.label}</li>
        ))}
      </ul>
    </section>
  )
}

function StepsSection() {
  return (
    <section className="px-6 pb-[50px] text-center md:px-0 md:pb-16" id="como-funciona">
      <h2 className="text-[21px] leading-none font-black text-landing-text md:text-3xl md:leading-none">Como funciona?</h2>
      <p className="mx-auto mt-4 max-w-[174px] text-[8px] leading-[1.45] text-landing-text md:max-w-sm md:text-sm md:leading-6">
        De que modo é que o fluxo da sua manifestação é gerido pela nossa ouvidoria?
      </p>

      <div className="mt-6 space-y-6 text-left md:mt-10 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {steps.map((step) => (
          <article
            className={cx(
              'min-h-[114px] rounded-lg border-l-[3px] bg-landing-surface px-3.5 pt-4 pb-3 shadow-landing-step md:min-h-44 md:px-5 md:pt-5 md:pb-4',
              step.accent === 'blue' ? 'border-l-landing-blue' : 'border-l-landing-warning',
            )}
            key={step.title}
          >
            <Icon className={cx('size-[18px] md:size-6', step.accent === 'blue' ? 'text-landing-blue' : 'text-landing-warning')} name={step.icon} />
            <h3 className="mt-3 text-[12px] leading-none font-medium text-landing-text md:mt-4 md:text-lg">{step.title}</h3>
            <p className="mt-4 text-[8px] leading-[1.55] text-landing-text md:text-xs md:leading-5">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function GuarapiSection() {
  return (
    <section className="px-5 pb-[32px] text-center md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-8 md:px-0 md:pb-16 md:text-left" id="guarapi">
      <img alt="Guarapi segurando um celular" className="mx-auto mt-5 h-[136px] w-[156px] object-contain md:order-first md:mt-0 md:h-56 md:w-64" src={guarapiMascot} />
      <div>
        <h2 className="text-[20px] leading-none font-black text-landing-text md:text-3xl md:leading-none">Fale com o Guarapi</h2>
        <p className="mx-auto mt-5 max-w-[182px] text-[10px] leading-[1.6] text-landing-text md:mx-0 md:max-w-md md:text-sm md:leading-6">
          Sinta-se à vontade para pedir ajuda ao Guarapi, o nosso agente de IA. Ele te ajuda a entender como funciona o serviço e facilita o registro da sua manifestação.
        </p>
        <a
          className="mx-auto mt-5 inline-flex min-h-[30px] min-w-[124px] items-center justify-center rounded-[4px] bg-landing-blue px-4 text-[9px] leading-none font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:mx-0 md:min-h-10 md:min-w-40 md:rounded-lg md:text-sm"
          href="#chat-guarapi"
        >
          Fale com o Guarapi
        </a>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="rounded-t-lg bg-landing-footer px-[18px] pt-6 pb-7 text-landing-text md:rounded-none md:px-0 md:pt-8 md:pb-10">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-8 gap-y-6 md:px-8">
        <div>
          <h2 className="text-[13px] leading-none font-black tracking-[0.12em] text-landing-blue uppercase md:text-sm">Institucional</h2>
          <nav aria-label="Links institucionais" className="mt-6">
            <ul className="space-y-3 text-[11px] leading-none md:text-sm md:leading-5">
              <li>
                <a className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue" href="#transparencia">
                  Transparência
                </a>
              </li>
              <li>
                <a className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue" href="https://aluno.uespi.br">
                  Portal do Aluno
                </a>
              </li>
              <li>
                <a className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue" href="#privacidade">
                  Privacidade
                </a>
              </li>
              <li>
                <a className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue" href="#contato">
                  Contato
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div>
          <div className="flex items-center gap-2 text-landing-blue">
            <Icon className="size-5" name="shield" />
            <strong className="text-xl leading-none font-bold md:text-2xl">UESPI</strong>
          </div>
          <p className="mt-6 max-w-[180px] text-[11px] leading-[1.55] md:max-w-xs md:text-sm md:leading-6">Rua João Cabral, 2231 - Pirajá | Teresina - PI, 64002-150</p>
          <p className="mt-1 text-[11px] leading-none md:text-sm md:leading-5">(86) 3213-7150</p>
        </div>

        <p className="col-span-2 mx-auto max-w-[320px] text-center text-[11px] leading-[1.65] md:text-sm md:leading-6">© 2024 Universidade Estadual do Piauí - UESPI. Todos os direitos reservados.</p>

        <div className="col-span-2 flex gap-3">
          <a aria-label="Compartilhar" className="grid size-8 place-items-center rounded-full bg-landing-social text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:size-9" href="#compartilhar">
            <Icon className="size-3.5 md:size-4" name="share" />
          </a>
          <a aria-label="Enviar email" className="grid size-8 place-items-center rounded-full bg-landing-social text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:size-9" href="mailto:ouvidoria@uespi.br">
            <Icon className="size-3.5 md:size-4" name="email" />
          </a>
        </div>
      </div>
    </footer>
  )
}

function GuarapiFloatingButton() {
  return (
    <a
      aria-label="Abrir chat com o Guarapi"
      className="fixed right-3 bottom-7 z-30 grid size-20 place-items-center rounded-full drop-shadow-landing-mascot transition duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-landing-blue sm:right-6 sm:bottom-8 sm:size-24 lg:right-8 lg:bottom-9 lg:size-28"
      href="#chat-guarapi"
    >
      <img alt="" className="size-full rounded-full object-contain p-1.5" src={guarapiMascot} />
    </a>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-landing-surface font-sans text-landing-text">
      <LandingHeader />
      <main className="mx-auto w-full max-w-5xl bg-landing-surface md:px-8">
        <HeroSection />
        <LoginCallout />
        <div className="md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] md:gap-12 md:py-16">
          <AboutSection />
          <TypesSection />
        </div>
        <StepsSection />
        <GuarapiSection />
      </main>
      <LandingFooter />
      <GuarapiFloatingButton />
    </div>
  )
}
