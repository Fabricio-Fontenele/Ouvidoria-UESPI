import { PGVectorStore } from '@langchain/community/vectorstores/pgvector'
import type { EmbeddingsInterface } from '@langchain/core/embeddings'

export interface PgVectorStoreConfig {
  connectionString: string
  collectionName: string
  dimensions: number
}

export async function createPgVectorStore(
  embeddings: EmbeddingsInterface,
  config: PgVectorStoreConfig,
): Promise<PGVectorStore> {
  return PGVectorStore.initialize(embeddings, {
    postgresConnectionOptions: { connectionString: config.connectionString },
    tableName: config.collectionName,
    dimensions: config.dimensions,
    columns: {
      idColumnName: 'id',
      vectorColumnName: 'vector',
      contentColumnName: 'content',
      metadataColumnName: 'metadata',
    },
  })
}
