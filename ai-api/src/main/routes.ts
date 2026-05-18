import type { FastifyInstance } from 'fastify'

import { makeSendAiMessageHandler } from '../presentation/controllers/send-ai-message-controller.js'
import { makeApiKeyAuth } from '../presentation/middlewares/api-key-auth.js'

import { env } from './env.js'
import type { AiApiInfrastructure } from './factories/infrastructure.js'

export async function registerRoutes(app: FastifyInstance, infra: AiApiInfrastructure): Promise<void> {
  app.get('/health', async () => ({ status: 'ok' }))

  app.get('/ready', async () => {
    const readiness = await checkReadiness(infra)
    return readiness
  })

  await app.register(async (instance) => {
    instance.addHook('preHandler', makeApiKeyAuth(env.AI_API_KEY))
    instance.post('/ai/messages', makeSendAiMessageHandler(infra.sendAiMessageUseCase))
  })
}

async function checkReadiness(infra: AiApiInfrastructure): Promise<{
  status: 'ok' | 'degraded'
  vectorStoreOk: boolean
  hasIndexedChunks: boolean
  geminiConfigured: boolean
}> {
  const geminiConfigured = env.GOOGLE_API_KEY.length > 0

  try {
    const probe = await infra.vectorStore.similaritySearchVectorWithScore(
      new Array<number>(env.GOOGLE_EMBEDDING_DIMS).fill(0),
      1,
    )
    return {
      status: geminiConfigured ? 'ok' : 'degraded',
      vectorStoreOk: true,
      hasIndexedChunks: probe.length > 0,
      geminiConfigured,
    }
  } catch {
    return {
      status: 'degraded',
      vectorStoreOk: false,
      hasIndexedChunks: false,
      geminiConfigured,
    }
  }
}
