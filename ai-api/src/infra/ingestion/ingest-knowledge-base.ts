import pg from 'pg'

import { env } from '../../main/env.js'
import { createGeminiEmbeddings } from '../llm/gemini-structured-client.js'
import { createPgVectorStore } from '../vector-store/pgvector-store.js'

import { knowledgeBaseDirectoryExists, loadKnowledgeBaseDocuments } from './document-loader.js'
import { createTextSplitter } from './text-splitter.js'

async function dropCollectionTable(): Promise<void> {
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

  console.log(`[ingest] knowledge base directory: ${env.KB_DIR}`)
  console.log(`[ingest] chunk size=${String(env.RAG_CHUNK_SIZE)} overlap=${String(env.RAG_CHUNK_OVERLAP)}`)

  if (shouldReset) {
    await dropCollectionTable()
  }

  const exists = await knowledgeBaseDirectoryExists(env.KB_DIR)
  if (!exists) {
    console.error(`[ingest] directory does not exist: ${env.KB_DIR}`)
    process.exitCode = 1
    return
  }

  const loaded = await loadKnowledgeBaseDocuments(env.KB_DIR)
  if (loaded.length === 0) {
    console.warn('[ingest] no supported documents found (.pdf/.md/.txt). Nothing to ingest.')
    return
  }
  console.log(`[ingest] loaded ${String(loaded.length)} raw documents from disk`)

  const splitter = createTextSplitter({
    chunkSize: env.RAG_CHUNK_SIZE,
    chunkOverlap: env.RAG_CHUNK_OVERLAP,
  })
  const chunks = await splitter.splitDocuments(loaded.map((entry) => entry.document))
  console.log(`[ingest] split into ${String(chunks.length)} chunks`)

  const embeddings = createGeminiEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    chatModel: env.GOOGLE_CHAT_MODEL,
    embeddingModel: env.GOOGLE_EMBEDDING_MODEL,
    temperature: env.LLM_TEMPERATURE,
  })

  const probe = await embeddings.embedQuery('probe')
  if (probe.length === 0) {
    throw new Error(
      `Embedding model returned an empty vector. Check GOOGLE_EMBEDDING_MODEL — "${env.GOOGLE_EMBEDDING_MODEL}" likely is not an embedding model (chat models silently fail this way).`,
    )
  }
  if (probe.length !== env.GOOGLE_EMBEDDING_DIMS) {
    throw new Error(
      `Embedding dimension mismatch: model "${env.GOOGLE_EMBEDDING_MODEL}" returned ${String(probe.length)} dims but GOOGLE_EMBEDDING_DIMS=${String(env.GOOGLE_EMBEDDING_DIMS)}. Fix the env (and run \`pnpm ingest:reset\` if the table was already created).`,
    )
  }
  console.log(`[ingest] embedding probe OK (dim=${String(probe.length)})`)

  const vectorStore = await createPgVectorStore(embeddings, {
    connectionString: env.DATABASE_URL,
    collectionName: env.PG_VECTOR_COLLECTION_NAME,
    dimensions: env.GOOGLE_EMBEDDING_DIMS,
  })

  try {
    await vectorStore.addDocuments(chunks)
    console.log(`[ingest] persisted ${String(chunks.length)} chunks to "${env.PG_VECTOR_COLLECTION_NAME}"`)
  } finally {
    await vectorStore.end()
  }
}

main().catch((error: unknown) => {
  console.error('[ingest] fatal error:', error)
  process.exitCode = 1
})
