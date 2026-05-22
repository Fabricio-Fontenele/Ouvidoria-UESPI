import { routes } from '../app/routes'

import guaraMascot from '../assets/guara-mascot.png'
import uespiImageBg from '../assets/uespi-img-bg.webp'
import { Icon, type IconName } from '../components/icons/icon'
import { AppHeader } from '../components/layout/app-header'
import { SiteFooter } from '../components/layout/site-footer'

import { cx } from '../utils/cx'

interface ManifestationType {
  label: string
}

interface Step {
  accent: 'blue' | 'yellow'
  description: string
  icon: IconName
  title: string
}

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
    description:
      'Crie a sua conta e, em seguida, faça a sua manifestação de forma anônima ou não, utilizando o formulário digital seguro.',
    icon: 'edit',
    title: 'Registre',
  },
  {
    accent: 'blue',
    description:
      'Crie a sua conta e, em seguida, faça a sua manifestação de forma anônima ou não, utilizando o formulário digital seguro.',
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
          O canal oficial para manifestações, sugestões e elogios. Participe ativamente da evolução acadêmica e
          administrativa da UESPI.
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
      <h2 className="mx-auto mt-1 max-w-[150px] text-[18px] leading-[1.12] font-black text-landing-text md:max-w-xs md:text-3xl">
        Já possui um Cadastro?
      </h2>
      <p className="mx-auto mt-5 max-w-[170px] text-[12px] leading-[1.55] text-landing-text md:max-w-sm md:text-[15px] md:leading-6">
        Entre na sua conta para gerenciar seus chamados ou criar novos registros identificados.
      </p>
      <a
        className="mx-auto mt-[22px] inline-flex min-h-[28px] min-w-[132px] items-center justify-center rounded-[3px] bg-landing-blue px-4 text-[10px] leading-none font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:min-h-10 md:min-w-48 md:rounded-lg md:text-[15px]"
        href={routes.login}
      >
        Entrar na sua conta
      </a>
      <p className="mt-3 text-[9px] leading-4 text-landing-menu md:text-[13px] md:leading-5">
        Não tem uma conta?{' '}
        <a
          className="text-landing-blue no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
          href={routes.sign}
        >
          Cadastre-se aqui.
        </a>
      </p>
    </section>
  )
}

function GuaraCallout() {
  return (
    <section className="px-4 pb-9 md:px-8 md:pb-12" id="guara">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-landing-chip bg-landing-muted-surface px-5 py-6 text-center shadow-landing-step md:flex-row md:gap-7 md:px-8 md:py-7 md:text-left">
        <img alt="" className="size-40 shrink-0 object-contain md:size-56" src={guaraMascot} />
        <div className="flex-1">
          <span className="inline-flex rounded-full bg-landing-blue/10 px-2.5 py-1 text-[9px] leading-none font-black tracking-[0.08em] text-landing-blue uppercase md:text-[10px]">
            Assistente virtual
          </span>
          <h2 className="mt-2 text-[20px] leading-tight font-black text-landing-text md:text-2xl">Fale com o Guará</h2>
          <p className="mt-2 text-[12px] leading-[1.6] text-landing-text md:text-[15px] md:leading-6">
            Tire dúvidas sobre a Ouvidoria, entenda os tipos de manifestação ou comece a organizar uma denúncia — tudo
            sem precisar fazer login. Quando estiver tudo pronto, é só revisar e enviar.
          </p>
          <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 md:justify-start">
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.guara}
            >
              <Icon className="size-4" name="message-circle" />
              Conversar com o Guará
            </a>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-landing-blue bg-transparent px-5 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:bg-landing-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.manifestationForm}
            >
              <Icon className="size-4" name="edit" />
              Registrar manifestação
            </a>
          </div>
          <p className="mt-3 text-[11px] leading-4 text-landing-menu md:text-xs md:leading-5">
            Sem login, o registro é feito anonimamente — o protocolo e o código de acesso são exibidos apenas uma vez.
          </p>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="px-[18px] pb-[28px] md:px-0 md:pb-0" id="o-que-e">
      <SectionPill label="Sobre o canal" variant="highlight" />
      <h2 className="mt-3 text-[20px] leading-none font-black text-landing-text md:text-2xl md:leading-8">
        O que é a Ouvidoria?
      </h2>
      <p className="mt-3 text-[12px] leading-[1.7] text-landing-text md:text-[15px] md:leading-6">
        A Ouvidoria Geral da UESPI é um órgão de natureza mediadora, sem caráter administrativo, deliberativo ou
        judicante. Nosso papel é promover o diálogo entre a comunidade e a gestão universitária, assegurando a
        transparência e a eficiência nos serviços públicos.
      </p>
    </section>
  )
}

function TypesSection() {
  return (
    <section className="px-[18px] pb-[30px] md:px-0 md:pb-0" id="tipos">
      <SectionPill label="Manifestações" variant="blue" />
      <h2 className="mt-3 text-[20px] leading-none font-black text-landing-text md:text-2xl md:leading-8">
        Tipos de manifestação
      </h2>
      <ul className="mt-3 list-disc pl-[18px] text-[12px] leading-[1.65] text-landing-text md:text-[15px] md:leading-6">
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
      <h2 className="text-[21px] leading-none font-black text-landing-text md:text-3xl md:leading-none">
        Como funciona?
      </h2>
      <p className="mx-auto mt-4 max-w-[210px] text-[10px] leading-[1.55] text-landing-text md:max-w-sm md:text-[15px] md:leading-6">
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
            <Icon
              className={cx(
                'size-[18px] md:size-6',
                step.accent === 'blue' ? 'text-landing-blue' : 'text-landing-warning',
              )}
              name={step.icon}
            />
            <h3 className="mt-3 text-[12px] leading-none font-medium text-landing-text md:mt-4 md:text-lg">
              {step.title}
            </h3>
            <p className="mt-4 text-[10px] leading-[1.55] text-landing-text md:text-sm md:leading-5">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-landing-surface font-sans text-landing-text">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl bg-landing-surface md:px-8">
        <HeroSection />
        <LoginCallout />
        <GuaraCallout />
        <div className="md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] md:gap-12 md:py-16">
          <AboutSection />
          <TypesSection />
        </div>
        <StepsSection />
      </main>
      <SiteFooter />
    </div>
  )
}
