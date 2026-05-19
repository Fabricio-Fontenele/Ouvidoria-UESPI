import type { FastifyInstance } from 'fastify'

import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'

import { makeSendAiMessageController } from '../factories/controllers/ai.js'

export async function registerAiRoutes(app: FastifyInstance): Promise<void> {
  app.post('/ai/messages', adaptRoute(makeSendAiMessageController()))
}
