import pg from 'pg'

import { env } from '../../main/env.js'
import { createGeminiEmbeddings } from '../llm/gemini-structured-client.js'
import { createPgVectorStore } from '../vector-store/pgvector-store.js'

import { knowledgeBaseDirectoryExists, loadKnowledgeBaseDocuments } from './document-loader.js'
import { runKnowledgeBaseIngestion } from './knowledge-base-ingestion.js'
import { createTextSplitter } from './text-splitter.js'

export async function dropCollectionTable(): Promise<void> {
  const client = new pg.Client({ connectionString: env.DATABASE_URL })
  await client.connect()
  try {
    await client.query(`DROP TABLE IF EXISTS "${env.PG_VECTOR_COLLECTION_NAME}" CASCADE`)
    console.log(`[ingest] reset: dropped table "${env.PG_VECTOR_COLLECTION_NAME}"`)
  } finally {
    await client.end()
  }
}

async function main(): Promise<void> {
  const shouldReset = process.argv.includes('--reset')

  await runKnowledgeBaseIngestion(
    env,
    {
      dropCollectionTable,
      knowledgeBaseDirectoryExists,
      loadKnowledgeBaseDocuments,
      createTextSplitter,
      createEmbeddings: () =>
        createGeminiEmbeddings({
          apiKey: env.GOOGLE_API_KEY,
          chatModel: env.GOOGLE_CHAT_MODEL,
          embeddingModel: env.GOOGLE_EMBEDDING_MODEL,
          temperature: env.LLM_TEMPERATURE,
        }),
      createVectorStore: (embeddings) =>
        createPgVectorStore(embeddings, {
          connectionString: env.DATABASE_URL,
          collectionName: env.PG_VECTOR_COLLECTION_NAME,
          dimensions: env.GOOGLE_EMBEDDING_DIMS,
        }),
      logger: {
        log: (message) => {
          console.log(message)
        },
        warn: (message) => {
          console.warn(message)
        },
      },
    },
    { shouldReset },
  )
}

main().catch((error: unknown) => {
  console.error('[ingest] fatal error:', error)
  process.exitCode = 1
})
