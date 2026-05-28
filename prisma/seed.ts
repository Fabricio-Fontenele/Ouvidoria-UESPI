import { createHash } from 'node:crypto'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env['DATABASE_URL']

if (connectionString === undefined || connectionString === '') {
  throw new Error('DATABASE_URL must be set before the seed runs')
}

const databaseUrl = new URL(connectionString)
const schema = databaseUrl.searchParams.get('schema') ?? 'public'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl.toString() }, { schema }),
})

const developmentPassword = 'Senha123'
const passwordHashRounds = Number(process.env['PASSWORD_HASH_ROUNDS'] ?? '10')

const usersSeedData = [
  {
    email: 'ouvidoriaa.guara@gmail.com',
    name: 'Guará Ouvidoria',
    role: 'ombudsman' as const,
  },
  {
    email: 'ouvidor@uespi.br',
    name: 'Ouvidor de Demonstração',
    role: 'ombudsman' as const,
  },
  {
    email: 'admin@uespi.br',
    name: 'Administrador de Demonstração',
    role: 'admin' as const,
  },
  {
    email: 'manifestante@uespi.br',
    name: 'Manifestante de Demonstração',
    role: 'manifestant' as const,
  },
]

const anonymousAccessCode = 'ABC123'

const headquartersCampusId = 'campus-poeta-torquato-neto'

const campusCatalogEntries = [
  {
    id: 'campus-poeta-torquato-neto',
    slug: 'poeta-torquato-neto',
    name: 'Campus Poeta Torquato Neto',
    city: 'Teresina',
  },
  {
    id: 'campus-clovis-moura',
    slug: 'clovis-moura',
    name: 'Campus Clóvis Moura',
    city: 'Teresina',
  },
  {
    id: 'campus-professor-alexandre-alves-de-oliveira',
    slug: 'professor-alexandre-alves-de-oliveira',
    name: 'Campus Professor Alexandre Alves de Oliveira',
    city: 'Parnaíba',
  },
  {
    id: 'campus-professor-antonio-giovanni-alves-de-sousa',
    slug: 'professor-antonio-giovani-alves-de-sousa',
    name: 'Campus Professor Antônio Giovani Alves de Sousa',
    city: 'Piripiri',
  },
  {
    id: 'campus-herois-do-jenipapo',
    slug: 'herois-do-jenipapo',
    name: 'Campus Heróis do Jenipapo',
    city: 'Campo Maior',
  },
  {
    id: 'nucleo-barras',
    slug: 'barras',
    name: 'Núcleo de Barras',
    city: 'Barras',
  },
  {
    id: 'campus-professor-barros-araujo',
    slug: 'professor-barros-araujo',
    name: 'Campus Professor Barros Araújo',
    city: 'Picos',
  },
  {
    id: 'campus-possidonio-queiroz',
    slug: 'possidonio-queiroz',
    name: 'Campus Possidônio Queiroz',
    city: 'Oeiras',
  },
  {
    id: 'campus-doutora-josefina-demes',
    slug: 'doutora-josefina-demes',
    name: 'Campus Dra. Josefina Demes',
    city: 'Floriano',
  },
  {
    id: 'campus-professor-ariston-dias-lima',
    slug: 'professor-ariston-dias-lima',
    name: 'Campus Professor Ariston Dias Lima',
    city: 'São Raimundo Nonato',
  },
  {
    id: 'campus-urucui',
    slug: 'urucui',
    name: 'Campus Uruçuí',
    city: 'Uruçuí',
  },
  {
    id: 'campus-dom-jose-vasquez-dias',
    slug: 'dom-jose-vasquez-dias',
    name: 'Campus Dom José Vasquez Dias',
    city: 'Bom Jesus',
  },
  {
    id: 'campus-deputado-jesualdo-cavalcante',
    slug: 'deputado-jesualdo-cavalcante',
    name: 'Campus Deputado Jesualdo Cavalcante',
    city: 'Corrente',
  },
] as const

const campuses = campusCatalogEntries.map(({ id, name, city }) => ({
  id,
  name,
  city,
  isActive: true,
}))

const centralAdministrativeUnits = [
  {
    id: 'unit-reitoria',
    name: 'Reitoria',
    description:
      'órgão executivo máximo da universidade; condução geral, planejamento estratégico e representação institucional',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-vice-reitoria',
    name: 'Vice-Reitoria',
    description: 'apoio à Reitoria, substituição do Reitor em afastamentos e articulação de projetos institucionais',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-preg',
    name: 'Pró-Reitoria de Ensino de Graduação',
    description: 'matrículas, currículos, calendário acadêmico e regulação dos cursos de graduação',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-prad',
    name: 'Pró-Reitoria de Administração',
    description:
      'orçamento, compras, contratos, infraestrutura administrativa e gestão de pessoal técnico-administrativo',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-prex',
    name: 'Pró-Reitoria de Extensão, Assuntos Estudantis e Comunitários',
    description: 'bolsas, auxílios estudantis, restaurante universitário, programas de extensão e ações comunitárias',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-prop',
    name: 'Pró-Reitoria de Pesquisa e Pós-Graduação',
    description: 'programas de mestrado e doutorado, iniciação científica e fomento à pesquisa',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-proplan',
    name: 'Pró-Reitoria de Planejamento e Finanças',
    description: 'orçamento institucional, planejamento estratégico, prestação de contas e gestão financeira',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-ouvidoria',
    name: 'Ouvidoria',
    description:
      'canal oficial de manifestações dos usuários (denúncia, reclamação, sugestão, elogio); recebe e encaminha às unidades responsáveis',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-biblioteca-central',
    name: 'Biblioteca Central',
    description: 'acervo central, empréstimo de livros, normalização de trabalhos acadêmicos e espaço de estudo',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-ascom',
    name: 'Assessoria de Comunicação',
    description: 'imprensa, redes sociais oficiais, divulgação institucional e comunicação externa da universidade',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-assejur',
    name: 'Assessoria Jurídica',
    description: 'pareceres jurídicos, contratos, contencioso e suporte legal à administração da universidade',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-auditoria',
    name: 'Auditoria',
    description: 'controle interno, auditoria de processos, contas e conformidade administrativa',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-dtic',
    name: 'Departamento de Tecnologia da Informação e Comunicação',
    description: 'rede, sistemas institucionais, e-mail institucional, suporte de TI e infraestrutura tecnológica',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-nit',
    name: 'Núcleo de Inovação Tecnológica',
    description: 'patentes, transferência de tecnologia, propriedade intelectual e apoio à inovação',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-npj',
    name: 'Núcleo de Práticas Jurídicas',
    description: 'estágios obrigatórios e atendimento jurídico à comunidade vinculados ao curso de Direito',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-nucepe',
    name: 'Núcleo de Concursos e Promoção de Eventos',
    description: 'organização de vestibular, concursos públicos, processos seletivos e eventos institucionais',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-almoxarifado',
    name: 'Almoxarifado',
    description: 'gestão de materiais, suprimentos, estoque e distribuição de bens de consumo',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-prefeitura-universitaria',
    name: 'Prefeitura Universitária',
    description: 'manutenção predial, obras, limpeza, segurança patrimonial e logística do campus sede',
    campusId: headquartersCampusId,
    isActive: true,
  },
]

const poetaTorquatoCenters = [
  {
    id: 'unit-ccsa',
    name: 'Centro de Ciências Sociais Aplicadas',
    description: 'centro acadêmico que reúne cursos como Administração, Ciências Contábeis, Direito e Turismo',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-cchl',
    name: 'Centro de Ciências Humanas e Letras',
    description: 'centro acadêmico que reúne cursos como Letras, História, Geografia e Filosofia',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-cceca',
    name: 'Centro de Ciências da Educação, Comunicação e Artes',
    description: 'centro acadêmico que reúne cursos como Pedagogia, Jornalismo, Música e Artes Visuais',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-ctu',
    name: 'Centro de Tecnologia e Urbanismo',
    description: 'centro acadêmico que reúne cursos como Engenharia, Arquitetura e Ciência da Computação',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-ccn',
    name: 'Centro de Ciências da Natureza',
    description: 'centro acadêmico que reúne cursos como Biologia, Química, Física e Matemática',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-ccs',
    name: 'Centro de Ciências da Saúde',
    description: 'centro acadêmico que reúne cursos como Medicina, Enfermagem, Odontologia, Fisioterapia e Nutrição',
    campusId: headquartersCampusId,
    isActive: true,
  },
  {
    id: 'unit-cca',
    name: 'Centro de Ciências Agrárias',
    description: 'centro acadêmico que reúne cursos como Agronomia, Medicina Veterinária e Engenharia Florestal',
    campusId: headquartersCampusId,
    isActive: true,
  },
]

const campusAdministrativeUnits = campusCatalogEntries.flatMap(({ id: campusId, slug, name }) => {
  const isNucleus = name.startsWith('Núcleo')

  const baseUnits = [
    {
      id: `unit-${isNucleus ? 'coordenacao' : 'direcao'}-${slug}`,
      name: `${isNucleus ? 'Coordenação' : 'Direção'} do ${name}`,
      description: isNucleus
        ? 'coordenação administrativa do núcleo; condução geral, infraestrutura e articulação com a reitoria'
        : 'direção administrativa do campus; condução geral, infraestrutura, segurança patrimonial e articulação com a reitoria',
      campusId,
      isActive: true,
    },
    {
      id: `unit-secretaria-academica-${slug}`,
      name: `Secretaria Acadêmica do ${name}`,
      description: 'matrícula, histórico escolar, atestados, diplomas e documentos acadêmicos dos alunos do campus',
      campusId,
      isActive: true,
    },
    {
      id: `unit-coordenacoes-curso-${slug}`,
      name: `Coordenações de Curso do ${name}`,
      description:
        'coordenações dos cursos de graduação do campus; questões pedagógicas, professores, disciplinas, estágios e TCC',
      campusId,
      isActive: true,
    },
  ]

  if (campusId !== headquartersCampusId) {
    baseUnits.push({
      id: `unit-biblioteca-${slug}`,
      name: `Biblioteca Setorial do ${name}`,
      description: 'acervo, empréstimo de livros e espaço de estudo do campus',
      campusId,
      isActive: true,
    })
  }

  return baseUnits
})

const catalogSeedData = {
  campuses,
  administrativeUnits: [...centralAdministrativeUnits, ...poetaTorquatoCenters, ...campusAdministrativeUnits],
} as const

type SeedStatus = 'in_analysis' | 'awaiting_unit' | 'answered' | 'canceled' | 'finalized'
type SeedSenderType = 'manifestant' | 'anonymous_manifestant' | 'ombudsman' | 'admin' | 'system'
type SeedHistoryType =
  | 'status_changed'
  | 'forwarded_to_unit'
  | 'finalized_by_author'
  | 'evaluation_recorded'
  | 'canceled'

interface SeedSystemPayload {
  type: SeedHistoryType
  description: string
  actorUserId: string | null
  actorType: SeedSenderType
  fromStatus: SeedStatus | null
  toStatus: SeedStatus | null
  rating?: number
  attendantUserId?: string
  cancellationReason?: string
  cancellationNote?: string
}

interface ManifestationScenario {
  protocol: string
  type: 'complaint' | 'suggestion' | 'report' | 'compliment'
  campusId: string
  administrativeUnitId: string
  description: string
  involvedPeople: string | null
  anonymous: boolean
  createdAt: Date
  authorMessage: string
  reply?: string
  forwardTo?: { id: string; name: string }
  finalize?: boolean
  evaluation?: { rating: number; comment: string | null }
  cancel?: { reason: string; note: string | null }
}

interface SeedMessage {
  id: string
  senderUserId: string | null
  senderType: SeedSenderType
  content: string
  createdAt: Date
}

interface SeedEvaluation {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
}

interface BuiltManifestation {
  id: string
  status: SeedStatus
  authorUserId: string | null
  attendantUserId: string | null
  forwardedToUnitId: string | null
  accessCodeHash: string | null
  messages: SeedMessage[]
  evaluation: SeedEvaluation | null
}

interface SeedActors {
  manifestantId: string
  guaraId: string
  anonymousAccessCodeHash: string
}

const cancellationReasonLabels: Record<string, string> = {
  duplicate: 'Manifestação duplicada',
  out_of_scope: 'Fora da competência da ouvidoria',
  insufficient_information: 'Informações insuficientes para análise',
  offensive_content: 'Conteúdo ofensivo ou impróprio',
  spam_or_test: 'Registro de teste ou spam',
  requested_by_author: 'Cancelamento solicitado pelo autor',
  other: 'Outro',
}

const MESSAGE_INTERVAL_MS = 45 * 60 * 1000

function deterministicUuid(seed: string): string {
  const hex = createHash('sha1').update(seed).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function encodeSystemPayload(payload: SeedSystemPayload): string {
  const serializable: Record<string, unknown> = {
    type: payload.type,
    description: payload.description,
    actorUserId: payload.actorUserId,
    actorType: payload.actorType,
    fromStatus: payload.fromStatus,
    toStatus: payload.toStatus,
  }
  if (payload.rating !== undefined) {
    serializable['rating'] = payload.rating
  }
  if (payload.attendantUserId !== undefined) {
    serializable['attendantUserId'] = payload.attendantUserId
  }
  if (payload.cancellationReason !== undefined) {
    serializable['cancellationReason'] = payload.cancellationReason
  }
  if (payload.cancellationNote !== undefined) {
    serializable['cancellationNote'] = payload.cancellationNote
  }
  return JSON.stringify(serializable)
}

function buildManifestationRecord(scenario: ManifestationScenario, actors: SeedActors): BuiltManifestation {
  const authorUserId = scenario.anonymous ? null : actors.manifestantId
  const authorSenderType: SeedSenderType = scenario.anonymous ? 'anonymous_manifestant' : 'manifestant'
  const messages: SeedMessage[] = []
  let messageIndex = 0

  const pushMessage = (senderUserId: string | null, senderType: SeedSenderType, content: string): void => {
    messages.push({
      id: deterministicUuid(`message:${scenario.protocol}:${String(messageIndex)}`),
      senderUserId,
      senderType,
      content,
      createdAt: new Date(scenario.createdAt.getTime() + messageIndex * MESSAGE_INTERVAL_MS),
    })
    messageIndex += 1
  }

  pushMessage(authorUserId, authorSenderType, scenario.authorMessage)

  let status: SeedStatus = 'in_analysis'

  if (scenario.forwardTo !== undefined) {
    pushMessage(
      null,
      'system',
      encodeSystemPayload({
        type: 'forwarded_to_unit',
        description: `Manifestação encaminhada ao setor responsável: ${scenario.forwardTo.name}.`,
        actorUserId: actors.guaraId,
        actorType: 'ombudsman',
        fromStatus: status,
        toStatus: 'awaiting_unit',
      }),
    )
    status = 'awaiting_unit'
  }

  if (scenario.reply !== undefined) {
    pushMessage(actors.guaraId, 'ombudsman', scenario.reply)
    pushMessage(
      null,
      'system',
      encodeSystemPayload({
        type: 'status_changed',
        description: `Status alterado de ${status} para answered via resposta administrativa.`,
        actorUserId: actors.guaraId,
        actorType: 'ombudsman',
        fromStatus: status,
        toStatus: 'answered',
      }),
    )
    status = 'answered'
  }

  let evaluation: SeedEvaluation | null = null

  if (scenario.finalize === true) {
    pushMessage(
      null,
      'system',
      encodeSystemPayload({
        type: 'finalized_by_author',
        description: 'Manifestação finalizada pelo autor.',
        actorUserId: authorUserId,
        actorType: 'manifestant',
        fromStatus: 'answered',
        toStatus: 'finalized',
      }),
    )
    status = 'finalized'

    if (scenario.evaluation !== undefined) {
      const evaluationCreatedAt = new Date(scenario.createdAt.getTime() + messageIndex * MESSAGE_INTERVAL_MS)
      pushMessage(
        null,
        'system',
        encodeSystemPayload({
          type: 'evaluation_recorded',
          description: `Atendimento avaliado pelo autor (${String(scenario.evaluation.rating)}/5).`,
          actorUserId: authorUserId,
          actorType: 'manifestant',
          fromStatus: null,
          toStatus: null,
          rating: scenario.evaluation.rating,
          attendantUserId: actors.guaraId,
        }),
      )
      evaluation = {
        id: deterministicUuid(`evaluation:${scenario.protocol}`),
        rating: scenario.evaluation.rating,
        comment: scenario.evaluation.comment,
        createdAt: evaluationCreatedAt,
      }
    }
  }

  if (scenario.cancel !== undefined) {
    const label = cancellationReasonLabels[scenario.cancel.reason] ?? 'Outro'
    const description =
      scenario.cancel.note === null
        ? `Manifestação cancelada pela ouvidoria. Motivo: ${label}.`
        : `Manifestação cancelada pela ouvidoria. Motivo: ${label}. Observação: ${scenario.cancel.note}`
    pushMessage(
      null,
      'system',
      encodeSystemPayload({
        type: 'canceled',
        description,
        actorUserId: actors.guaraId,
        actorType: 'ombudsman',
        fromStatus: status,
        toStatus: 'canceled',
        cancellationReason: scenario.cancel.reason,
        ...(scenario.cancel.note === null ? {} : { cancellationNote: scenario.cancel.note }),
      }),
    )
    status = 'canceled'
  }

  const attendantUserId = scenario.reply !== undefined || scenario.forwardTo !== undefined ? actors.guaraId : null

  return {
    id: deterministicUuid(`manifestation:${scenario.protocol}`),
    status,
    authorUserId,
    attendantUserId,
    forwardedToUnitId: scenario.forwardTo === undefined ? null : scenario.forwardTo.id,
    accessCodeHash: scenario.anonymous ? actors.anonymousAccessCodeHash : null,
    messages,
    evaluation,
  }
}

const manifestationScenarios: ManifestationScenario[] = [
  {
    protocol: '202605270001',
    type: 'complaint',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-dtic',
    description:
      'Não consigo acessar o sistema acadêmico há dois dias, mesmo após redefinir a senha pelo portal institucional.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-24T12:00:00.000Z'),
    authorMessage:
      'O erro aparece após informar matrícula e senha. A página recarrega e retorna para a tela inicial sem mensagem clara.',
  },
  {
    protocol: '202605270002',
    type: 'suggestion',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ouvidoria',
    description:
      'Sugiro ampliar o horário de funcionamento da Biblioteca Central durante o período de avaliações finais.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-25T12:00:00.000Z'),
    authorMessage:
      'A ampliação ajudaria estudantes que trabalham durante o dia e só conseguem estudar no campus à noite.',
    forwardTo: { id: 'unit-biblioteca-central', name: 'Biblioteca Central' },
  },
  {
    protocol: '202605270003',
    type: 'report',
    campusId: 'campus-clovis-moura',
    administrativeUnitId: 'unit-direcao-clovis-moura',
    description:
      'Há lâmpadas queimadas no corredor próximo às salas do bloco administrativo, prejudicando a circulação no turno da noite.',
    involvedPeople: 'Equipe de manutenção predial do campus',
    anonymous: false,
    createdAt: new Date('2026-05-26T12:00:00.000Z'),
    authorMessage: 'O problema foi observado principalmente entre 18h e 21h, quando há maior circulação de alunos.',
  },
  {
    protocol: '202605270004',
    type: 'compliment',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-secretaria-academica-poeta-torquato-neto',
    description:
      'Gostaria de registrar elogio ao atendimento da Secretaria Acadêmica pela agilidade na emissão de documentos.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-23T12:00:00.000Z'),
    authorMessage: 'O atendimento foi concluído no mesmo dia e a equipe explicou todos os passos com clareza.',
    reply: 'Agradecemos o retorno! Encaminhamos o seu elogio à equipe da Secretaria Acadêmica.',
  },
  {
    protocol: '202605270005',
    type: 'complaint',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-dtic',
    description: 'O e-mail institucional parou de sincronizar no aplicativo de celular após a última manutenção.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-10T13:00:00.000Z'),
    authorMessage: 'No computador funciona normalmente, mas no celular aparece erro de autenticação.',
    reply: 'Ajustamos a configuração do servidor de e-mail. Pedimos que remova e adicione a conta novamente no app.',
    finalize: true,
    evaluation: { rating: 5, comment: 'Problema resolvido rapidamente e com orientação clara.' },
  },
  {
    protocol: '202605270006',
    type: 'report',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-prefeitura-universitaria',
    description: 'Há um vazamento de água no banheiro do segundo andar do bloco de salas de aula.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-18T14:30:00.000Z'),
    authorMessage: 'A água escorre para o corredor e deixa o piso escorregadio durante todo o dia.',
    reply: 'A equipe de manutenção foi acionada e a reparação está prevista para esta semana.',
  },
  {
    protocol: '202605270007',
    type: 'suggestion',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-preg',
    description: 'Sugiro disponibilizar as ementas das disciplinas em formato digital no portal do aluno.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-22T09:15:00.000Z'),
    authorMessage: 'Hoje só conseguimos as ementas presencialmente na coordenação, o que dificulta o planejamento.',
  },
  {
    protocol: '202605270008',
    type: 'complaint',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ascom',
    description: 'Reclamação sobre uma postagem em rede social que não é do perfil oficial da universidade.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-12T16:00:00.000Z'),
    authorMessage: 'O perfil citado não tem vínculo com a instituição.',
    cancel: { reason: 'out_of_scope', note: null },
  },
  {
    protocol: '202605270009',
    type: 'report',
    campusId: 'campus-clovis-moura',
    administrativeUnitId: 'unit-biblioteca-clovis-moura',
    description: 'O ar-condicionado da sala de estudos da biblioteca setorial está desligado há semanas.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-05T10:00:00.000Z'),
    authorMessage: 'Com o calor, fica inviável usar a sala de estudos no período da tarde.',
    reply: 'O equipamento foi consertado e já está em funcionamento. Obrigado por reportar.',
    finalize: true,
    evaluation: { rating: 4, comment: 'Demorou um pouco, mas foi resolvido.' },
  },
  {
    protocol: '202605270010',
    type: 'complaint',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ouvidoria',
    description: 'A rede Wi-Fi do campus fica instável nos horários de pico, atrapalhando atividades em laboratório.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-19T11:00:00.000Z'),
    authorMessage: 'A conexão cai com frequência entre 10h e 12h, quando há mais usuários conectados.',
    forwardTo: { id: 'unit-dtic', name: 'Departamento de Tecnologia da Informação e Comunicação' },
  },
  {
    protocol: '202605270011',
    type: 'compliment',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ccs',
    description: 'Elogio ao atendimento humanizado da clínica-escola do Centro de Ciências da Saúde.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-04-28T15:00:00.000Z'),
    authorMessage: 'A equipe foi muito atenciosa durante todo o acompanhamento.',
    reply: 'Ficamos felizes com o retorno! Repassaremos o reconhecimento à coordenação da clínica-escola.',
    finalize: true,
  },
  {
    protocol: '202605270012',
    type: 'report',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ascom',
    description: 'Registro de teste enviado durante a homologação do formulário.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-02T08:00:00.000Z'),
    authorMessage: 'teste',
    cancel: { reason: 'spam_or_test', note: 'Registro sem conteúdo identificável, criado durante testes.' },
  },
  {
    protocol: '202605270013',
    type: 'suggestion',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-biblioteca-central',
    description: 'Sugiro instalar mais tomadas nas mesas de estudo individuais da Biblioteca Central.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-15T17:30:00.000Z'),
    authorMessage: 'A maioria das mesas não tem ponto de energia, o que dificulta usar o notebook por muito tempo.',
    reply: 'A sugestão foi registrada e será avaliada no próximo plano de melhorias da biblioteca.',
  },
  {
    protocol: '202605270014',
    type: 'complaint',
    campusId: 'campus-urucui',
    administrativeUnitId: 'unit-direcao-urucui',
    description: 'O transporte universitário tem chegado atrasado no turno da manhã com frequência.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-21T07:45:00.000Z'),
    authorMessage: 'Nas últimas duas semanas o ônibus chegou em média 20 minutos depois do horário previsto.',
  },
  {
    protocol: '202605270015',
    type: 'report',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ctu',
    description: 'Um dos computadores do laboratório de informática não liga desde a semana passada.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-08T13:20:00.000Z'),
    authorMessage: 'A máquina próxima à porta do laboratório não responde ao botão de ligar.',
    forwardTo: { id: 'unit-dtic', name: 'Departamento de Tecnologia da Informação e Comunicação' },
    reply: 'O equipamento foi recolhido para manutenção e será substituído enquanto isso.',
  },
  {
    protocol: '202605270016',
    type: 'complaint',
    campusId: 'campus-professor-barros-araujo',
    administrativeUnitId: 'unit-secretaria-academica-professor-barros-araujo',
    description: 'Solicitei a emissão do diploma há mais de 60 dias e ainda não obtive retorno.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-04-20T10:30:00.000Z'),
    authorMessage: 'Preciso do diploma para um processo seletivo e o prazo está se esgotando.',
    reply: 'Seu diploma foi localizado e já está disponível para retirada na Secretaria Acadêmica.',
    finalize: true,
    evaluation: { rating: 5, comment: null },
  },
  {
    protocol: '202605270017',
    type: 'suggestion',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-cchl',
    description: 'Sugiro a criação de um curso de extensão em redação acadêmica para os calouros.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-16T19:00:00.000Z'),
    authorMessage: 'Muitos calouros têm dificuldade com a escrita acadêmica logo no primeiro período.',
  },
  {
    protocol: '202605270018',
    type: 'report',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ouvidoria',
    description: 'Mesma ocorrência de iluminação já registrada anteriormente por outro protocolo.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-13T20:10:00.000Z'),
    authorMessage: 'Acredito que já exista um registro sobre esse mesmo problema.',
    cancel: { reason: 'duplicate', note: null },
  },
  {
    protocol: '202605270019',
    type: 'complaint',
    campusId: 'campus-professor-alexandre-alves-de-oliveira',
    administrativeUnitId: 'unit-direcao-professor-alexandre-alves-de-oliveira',
    description: 'A iluminação do estacionamento do campus é insuficiente no período noturno.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-09T18:40:00.000Z'),
    authorMessage: 'À noite o estacionamento fica muito escuro, gerando insegurança para quem sai das aulas.',
    reply: 'A direção do campus solicitou a instalação de novas luminárias na área do estacionamento.',
  },
  {
    protocol: '202605270020',
    type: 'compliment',
    campusId: 'campus-doutora-josefina-demes',
    administrativeUnitId: 'unit-secretaria-academica-doutora-josefina-demes',
    description: 'Elogio à organização do processo de rematrícula realizado neste semestre.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-20T14:00:00.000Z'),
    authorMessage: 'O processo foi rápido, bem sinalizado e sem filas.',
  },
  {
    protocol: '202605270021',
    type: 'report',
    campusId: 'campus-possidonio-queiroz',
    administrativeUnitId: 'unit-direcao-possidonio-queiroz',
    description: 'A sala de aula 03 precisa de reparo no forro do teto, que apresenta infiltração.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-11T09:50:00.000Z'),
    authorMessage: 'Em dias de chuva a infiltração piora e cai água próximo às carteiras.',
    forwardTo: { id: 'unit-prad', name: 'Pró-Reitoria de Administração' },
  },
  {
    protocol: '202605270022',
    type: 'complaint',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-prad',
    description: 'O reembolso de uma taxa paga em duplicidade ainda não foi processado.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-04-25T11:30:00.000Z'),
    authorMessage: 'Paguei a taxa duas vezes por erro do sistema e solicitei o reembolso há um mês.',
    reply: 'O reembolso foi autorizado e será creditado na conta informada em até cinco dias úteis.',
    finalize: true,
  },
  {
    protocol: '202605270023',
    type: 'suggestion',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-prex',
    description: 'Sugiro ampliar o número de bolsas de extensão oferecidas por edital.',
    involvedPeople: null,
    anonymous: false,
    createdAt: new Date('2026-05-03T15:45:00.000Z'),
    authorMessage: 'A procura por bolsas de extensão é muito maior do que a oferta atual.',
    cancel: { reason: 'other', note: 'Sugestão já contemplada em projeto institucional em andamento.' },
  },
  {
    protocol: '202605270024',
    type: 'report',
    campusId: 'nucleo-barras',
    administrativeUnitId: 'unit-coordenacao-barras',
    description: 'A catraca de acesso ao prédio principal está travando com o cartão de estudante.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-07T08:20:00.000Z'),
    authorMessage: 'O cartão precisa ser passado várias vezes até a catraca liberar o acesso.',
    reply: 'A leitora da catraca foi recalibrada e o acesso já está funcionando normalmente.',
  },
  {
    protocol: '202605270025',
    type: 'complaint',
    campusId: headquartersCampusId,
    administrativeUnitId: 'unit-ouvidoria',
    description: 'Gostaria de entender melhor qual é o prazo médio de resposta de uma manifestação.',
    involvedPeople: null,
    anonymous: true,
    createdAt: new Date('2026-05-26T21:00:00.000Z'),
    authorMessage: 'Registrei uma manifestação e gostaria de saber em quanto tempo costuma haver retorno.',
  },
]

async function main(): Promise<void> {
  for (const campus of catalogSeedData.campuses) {
    await prisma.campus.upsert({
      where: { id: campus.id },
      create: campus,
      update: {
        name: campus.name,
        city: campus.city,
        isActive: campus.isActive,
      },
    })
  }

  for (const administrativeUnit of catalogSeedData.administrativeUnits) {
    await prisma.administrativeUnit.upsert({
      where: { id: administrativeUnit.id },
      create: administrativeUnit,
      update: {
        name: administrativeUnit.name,
        description: administrativeUnit.description,
        campusId: administrativeUnit.campusId,
        isActive: administrativeUnit.isActive,
      },
    })
  }

  const passwordHash = await bcrypt.hash(developmentPassword, passwordHashRounds)

  for (const user of usersSeedData) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        emailVerifiedAt: new Date(),
      },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        emailVerifiedAt: new Date(),
      },
    })
  }

  const guaraOmbudsman = await prisma.user.findUniqueOrThrow({
    where: { email: 'ouvidoriaa.guara@gmail.com' },
  })

  const demonstrationManifestant = await prisma.user.findUniqueOrThrow({
    where: { email: 'manifestante@uespi.br' },
  })

  for (const administrativeUnit of catalogSeedData.administrativeUnits) {
    await prisma.userAdministrativeUnit.upsert({
      where: {
        userId_administrativeUnitId: {
          userId: guaraOmbudsman.id,
          administrativeUnitId: administrativeUnit.id,
        },
      },
      create: {
        userId: guaraOmbudsman.id,
        administrativeUnitId: administrativeUnit.id,
      },
      update: {},
    })
  }

  const anonymousAccessCodeHash = await bcrypt.hash(anonymousAccessCode, passwordHashRounds)
  const now = new Date()
  const actors: SeedActors = {
    manifestantId: demonstrationManifestant.id,
    guaraId: guaraOmbudsman.id,
    anonymousAccessCodeHash,
  }

  const statusTotals: Record<SeedStatus, number> = {
    in_analysis: 0,
    awaiting_unit: 0,
    answered: 0,
    canceled: 0,
    finalized: 0,
  }

  for (const scenario of manifestationScenarios) {
    const built = buildManifestationRecord(scenario, actors)
    statusTotals[built.status] += 1

    const persisted = await prisma.manifestation.upsert({
      where: { protocol: scenario.protocol },
      create: {
        id: built.id,
        protocol: scenario.protocol,
        type: scenario.type,
        status: built.status,
        campusId: scenario.campusId,
        administrativeUnitId: scenario.administrativeUnitId,
        description: scenario.description,
        involvedPeople: scenario.involvedPeople,
        authorUserId: built.authorUserId,
        attendantUserId: built.attendantUserId,
        forwardedToUnitId: built.forwardedToUnitId,
        accessCodeHash: built.accessCodeHash,
        createdAt: scenario.createdAt,
      },
      update: {
        type: scenario.type,
        status: built.status,
        campusId: scenario.campusId,
        administrativeUnitId: scenario.administrativeUnitId,
        description: scenario.description,
        involvedPeople: scenario.involvedPeople,
        authorUserId: built.authorUserId,
        attendantUserId: built.attendantUserId,
        forwardedToUnitId: built.forwardedToUnitId,
        accessCodeHash: built.accessCodeHash,
        createdAt: scenario.createdAt,
        updatedAt: now,
      },
    })

    await prisma.manifestationEvaluation.deleteMany({ where: { manifestationId: persisted.id } })
    await prisma.manifestationMessage.deleteMany({ where: { manifestationId: persisted.id } })

    for (const message of built.messages) {
      await prisma.manifestationMessage.create({
        data: {
          id: message.id,
          manifestationId: persisted.id,
          senderUserId: message.senderUserId,
          senderType: message.senderType,
          content: message.content,
          createdAt: message.createdAt,
        },
      })
    }

    if (built.evaluation !== null && built.authorUserId !== null && built.attendantUserId !== null) {
      await prisma.manifestationEvaluation.create({
        data: {
          id: built.evaluation.id,
          manifestationId: persisted.id,
          attendantUserId: built.attendantUserId,
          attendantRoleSnapshot: 'ombudsman',
          authorUserId: built.authorUserId,
          rating: built.evaluation.rating,
          comment: built.evaluation.comment,
          createdAt: built.evaluation.createdAt,
        },
      })
    }
  }

  console.warn(`Seeded development users (password: ${developmentPassword}):`)
  for (const user of usersSeedData) {
    console.warn(`  - ${user.role.padEnd(10)} ${user.email}`)
  }
  console.warn(`  - responsible for ${catalogSeedData.administrativeUnits.length} administrative units`)
  console.warn(`Seeded ${manifestationScenarios.length} demonstration manifestations:`)
  for (const status of Object.keys(statusTotals) as SeedStatus[]) {
    console.warn(`  - ${status.padEnd(13)} ${statusTotals[status]}`)
  }
  console.warn(`  - anonymous access code: ${anonymousAccessCode}`)
}

main()
  .catch(async (error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
