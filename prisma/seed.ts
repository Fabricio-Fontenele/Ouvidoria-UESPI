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
    email: 'ouvidor@uespi.br',
    name: 'Ouvidor de Demonstração',
    role: 'ombudsman' as const,
  },
  {
    email: 'admin@uespi.br',
    name: 'Administrador de Demonstração',
    role: 'admin' as const,
  },
]

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
      },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
    })
  }

  console.warn(`Seeded development users (password: ${developmentPassword}):`)
  for (const user of usersSeedData) {
    console.warn(`  - ${user.role.padEnd(10)} ${user.email}`)
  }
}

main()
  .catch(async (error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
