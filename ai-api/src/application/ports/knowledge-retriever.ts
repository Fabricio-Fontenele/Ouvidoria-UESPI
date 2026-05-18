export interface RetrievedChunk {
  content: string
  score: number
  source: string | null
}

export interface KnowledgeRetriever {
  retrieve(query: string, k: number): Promise<RetrievedChunk[]>
}
