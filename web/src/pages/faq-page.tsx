import { useMemo, useState } from 'react'

import { routes } from '../app/routes'
import { Icon, type IconName } from '../components/icons/icon'
import { AppHeader } from '../components/layout/app-header'
import { SiteFooter } from '../components/layout/site-footer'
import { cx } from '../utils/cx'

type FaqCategory = 'Registro' | 'Acompanhamento' | 'Privacidade' | 'Guará'

interface FaqItem {
  answer: string[]
  category: FaqCategory
  id: string
  question: string
}

interface QuickAction {
  description: string
  href: string
  icon: IconName
  label: string
}

const faqCategories: Array<FaqCategory | 'Todos'> = ['Todos', 'Registro', 'Acompanhamento', 'Privacidade', 'Guará']

const quickActions: QuickAction[] = [
  {
    description: 'Abra uma nova manifestação identificada ou anônima.',
    href: routes.manifestationForm,
    icon: 'edit',
    label: 'Registrar manifestação',
  },
  {
    description: 'Use protocolo e código para consultar uma manifestação anônima.',
    href: routes.track,
    icon: 'search',
    label: 'Consultar protocolo',
  },
  {
    description: 'Receba orientação inicial antes de preencher o formulário.',
    href: routes.guara,
    icon: 'message-circle',
    label: 'Fale com o Guará',
  },
]

const faqItems: FaqItem[] = [
  {
    answer: [
      'Manifestação é o registro formal de uma demanda enviada à Ouvidoria da UESPI. No sistema, ela pode ser uma denúncia, reclamação, sugestão ou elogio.',
      'Depois do envio, o sistema gera um protocolo único para acompanhar status, histórico e respostas disponíveis.',
    ],
    category: 'Registro',
    id: 'o-que-e-manifestacao',
    question: 'O que é uma manifestação?',
  },
  {
    answer: [
      'Não necessariamente. Você pode registrar de forma anônima pelo formulário público, mas precisa guardar o protocolo e o código de acesso exibidos ao final.',
      'Ao criar conta ou fazer login, suas manifestações ficam centralizadas no painel e o acompanhamento tende a ser mais simples.',
    ],
    category: 'Registro',
    id: 'precisa-conta',
    question: 'Preciso criar uma conta para registrar?',
  },
  {
    answer: [
      'Denúncia comunica possível irregularidade, violação de direitos, assédio, fraude, ameaça, discriminação ou outra conduta grave relacionada à universidade.',
      'Reclamação relata insatisfação com atendimento, serviço, infraestrutura ou processo. Sugestão propõe melhoria. Elogio reconhece uma boa prática, atendimento ou iniciativa.',
    ],
    category: 'Registro',
    id: 'tipos-manifestacao',
    question: 'Qual tipo de manifestação devo escolher?',
  },
  {
    answer: [
      'Sim. Ao escolher o registro anônimo, você não precisa se identificar. Nesse caso, o acompanhamento depende do protocolo e do código de acesso, que aparecem apenas uma vez após o envio.',
      'Quanto mais claro e completo for o relato, melhores são as condições de análise e encaminhamento pela Ouvidoria.',
    ],
    category: 'Privacidade',
    id: 'manifestacao-anonima',
    question: 'Posso registrar uma manifestação anônima?',
  },
  {
    answer: [
      'Anonimato significa registrar sem se identificar. Sigilo significa que a pessoa se identifica, mas seus dados pessoais devem ter acesso restrito conforme as regras institucionais e de privacidade.',
      'Ao encaminhar uma demanda, devem ser compartilhadas apenas as informações necessárias para análise e resposta, preservando a identificação quando aplicável.',
    ],
    category: 'Privacidade',
    id: 'anonimato-sigilo',
    question: 'Qual é a diferença entre anonimato e sigilo?',
  },
  {
    answer: [
      'Para manifestação identificada, acesse sua conta e abra a manifestação no painel. Para manifestação anônima, use a página de consulta com o protocolo e o código de acesso.',
      'O histórico mostra o status atual, mensagens, anexos disponíveis e respostas administrativas registradas.',
    ],
    category: 'Acompanhamento',
    id: 'acompanhar',
    question: 'Como acompanho minha manifestação?',
  },
  {
    answer: [
      'A resposta fica no próprio sistema da Ouvidoria, dentro do histórico da manifestação. Quando há resposta administrativa, o status passa para respondida e o texto fica disponível para consulta.',
      'No funcionamento atual, não conte com envio automático por e-mail, SMS ou WhatsApp. O canal oficial de acompanhamento é o sistema.',
    ],
    category: 'Acompanhamento',
    id: 'onde-vejo-resposta',
    question: 'Onde vejo a resposta da Ouvidoria?',
  },
  {
    answer: [
      'A Ouvidoria deve encaminhar decisão administrativa final em até 30 dias, prazo que pode ser prorrogado uma única vez por igual período mediante justificativa.',
      'Se a Ouvidoria solicitar complementação, o usuário tem 20 dias para responder, e o prazo volta a contar a partir da resposta enviada.',
    ],
    category: 'Acompanhamento',
    id: 'prazo-resposta',
    question: 'Qual é o prazo de resposta?',
  },
  {
    answer: [
      'Sim, quando a manifestação ainda estiver aberta para interação. Você pode enviar mensagens complementares no histórico e anexar evidências permitidas pelo sistema.',
      'Cada manifestação aceita até 5 arquivos, com até 10 MB cada, nos formatos PDF, JPG, JPEG, PNG ou WEBP. Manifestações finalizadas ou canceladas não recebem novas mensagens ou anexos.',
    ],
    category: 'Acompanhamento',
    id: 'complementar-anexos',
    question: 'Posso complementar meu relato ou enviar anexos depois?',
  },
  {
    answer: [
      'O Guará é o assistente virtual da Ouvidoria UESPI. Ele tira dúvidas, explica os tipos de manifestação e ajuda a organizar informações antes do preenchimento.',
      'Ele pode preparar um formulário com dados sugeridos, mas nenhuma manifestação é enviada sem sua revisão e confirmação.',
    ],
    category: 'Guará',
    id: 'guara-faz',
    question: 'O que o Guará pode fazer?',
  },
  {
    answer: [
      'No modo público, o Guará ajuda principalmente com dúvidas e com a organização de denúncias. Para reclamações, sugestões ou elogios, prefira fazer login ou preencher o formulário manual.',
      'Usuários autenticados como manifestantes podem receber apoio para organizar denúncia, reclamação, sugestão ou elogio. Perfis administrativos usam o Guará apenas de modo informativo.',
    ],
    category: 'Guará',
    id: 'guara-anonimo',
    question: 'O Guará abre qualquer tipo de manifestação?',
  },
  {
    answer: [
      'Se houver risco imediato, procure um local seguro e acione os canais de emergência ou autoridades competentes. Em emergência policial, use 190; para orientação ou registro junto à Polícia Civil, use 197 ou a delegacia competente.',
      'Depois que estiver em segurança, você pode registrar uma denúncia na Ouvidoria para análise institucional.',
    ],
    category: 'Registro',
    id: 'caso-grave',
    question: 'O que fazer em caso de ameaça, agressão ou emergência?',
  },
  {
    answer: [
      'Após a manifestação ser finalizada, o autor identificado pode registrar uma avaliação do atendimento. A avaliação é opcional e só pode ser enviada uma vez por manifestação.',
      'Manifestações anônimas não usam esse fluxo de avaliação identificado.',
    ],
    category: 'Acompanhamento',
    id: 'avaliacao-atendimento',
    question: 'Como avalio o atendimento?',
  },
]

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function FaqCategoryButton({
  category,
  isActive,
  onClick,
}: {
  category: FaqCategory | 'Todos'
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-pressed={isActive}
      className={cx(
        'min-h-10 rounded-lg px-4 text-sm leading-5 font-bold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue',
        isActive
          ? 'bg-landing-blue text-white shadow-landing-step'
          : 'border border-landing-chip bg-landing-surface text-landing-brown hover:border-landing-blue hover:bg-landing-blue/5',
      )}
      onClick={onClick}
      type="button"
    >
      {category}
    </button>
  )
}

function FaqAnswer({ item }: { item: FaqItem }) {
  return (
    <details className="group rounded-lg border border-landing-chip bg-landing-surface shadow-landing-step open:border-landing-blue/40">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-4 text-left marker:hidden md:px-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-landing-blue/10 text-landing-blue">
          <Icon className="size-5" name="help" />
        </span>
        <span className="min-w-0 flex-1 text-base leading-6 font-black text-landing-text">{item.question}</span>
        <Icon
          className="size-5 shrink-0 text-landing-blue transition duration-150 group-open:rotate-90"
          name="chevron-right"
        />
      </summary>
      <div className="border-t border-landing-chip px-4 py-4 md:px-5">
        <div className="max-w-3xl space-y-3 text-sm leading-7 text-landing-menu">
          {item.answer.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </details>
  )
}

export function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | 'Todos'>('Todos')
  const [search, setSearch] = useState('')
  const normalizedSearch = normalizeSearch(search)

  const filteredItems = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory

      if (!matchesCategory) {
        return false
      }

      if (normalizedSearch.length === 0) {
        return true
      }

      const searchableText = normalizeSearch([item.question, item.category, ...item.answer].join(' '))

      return searchableText.includes(normalizedSearch)
    })
  }, [activeCategory, normalizedSearch])

  const clearSearch = () => {
    setSearch('')
    setActiveCategory('Todos')
  }

  return (
    <div className="min-h-svh overflow-x-hidden bg-landing-surface font-sans text-landing-text">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-[18px] py-10 md:px-8 md:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-landing-blue/10 text-landing-blue">
            <Icon className="size-6" name="help" />
          </span>
          <p className="mt-5 text-[11px] leading-4 font-black tracking-[0.12em] text-landing-blue uppercase">
            Central de ajuda
          </p>
          <h1 className="mt-3 text-3xl leading-tight font-black text-landing-text md:text-5xl">
            Perguntas frequentes
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-landing-menu md:text-base">
            Encontre respostas rápidas sobre registro, acompanhamento, anonimato, prazos e uso do Guará no sistema de
            Ouvidoria da UESPI.
          </p>
        </section>

        <section className="mt-8 grid gap-3 md:mt-10 md:grid-cols-3" aria-label="Ações rápidas">
          {quickActions.map((action) => (
            <a
              className="group rounded-lg border border-landing-chip bg-landing-surface p-4 text-landing-text no-underline shadow-landing-step transition duration-150 hover:border-landing-blue hover:bg-landing-blue/5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={action.href}
              key={action.href}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-landing-blue/10 text-landing-blue">
                <Icon className="size-5" name={action.icon} />
              </span>
              <strong className="mt-3 block text-base leading-6 font-black">{action.label}</strong>
              <span className="mt-1 block text-sm leading-6 text-landing-menu">{action.description}</span>
              <span className="mt-3 inline-flex items-center gap-2 text-sm leading-5 font-bold text-landing-blue">
                Acessar
                <Icon className="size-4 transition duration-150 group-hover:translate-x-1" name="arrow-right" />
              </span>
            </a>
          ))}
        </section>

        <section className="mt-10 md:mt-12" aria-labelledby="faq-search-title">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl leading-8 font-black text-landing-text" id="faq-search-title">
                Buscar por assunto
              </h2>
              <p className="mt-2 text-sm leading-6 text-landing-menu">
                Use uma palavra-chave ou filtre por categoria para encontrar a orientação certa.
              </p>
            </div>
            <div className="relative md:w-80">
              <label className="sr-only" htmlFor="faq-search">
                Buscar no FAQ
              </label>
              <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-landing-menu" name="search" />
              <input
                className="min-h-12 w-full rounded-lg border border-landing-chip bg-landing-surface pr-11 pl-10 text-sm leading-5 text-landing-text outline-none transition duration-150 placeholder:text-landing-menu/70 focus:border-landing-blue focus:ring-3 focus:ring-landing-blue/15"
                id="faq-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ex.: protocolo, prazo, anônimo"
                type="search"
                value={search}
              />
              {search.length > 0 ? (
                <button
                  aria-label="Limpar busca"
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-landing-brown transition duration-150 hover:bg-landing-blue/10 hover:text-landing-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                  onClick={() => setSearch('')}
                  type="button"
                >
                  <Icon className="size-4" name="x" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="list" aria-label="Categorias de FAQ">
            {faqCategories.map((category) => (
              <div key={category} role="listitem">
                <FaqCategoryButton
                  category={category}
                  isActive={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6" aria-live="polite" aria-label="Respostas frequentes">
          <p className="text-sm leading-6 font-bold text-landing-brown">
            {filteredItems.length === 1 ? '1 resposta encontrada' : `${filteredItems.length} respostas encontradas`}
          </p>

          {filteredItems.length > 0 ? (
            <div className="mt-3 space-y-3">
              {filteredItems.map((item) => (
                <FaqAnswer item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-landing-chip bg-landing-muted-surface px-5 py-6 text-center">
              <Icon className="mx-auto size-8 text-landing-blue" name="search" />
              <h2 className="mt-3 text-lg leading-6 font-black text-landing-text">Nenhuma resposta encontrada</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-landing-menu">
                Tente uma palavra mais geral, limpe os filtros ou converse com o Guará para receber orientação.
              </p>
              <button
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white transition duration-150 hover:bg-landing-blue/90 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
                onClick={clearSearch}
                type="button"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>

        <section className="mt-10 rounded-lg bg-landing-muted-surface px-5 py-5 text-sm leading-6 text-landing-menu md:px-6">
          <h2 className="text-base leading-6 font-black text-landing-text">Ainda precisa de ajuda?</h2>
          <p className="mt-2">
            Se a dúvida envolver uma situação específica da UESPI, registre uma manifestação para que a Ouvidoria possa
            analisar o caso pelo fluxo oficial.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-landing-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-landing-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.manifestationForm}
            >
              Registrar manifestação
              <Icon className="size-4" name="edit" />
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-landing-blue/30 bg-landing-surface px-5 text-sm leading-5 font-bold text-landing-blue no-underline transition duration-150 hover:bg-landing-blue/5 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-landing-blue"
              href={routes.landing}
            >
              <Icon className="size-4" name="chevron-left" />
              Voltar para o início
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
