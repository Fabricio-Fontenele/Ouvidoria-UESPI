import type { FastifyInstance } from 'fastify'

import type { prisma as prismaClient } from '#src/infra/database/prisma/client.js'
import type { buildApp as buildAppFn } from '#src/main/server.js'

let cachedApp: FastifyInstance | null = null
let prismaModulePromise: Promise<{ prisma: typeof prismaClient }> | null = null
let serverModulePromise: Promise<{ buildApp: typeof buildAppFn }> | null = null

async function getPrisma() {
  prismaModulePromise ??= import('#src/infra/database/prisma/client.js')
  return (await prismaModulePromise).prisma
}

async function getServerModule() {
  serverModulePromise ??= import('#src/main/server.js')
  return serverModulePromise
}

export async function getApp(): Promise<FastifyInstance> {
  if (cachedApp === null) {
    const { buildApp } = await getServerModule()
    cachedApp = await buildApp()
    await cachedApp.ready()
  }
  return cachedApp
}

export async function resetDatabase(): Promise<void> {
  const prisma = await getPrisma()

  await prisma.$transaction([
    prisma.manifestationEvaluation.deleteMany(),
    prisma.manifestationMessage.deleteMany(),
    prisma.manifestation.deleteMany(),
    prisma.user.deleteMany(),
  ])
}
