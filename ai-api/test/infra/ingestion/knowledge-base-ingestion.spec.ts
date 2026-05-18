import { Document } from '@langchain/core/documents'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  runKnowledgeBaseIngestion,
  validateEmbeddingProbe,
} from '../../../src/infra/ingestion/knowledge-base-ingestion.js'

describe('knowledge-base-ingestion', () => {
  const ingestionEnv = {
    KB_DIR: './docs/knowledge-base',
    RAG_CHUNK_SIZE: 400,
    RAG_CHUNK_OVERLAP: 0,
    GOOGLE_EMBEDDING_DIMS: 3,
    GOOGLE_EMBEDDING_MODEL: 'models/gemini-embedding-001',
    PG_VECTOR_COLLECTION_NAME: 'ouvidoria_kb',
  }

  afterEach(() => {
    process.exitCode = undefined
  })

  it('throws a clear error when the embedding probe is empty', () => {
    expect(() => {
      validateEmbeddingProbe([], ingestionEnv)
    }).toThrow('Embedding model returned an empty vector')
  })

  it('throws a clear error when the embedding dimension mismatches the env', () => {
    expect(() => {
      validateEmbeddingProbe([0, 1], ingestionEnv)
    }).toThrow('Embedding dimension mismatch')
  })

  it('accepts the embedding probe when the dimension matches the env', () => {
    expect(() => {
      validateEmbeddingProbe([0, 1, 2], ingestionEnv)
    }).not.toThrow()
  })

  it('does not duplicate chunks when rerunning with reset', async () => {
    const storedDocuments: Document[] = []
    const sourceDocument = new Document({ pageContent: 'Artigo 1' })

    const dropCollectionTable = vi.fn(async () => {
      storedDocuments.length = 0
    })
    const logger = {
      log: vi.fn(),
      warn: vi.fn(),
    }

    const createVectorStore = vi.fn(async () => ({
      addDocuments: vi.fn(async (documents: Document[]) => {
        storedDocuments.push(...documents)
      }),
      end: vi.fn(async () => {}),
    }))

    const deps = {
      dropCollectionTable,
      knowledgeBaseDirectoryExists: vi.fn(async () => true),
      loadKnowledgeBaseDocuments: vi.fn(async () => [{ document: sourceDocument, source: 'regimento.md' }]),
      createTextSplitter: vi.fn(() => ({
        splitDocuments: vi.fn(async (documents: Document[]) => documents),
      })),
      createEmbeddings: vi.fn(() => ({
        embedDocuments: vi.fn(async () => []),
        embedQuery: vi.fn(async () => [0, 1, 2]),
      })),
      createVectorStore,
      logger,
    }

    await runKnowledgeBaseIngestion(ingestionEnv, deps, { shouldReset: false })
    expect(storedDocuments).toHaveLength(1)

    await runKnowledgeBaseIngestion(ingestionEnv, deps, { shouldReset: true })
    expect(dropCollectionTable).toHaveBeenCalledTimes(1)
    expect(storedDocuments).toHaveLength(1)
    expect(logger.log).toHaveBeenCalledWith('[ingest] persisted 1 chunks to "ouvidoria_kb"')
  })
})
