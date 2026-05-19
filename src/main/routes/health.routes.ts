import type { FastifyInstance } from 'fastify'

import { prisma } from '#src/infra/database/prisma/client.js'

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }))

  app.get('/ready', async (_request, reply) => {
    const databaseOk = await prisma.$queryRaw`SELECT 1`.then(
      () => true,
      () => false,
    )
    const status = databaseOk ? 'ok' : 'degraded'
    return reply.status(databaseOk ? 200 : 503).send({ status, databaseOk })
  })
}
