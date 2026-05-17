import { routes } from '../app/routes'
import guarapiMascot from '../assets/guarapi-mascot.png'

import guarapiPoses from '../assets/poses-guara.webp'
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

function SectionPill() {
  return (
    <span className="inline-flex rounded-full bg-landing-blue px-2.5 py-1 text-[8px] leading-none font-black tracking-[0.08em] text-white uppercase md:px-3 md:py-1.5 md:text-[10px]">
      Sobre o canal
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

function AboutSection() {
  return (
    <section className="px-[18px] pb-[28px] md:px-0 md:pb-0" id="o-que-e">
      <SectionPill />
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
      <SectionPill />
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

function GuarapiSection() {
  return (
    <section
      className="px-5 pb-[32px] text-center md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-center md:gap-8 md:px-0 md:pb-16 md:text-left"
      id="guarapi"
    >
      <img
        alt="Guarapi segurando um celular"
        className="mx-auto mt-5 h-[164px] w-[188px] object-contain md:order-first md:mt-0 md:h-72 md:w-80"
        src={guarapiPoses}
      />
      <div>
        <h2 className="text-[20px] leading-none font-black text-landing-text md:text-3xl md:leading-none">
          Fale com o Guarapi
        </h2>
        <p className="mx-auto mt-5 max-w-[220px] text-[12px] leading-[1.6] text-landing-text md:mx-0 md:max-w-md md:text-[15px] md:leading-6">
          Sinta-se à vontade para pedir ajuda ao Guarapi, o nosso agente de IA. Ele te ajuda a entender como funciona o
          serviço e facilita o registro da sua manifestação.
        </p>
        <a
          className="mx-auto mt-5 inline-flex min-h-[32px] min-w-[132px] items-center justify-center rounded-[4px] bg-landing-blue px-4 text-[10px] leading-none font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:mx-0 md:min-h-10 md:min-w-40 md:rounded-lg md:text-[15px]"
          href={routes.guarapi}
        >
          Fale com o Guarapi
        </a>
      </div>
    </section>
  )
}

function GuarapiFloatingButton() {
  return (
    <a
      aria-label="Abrir chat com o Guarapi"
      className="fixed right-3 bottom-7 z-30 grid size-20 place-items-center rounded-full drop-shadow-landing-mascot transition duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-landing-blue sm:right-6 sm:bottom-8 sm:size-24 lg:right-8 lg:bottom-9 lg:size-28"
      href={routes.guarapi}
    >
      <img alt="" className="size-full rounded-full object-contain p-1.5" src={guarapiMascot} />
    </a>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-landing-surface font-sans text-landing-text">
      <AppHeader />
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
      <SiteFooter />
      <GuarapiFloatingButton />
    </div>
  )
}
