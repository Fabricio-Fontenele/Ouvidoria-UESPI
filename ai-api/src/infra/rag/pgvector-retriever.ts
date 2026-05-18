import type { PGVectorStore } from '@langchain/community/vectorstores/pgvector'

import type { KnowledgeRetriever, RetrievedChunk } from '../../application/ports/knowledge-retriever.js'

export class PgVectorKnowledgeRetriever implements KnowledgeRetriever {
  constructor(private readonly vectorStore: PGVectorStore) {}

  async retrieve(query: string, k: number): Promise<RetrievedChunk[]> {
    const results = await this.vectorStore.similaritySearchWithScore(query, k)

    return results.map(([document, score]) => ({
      content: document.pageContent,
      score,
      source: this.extractSource(document.metadata),
    }))
  }

  private extractSource(metadata: unknown): string | null {
    if (metadata === null || typeof metadata !== 'object') {
      return null
    }
    const source = (metadata as Record<string, unknown>)['source']
    return typeof source === 'string' ? source : null
  }
}
