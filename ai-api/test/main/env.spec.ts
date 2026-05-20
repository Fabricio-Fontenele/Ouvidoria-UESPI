import { afterEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

function makeRequiredProcessEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    GOOGLE_API_KEY: 'google-key',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/rag',
    AI_API_KEY: 'secret',
    ...overrides,
  }
}

describe('parseEnv', () => {
  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  it('applies defaults', async () => {
    process.env = makeRequiredProcessEnv()

    const { parseEnv } = await import('../../src/main/env.js')
    const parsed = parseEnv(makeRequiredProcessEnv())

    expect(parsed).toMatchObject({
      NODE_ENV: 'test',
      PORT: 4000,
      HOST: '0.0.0.0',
      GOOGLE_EMBEDDING_MODEL: 'models/gemini-embedding-001',
      GOOGLE_EMBEDDING_DIMS: 3072,
      GOOGLE_CHAT_MODEL: 'models/gemini-3.5-flash',
      KB_DIR: './docs/knowledge-base',
      RAG_CHUNK_SIZE: 400,
      RAG_CHUNK_OVERLAP: 0,
      RAG_TOP_K: 4,
      REQUEST_BODY_LIMIT_BYTES: 65536,
    })
  })

  it('blocks change-me in production', async () => {
    process.env = makeRequiredProcessEnv({ NODE_ENV: 'production', AI_API_KEY: 'change-me' })
    await expect(import('../../src/main/env.js')).rejects.toThrow(
      'AI_API_KEY must be changed from "change-me" in production',
    )
  })

  it('allows change-me in development and test', async () => {
    process.env = makeRequiredProcessEnv({ NODE_ENV: 'development', AI_API_KEY: 'change-me' })

    const { parseEnv } = await import('../../src/main/env.js')

    expect(parseEnv(makeRequiredProcessEnv({ NODE_ENV: 'development', AI_API_KEY: 'change-me' })).AI_API_KEY).toBe(
      'change-me',
    )
    expect(parseEnv(makeRequiredProcessEnv({ NODE_ENV: 'test', AI_API_KEY: 'change-me' })).AI_API_KEY).toBe('change-me')
  })

  it('parses numeric rag settings from strings', async () => {
    process.env = makeRequiredProcessEnv({
      RAG_CHUNK_SIZE: '800',
      RAG_CHUNK_OVERLAP: '50',
      RAG_TOP_K: '8',
    })

    const { parseEnv } = await import('../../src/main/env.js')
    const parsed = parseEnv(
      makeRequiredProcessEnv({
        RAG_CHUNK_SIZE: '800',
        RAG_CHUNK_OVERLAP: '50',
        RAG_TOP_K: '8',
      }),
    )

    expect(parsed.RAG_CHUNK_SIZE).toBe(800)
    expect(parsed.RAG_CHUNK_OVERLAP).toBe(50)
    expect(parsed.RAG_TOP_K).toBe(8)
  })
})
