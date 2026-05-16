import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env['DATABASE_URL']

if (connectionString === undefined || connectionString === '') {
  throw new Error('DATABASE_URL must be set before the Prisma client is created')
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

export type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
