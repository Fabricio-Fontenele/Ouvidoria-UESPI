import type { FastifyInstance } from 'fastify'

import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'

import { env } from '../config/env.js'
import { makeSendAiMessageController } from '../factories/controllers/ai.js'

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/ai/messages',
    {
      config:
        env.NODE_ENV === 'test'
          ? {}
          : {
              rateLimit: { max: 10, timeWindow: '1 minute' },
            },
    },
    adaptRoute(makeSendAiMessageController()),
  )
}
