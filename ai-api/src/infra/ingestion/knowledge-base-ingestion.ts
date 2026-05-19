import type { Document } from '@langchain/core/documents'
import type { EmbeddingsInterface } from '@langchain/core/embeddings'

import type { Env } from '../../main/env.js'

import { embedInBatches } from './embed-in-batches.js'

export interface IngestionLogger {
  log: (message: string) => void
  warn: (message: string) => void
}

export interface IngestionChunkDocument {
  document: Document
  source: string
}

export type IngestionEmbeddings = EmbeddingsInterface<number[]>

export interface IngestionVectorStore {
  addVectors: (vectors: number[][], documents: Document[]) => Promise<void>
  end: () => Promise<void>
}

export interface IngestionTextSplitter {
  splitDocuments: (documents: Document[]) => Promise<Document[]>
}

export interface IngestionDeps {
  dropCollectionTable: () => Promise<void>
  knowledgeBaseDirectoryExists: (kbDir: string) => Promise<boolean>
  loadKnowledgeBaseDocuments: (kbDir: string) => Promise<IngestionChunkDocument[]>
  createTextSplitter: (config: { chunkSize: number; chunkOverlap: number }) => IngestionTextSplitter
  createEmbeddings: () => IngestionEmbeddings
  createVectorStore: (embeddings: IngestionEmbeddings) => Promise<IngestionVectorStore>
  logger: IngestionLogger
}

export function validateEmbeddingProbe(
  probe: number[],
  ingestionEnv: Pick<Env, 'GOOGLE_EMBEDDING_DIMS' | 'GOOGLE_EMBEDDING_MODEL'>,
): void {
  if (probe.length === 0) {
    throw new Error(
      `Embedding model returned an empty vector. Check GOOGLE_EMBEDDING_MODEL — "${ingestionEnv.GOOGLE_EMBEDDING_MODEL}" likely is not an embedding model (chat models silently fail this way).`,
    )
  }
  if (probe.length !== ingestionEnv.GOOGLE_EMBEDDING_DIMS) {
    throw new Error(
      `Embedding dimension mismatch: model "${ingestionEnv.GOOGLE_EMBEDDING_MODEL}" returned ${String(probe.length)} dims but GOOGLE_EMBEDDING_DIMS=${String(ingestionEnv.GOOGLE_EMBEDDING_DIMS)}. Fix the env (and run \`pnpm ingest:reset\` if the table was already created).`,
    )
  }
}

export async function runKnowledgeBaseIngestion(
  ingestionEnv: Pick<
    Env,
    | 'KB_DIR'
    | 'RAG_CHUNK_SIZE'
    | 'RAG_CHUNK_OVERLAP'
    | 'RAG_EMBEDDING_BATCH_SIZE'
    | 'RAG_EMBEDDING_MAX_RETRIES'
    | 'GOOGLE_EMBEDDING_DIMS'
    | 'GOOGLE_EMBEDDING_MODEL'
    | 'PG_VECTOR_COLLECTION_NAME'
  >,
  deps: IngestionDeps,
  options: { shouldReset: boolean },
): Promise<void> {
  deps.logger.log(`[ingest] knowledge base directory: ${ingestionEnv.KB_DIR}`)
  deps.logger.log(
    `[ingest] chunk size=${String(ingestionEnv.RAG_CHUNK_SIZE)} overlap=${String(ingestionEnv.RAG_CHUNK_OVERLAP)}`,
  )

  if (options.shouldReset) {
    await deps.dropCollectionTable()
  }

  const exists = await deps.knowledgeBaseDirectoryExists(ingestionEnv.KB_DIR)
  if (!exists) {
    deps.logger.warn(`[ingest] directory does not exist: ${ingestionEnv.KB_DIR}`)
    process.exitCode = 1
    return
  }

  const loaded = await deps.loadKnowledgeBaseDocuments(ingestionEnv.KB_DIR)
  if (loaded.length === 0) {
    deps.logger.warn('[ingest] no supported documents found (.pdf/.md/.txt). Nothing to ingest.')
    return
  }
  deps.logger.log(`[ingest] loaded ${String(loaded.length)} raw documents from disk`)

  const splitter = deps.createTextSplitter({
    chunkSize: ingestionEnv.RAG_CHUNK_SIZE,
    chunkOverlap: ingestionEnv.RAG_CHUNK_OVERLAP,
  })
  const chunks = await splitter.splitDocuments(loaded.map((entry) => entry.document))
  deps.logger.log(`[ingest] split into ${String(chunks.length)} chunks`)

  const nonEmptyChunks = chunks.filter((chunk) => chunk.pageContent.trim().length > 0)
  const droppedChunks = chunks.length - nonEmptyChunks.length
  if (droppedChunks > 0) {
    deps.logger.warn(
      `[ingest] dropped ${String(droppedChunks)} empty/whitespace-only chunks before embedding (would yield zero-dim vectors)`,
    )
  }
  if (nonEmptyChunks.length === 0) {
    deps.logger.warn('[ingest] no non-empty chunks to ingest. Nothing was written.')
    return
  }

  const embeddings = deps.createEmbeddings()
  const probe = await embeddings.embedQuery('probe')
  validateEmbeddingProbe(probe, ingestionEnv)
  deps.logger.log(`[ingest] embedding probe OK (dim=${String(probe.length)})`)

  const vectors = await embedInBatches(
    embeddings,
    nonEmptyChunks.map((chunk) => chunk.pageContent),
    {
      batchSize: ingestionEnv.RAG_EMBEDDING_BATCH_SIZE,
      maxRetries: ingestionEnv.RAG_EMBEDDING_MAX_RETRIES,
      dims: ingestionEnv.GOOGLE_EMBEDDING_DIMS,
      logger: deps.logger,
    },
  )

  const vectorStore = await deps.createVectorStore(embeddings)

  try {
    await vectorStore.addVectors(vectors, nonEmptyChunks)
    deps.logger.log(
      `[ingest] persisted ${String(vectors.length)} chunks to "${ingestionEnv.PG_VECTOR_COLLECTION_NAME}"`,
    )
  } finally {
    await vectorStore.end()
  }
}
