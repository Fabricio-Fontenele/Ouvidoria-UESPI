import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import Fastify, { type FastifyInstance } from 'fastify'

import { prisma } from '#src/infra/database/prisma/client.js'

import './app-types.js'
import { env } from './config/env.js'
import { registerAdminRoutes } from './routes/admin.routes.js'
import { registerAuthRoutes } from './routes/auth.routes.js'
import { registerCatalogRoutes } from './routes/catalog.routes.js'
import { registerManifestationRoutes } from './routes/manifestation.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: env.NODE_ENV !== 'test' })

  await app.register(fastifyCors, { origin: true })
  await app.register(fastifyJwt, { secret: env.JWT_SECRET })

  await app.register(registerCatalogRoutes)
  await app.register(registerAuthRoutes)
  await app.register(registerManifestationRoutes)
  await app.register(registerAdminRoutes)

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  return app
}

export async function startServer(): Promise<void> {
  const app = await buildApp()
  await app.listen({ host: env.HOST, port: env.PORT })
}

const isEntry = process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href

if (isEntry) {
  startServer().catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
}
