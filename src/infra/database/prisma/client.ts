import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { getPrismaPgConnectionConfig } from './database-url.js'

const connectionString = process.env['DATABASE_URL']

if (connectionString === undefined || connectionString === '') {
  throw new Error('DATABASE_URL must be set before the Prisma client is created')
}

const prismaPgConfig = getPrismaPgConnectionConfig(connectionString)

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: prismaPgConfig.connectionString }, { schema: prismaPgConfig.schema }),
})

export type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
