import { routes } from '../app/routes'
import { Icon, type IconName } from '../components/icons/icon'
import { AppHeader } from '../components/layout/app-header'
import { SiteFooter } from '../components/layout/site-footer'

interface PrivacyTopic {
  description: string
  icon: IconName
  title: string
}

const privacyTopics: PrivacyTopic[] = [
  {
    description:
      'Para registrar, acompanhar ou responder uma manifestação, o sistema pode solicitar nome, CPF, e-mail, telefone, vínculo com a UESPI, campus, unidade administrativa, relato da manifestação, anexos e dados de acesso. Em registros anônimos, são usados apenas os dados necessários para gerar o protocolo e o código de acompanhamento.',
    icon: 'file-text',
    title: 'Dados coletados',
  },
  {
    description:
      'As informações são usadas para identificar o solicitante quando necessário, registrar a manifestação, encaminhar a demanda ao setor responsável, permitir o acompanhamento do atendimento e cumprir obrigações legais de transparência, controle e prestação do serviço público.',
    icon: 'check-circle',
    title: 'Finalidade da coleta',
  },
  {
    description:
      'O site pode utilizar cookies técnicos e dados básicos de navegação para manter a sessão ativa, proteger o acesso, lembrar preferências essenciais e melhorar a estabilidade do serviço. Não utilizamos esses recursos para venda de dados pessoais.',
    icon: 'settings',
    title: 'Uso de cookies e rastreamento',
  },
  {
    description:
      'Os dados podem ser compartilhados com setores internos da UESPI ou órgãos competentes quando isso for necessário para apurar, responder ou cumprir uma obrigação legal. O compartilhamento é limitado à finalidade do atendimento e às regras aplicáveis de sigilo.',
    icon: 'share',
    title: 'Compartilhamento com terceiros',
  },
  {
    description:
      'O usuário pode solicitar acesso, correção, atualização, anonimização, bloqueio ou exclusão de dados pessoais, quando cabível pela legislação. Também pode pedir informações sobre o tratamento dos dados pelos canais oficiais da Ouvidoria.',
    icon: 'user',
    title: 'Direitos do usuário',
  },
  {
    description:
      'A plataforma adota medidas técnicas e administrativas para proteger as informações contra acessos indevidos, perda ou uso inadequado. Os dados são mantidos pelo tempo necessário ao atendimento, auditoria, obrigações legais e políticas institucionais de guarda documental.',
    icon: 'lock',
    title: 'Segurança e armazenamento',
  },
]

export function PrivacyPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-landing-surface font-sans text-landing-text">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-[18px] py-10 md:px-8 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-landing-blue/10 text-landing-blue">
            <Icon className="size-6" name="shield" />
          </span>
          <p className="mt-5 text-[11px] leading-4 font-black tracking-[0.12em] text-landing-blue uppercase">
            Privacidade e proteção de dados
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-black text-landing-text md:text-5xl">
            Como tratamos suas informações
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-landing-menu md:text-base">
            Esta página resume, de forma simples, como a Ouvidoria UESPI coleta, utiliza, protege e compartilha dados
            pessoais em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5" aria-label="Informações de privacidade">
          {privacyTopics.map((topic) => (
            <article
              className="rounded-lg border border-landing-chip bg-landing-surface p-5 shadow-landing-step md:p-6"
              key={topic.title}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-landing-blue/10 text-landing-blue">
                  <Icon className="size-5" name={topic.icon} />
                </span>
                <div>
                  <h2 className="text-lg leading-6 font-black text-landing-text">{topic.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-landing-menu">{topic.description}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-lg bg-landing-muted-surface px-5 py-5 text-sm leading-6 text-landing-menu md:px-6">
          <h2 className="text-base leading-6 font-black text-landing-text">Canal de contato</h2>
          <p className="mt-2">
            Em caso de dúvidas sobre privacidade ou tratamento de dados pessoais, entre em contato com a Ouvidoria pelo
            e-mail{' '}
            <a
              className="font-bold text-landing-blue no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
              href="mailto:ouvidoria@uespi.br"
            >
              ouvidoria@uespi.br
            </a>
            .
          </p>
          <a
            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
            href={routes.landing}
          >
            <Icon className="size-4" name="chevron-left" />
            Voltar para o início
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
