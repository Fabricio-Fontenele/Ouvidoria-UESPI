import helmet from '@fastify/helmet'
import Fastify, { type FastifyInstance } from 'fastify'

import { env } from './env.js'
import { buildInfrastructure, type AiApiInfrastructure } from './factories/infrastructure.js'
import { registerRoutes } from './routes.js'

export async function buildApp(infra: AiApiInfrastructure): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
    bodyLimit: env.REQUEST_BODY_LIMIT_BYTES,
  })

  await app.register(helmet, { contentSecurityPolicy: false })

  await registerRoutes(app, infra)

  app.addHook('onClose', async () => {
    await infra.shutdown()
  })

  return app
}

export async function startServer(): Promise<void> {
  const infra = await buildInfrastructure()
  const app = await buildApp(infra)

  try {
    await app.listen({ host: env.HOST, port: env.PORT })
  } catch (error) {
    app.log.error({ err: error }, 'failed to start ai-api server')
    await infra.shutdown()
    process.exit(1)
  }
}

const isDirectEntry = import.meta.url === `file://${process.argv[1]}`
if (isDirectEntry) {
  startServer().catch((error: unknown) => {
    console.error('[ai-api] fatal during startup:', error)
    process.exit(1)
  })
}
