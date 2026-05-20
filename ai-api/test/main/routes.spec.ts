import Fastify, { type FastifyInstance } from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { aiChatResponseSchema } from '../../src/application/dtos/ai-chat-response.js'

const originalEnv = { ...process.env }

const baseProcessEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  HOST: '0.0.0.0',
  GOOGLE_API_KEY: 'google-key',
  GOOGLE_EMBEDDING_MODEL: 'models/gemini-embedding-001',
  GOOGLE_EMBEDDING_DIMS: '3072',
  GOOGLE_CHAT_MODEL: 'models/gemini-2.5-flash',
  LLM_TEMPERATURE: '0.1',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/rag',
  PG_VECTOR_COLLECTION_NAME: 'ouvidoria_kb',
  KB_DIR: './docs/knowledge-base',
  RAG_CHUNK_SIZE: '400',
  RAG_CHUNK_OVERLAP: '0',
  RAG_TOP_K: '8',
  AI_API_KEY: 'secret',
  REQUEST_BODY_LIMIT_BYTES: '65536',
}

async function buildRouteTestApp() {
  vi.resetModules()
  process.env = {
    ...originalEnv,
    ...baseProcessEnv,
  }

  const { registerRoutes } = await import('../../src/main/routes.js')

  const app = Fastify()
  const execute = vi.fn().mockResolvedValue({
    answer: 'Resposta institucional.',
    intent: 'institutional_question',
    confidence: 0.7,
    shouldOpenManifestationDraft: false,
    draft: null,
    missingFields: [],
  })
  const similaritySearchVectorWithScore = vi.fn().mockResolvedValue([[{ pageContent: 'chunk' }, 0.01]])

  await registerRoutes(app, {
    sendAiMessageUseCase: {
      execute,
    },
    vectorStore: {
      similaritySearchVectorWithScore,
    },
    shutdown: vi.fn(),
  } as never)

  await app.ready()

  return { app, execute, similaritySearchVectorWithScore }
}

describe('registerRoutes', () => {
  const apps: FastifyInstance[] = []

  afterEach(async () => {
    while (apps.length > 0) {
      const app = apps.pop()
      if (app !== undefined) {
        await app.close()
      }
    }
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  it('returns ok on GET /health', async () => {
    const { app } = await buildRouteTestApp()
    apps.push(app)

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toStrictEqual({ status: 'ok' })
  })

  it('returns readiness information from fake dependencies', async () => {
    const { app, similaritySearchVectorWithScore } = await buildRouteTestApp()
    apps.push(app)

    const response = await app.inject({
      method: 'GET',
      url: '/ready',
    })

    expect(response.statusCode).toBe(200)
    expect(similaritySearchVectorWithScore).toHaveBeenCalledTimes(1)
    expect(response.json()).toStrictEqual({
      status: 'ok',
      vectorStoreOk: true,
      hasIndexedChunks: true,
      geminiConfigured: true,
    })
  })

  it('returns the expected response schema on POST /ai/messages', async () => {
    const { app, execute } = await buildRouteTestApp()
    apps.push(app)

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      headers: {
        'x-api-key': 'secret',
      },
      payload: {
        history: [],
        message: 'Como acompanho meu protocolo?',
        campuses: [],
        administrativeUnits: [],
      },
    })

    expect(response.statusCode).toBe(200)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(aiChatResponseSchema.safeParse(response.json()).success).toBe(true)
  })

  it('returns 400 for an invalid request body', async () => {
    const { app, execute } = await buildRouteTestApp()
    apps.push(app)

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      headers: {
        'x-api-key': 'secret',
      },
      payload: {
        history: [],
        message: '   ',
        campuses: [],
        administrativeUnits: [],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: 'invalid_request_body' })
    expect(execute).not.toHaveBeenCalled()
  })

  it('returns 401 when x-api-key is missing', async () => {
    const { app, execute } = await buildRouteTestApp()
    apps.push(app)

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      payload: {
        history: [],
        message: 'Como acompanho meu protocolo?',
        campuses: [],
        administrativeUnits: [],
      },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toStrictEqual({ error: 'missing_api_key' })
    expect(execute).not.toHaveBeenCalled()
  })
})
