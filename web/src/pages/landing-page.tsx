import { routes } from '../app/routes'

import guaraMascot from '../assets/guara-bot-poses03.png'
import uespiImageBg from '../assets/uespi-img-bg.webp'
import { Icon, type IconName } from '../components/icons/icon'
import { AppHeader } from '../components/layout/app-header'
import { SiteFooter } from '../components/layout/site-footer'

import { cx } from '../utils/cx'

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
              Tire dúvidas sobre a Ouvidoria, entenda os tipos de manifestação ou comece a organizar uma denúncia — tudo
              sem precisar fazer login. Quando estiver tudo pronto, é só revisar e enviar.
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
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-landing-blue bg-landing-surface px-5 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:bg-landing-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.manifestationForm}
            >
              <Icon className="size-4" name="edit" />
              Registrar manifestação
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
    <section className="px-4 pb-10 md:px-0 md:pb-16">
      <div className="px-1 md:px-0" id="o-que-e">
        <SectionPill label="Sobre o canal" variant="highlight" />
        <h2 className="mt-3 max-w-md text-[24px] leading-tight font-black text-landing-text md:text-4xl">
          O que é a Ouvidoria?
        </h2>
        <p className="mt-4 max-w-3xl text-[13px] leading-[1.75] text-landing-brown md:text-[15px] md:leading-7">
          A Ouvidoria Geral da UESPI é um órgão de natureza mediadora, sem caráter administrativo, deliberativo ou
          judicante. Seu papel é aproximar a comunidade da gestão universitária com escuta qualificada, transparência e
          encaminhamento responsável.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {overviewPoints.map((item) => (
            <div className="flex items-center gap-3 rounded-lg bg-landing-muted-surface px-3 py-3" key={item.label}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-landing-blue/10 text-landing-blue">
                <Icon className="size-4" name={item.icon} />
              </span>
              <span className="text-[12px] leading-5 font-bold text-landing-text md:text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 md:pt-12" id="tipos">
        <SectionPill label="Manifestações" variant="blue" />
        <div className="mt-3 max-w-2xl">
          <h2 className="text-[22px] leading-tight font-black text-landing-text md:text-3xl">
            Tipos de manifestação
          </h2>
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
      </div>
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

function TrackManifestationSection() {
  return (
    <section className="px-4 pb-10 md:px-0 md:pb-16" id="consultar-manifestacao">
      <div className="px-1 md:px-0">
        <SectionPill label="Acompanhamento" variant="highlight" />
        <h2 className="mt-3 max-w-md text-[24px] leading-tight font-black text-landing-text md:text-4xl">
          Consulte sua manifestação
        </h2>
        <p className="mt-4 max-w-3xl text-[13px] leading-[1.75] text-landing-brown md:text-[15px] md:leading-7">
          Acompanhe o andamento da manifestação anônima com o protocolo e o código de acesso recebidos no registro. Por
          lá, você confere o status, visualiza os anexos e acompanha as atualizações da Ouvidoria.
        </p>
        <a
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white no-underline shadow-landing-step transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
          href={routes.track}
        >
          Consultar manifestação
          <Icon className="size-4" name="search" />
        </a>
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
        <OmbudsmanOverviewSection />
        <StepsSection />
        <TrackManifestationSection />
        <GuaraCallout />
      </main>
      <SiteFooter />
    </div>
  )
}
