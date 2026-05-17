import type { FastifyInstance } from 'fastify'

import { prisma } from '#src/infra/database/prisma/client.js'
import { buildApp } from '#src/main/server.js'

let cachedApp: FastifyInstance | null = null

export async function getApp(): Promise<FastifyInstance> {
  if (cachedApp === null) {
    cachedApp = await buildApp()
    await cachedApp.ready()
  }
  return cachedApp
}

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.manifestationEvaluation.deleteMany(),
    prisma.manifestationMessage.deleteMany(),
    prisma.manifestation.deleteMany(),
    prisma.user.deleteMany(),
  ])
}
