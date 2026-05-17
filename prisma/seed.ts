import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env['DATABASE_URL']

if (connectionString === undefined || connectionString === '') {
  throw new Error('DATABASE_URL must be set before the seed runs')
}

const databaseUrl = new URL(connectionString)
const schema = databaseUrl.searchParams.get('schema') ?? 'public'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl.toString() }, { schema }),
})

const catalogSeedData = {
  campuses: [
    {
      id: 'campus-poeta-torquato-neto',
      name: 'Campus Poeta Torquato Neto',
      city: 'Teresina',
      isActive: true,
    },
    {
      id: 'campus-professor-alexandre-alves-de-oliveira',
      name: 'Campus Professor Alexandre Alves de Oliveira',
      city: 'Parnaíba',
      isActive: true,
    },
    {
      id: 'campus-professor-antonio-giovanni-alves-de-sousa',
      name: 'Campus Professor Antônio Giovanni Alves de Sousa',
      city: 'Piripiri',
      isActive: true,
    },
    {
      id: 'campus-doutora-josefina-demes',
      name: 'Campus Doutora Josefina Demes',
      city: 'Floriano',
      isActive: false,
    },
    {
      id: 'campus-professor-barros-araujo',
      name: 'Campus Professor Barros Araújo',
      city: 'Picos',
      isActive: true,
    },
  ],

  administrativeUnits: [
    {
      id: 'unit-preg-teresina',
      name: 'Pró-Reitoria de Ensino de Graduação',
      campusId: 'campus-poeta-torquato-neto',
      isActive: true,
    },
    {
      id: 'unit-prad-teresina',
      name: 'Pró-Reitoria de Administração',
      campusId: 'campus-poeta-torquato-neto',
      isActive: true,
    },
    {
      id: 'unit-direcao-parnaiba',
      name: 'Direção do Campus Professor Alexandre Alves de Oliveira',
      campusId: 'campus-professor-alexandre-alves-de-oliveira',
      isActive: true,
    },
    {
      id: 'unit-coordenacao-computacao-parnaiba',
      name: 'Coordenação do Curso de Ciência da Computação',
      campusId: 'campus-professor-alexandre-alves-de-oliveira',
      isActive: true,
    },
    {
      id: 'unit-biblioteca-parnaiba',
      name: 'Biblioteca Setorial do Campus Professor Alexandre Alves de Oliveira',
      campusId: 'campus-professor-alexandre-alves-de-oliveira',
      isActive: true,
    },
    {
      id: 'unit-direcao-piripiri',
      name: 'Direção do Campus Professor Antônio Giovanni Alves de Sousa',
      campusId: 'campus-professor-antonio-giovanni-alves-de-sousa',
      isActive: true,
    },
    {
      id: 'unit-coordenacao-computacao-piripiri',
      name: 'Coordenação do Curso de Ciência da Computação',
      campusId: 'campus-professor-antonio-giovanni-alves-de-sousa',
      isActive: true,
    },
    {
      id: 'unit-secretaria-academica-piripiri',
      name: 'Secretaria Acadêmica do Campus Professor Antônio Giovanni Alves de Sousa',
      campusId: 'campus-professor-antonio-giovanni-alves-de-sousa',
      isActive: true,
    },
    {
      id: 'unit-nti-parnaiba-inativo',
      name: 'Núcleo de Tecnologia da Informação do Campus de Parnaíba',
      campusId: 'campus-professor-alexandre-alves-de-oliveira',
      isActive: false,
    },
    {
      id: 'unit-protocolo-floriano',
      name: 'Setor de Protocolo do Campus Doutora Josefina Demes',
      campusId: 'campus-doutora-josefina-demes',
      isActive: true,
    },
    {
      id: 'unit-ouvidoria-picos-inativa',
      name: 'Ouvidoria Local do Campus Professor Barros Araújo',
      campusId: 'campus-professor-barros-araujo',
      isActive: false,
    },
  ],
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
        campusId: administrativeUnit.campusId,
        isActive: administrativeUnit.isActive,
      },
    })
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
