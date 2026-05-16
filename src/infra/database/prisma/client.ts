import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export type PrismaTransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
