import type { PGVectorStore } from '@langchain/community/vectorstores/pgvector'

import { SendAiMessageUseCase } from '../../application/use-cases/send-ai-message-use-case.js'
import {
  GeminiStructuredLlmProvider,
  createGeminiEmbeddings,
  type GeminiClientConfig,
} from '../../infra/llm/gemini-structured-client.js'
import { PgVectorKnowledgeRetriever } from '../../infra/rag/pgvector-retriever.js'
import { RagPromptBuilder } from '../../infra/rag/rag-prompt-builder.js'
import { createPgVectorStore } from '../../infra/vector-store/pgvector-store.js'
import { env } from '../env.js'

export interface AiApiInfrastructure {
  vectorStore: PGVectorStore
  sendAiMessageUseCase: SendAiMessageUseCase
  shutdown: () => Promise<void>
}

export async function buildInfrastructure(): Promise<AiApiInfrastructure> {
  const geminiConfig: GeminiClientConfig = {
    apiKey: env.GOOGLE_API_KEY,
    chatModel: env.GOOGLE_CHAT_MODEL,
    embeddingModel: env.GOOGLE_EMBEDDING_MODEL,
    temperature: env.LLM_TEMPERATURE,
  }

  const embeddings = createGeminiEmbeddings(geminiConfig)
  const vectorStore = await createPgVectorStore(embeddings, {
    connectionString: env.DATABASE_URL,
    collectionName: env.PG_VECTOR_COLLECTION_NAME,
    dimensions: env.GOOGLE_EMBEDDING_DIMS,
  })

  const retriever = new PgVectorKnowledgeRetriever(vectorStore)
  const llm = new GeminiStructuredLlmProvider(geminiConfig)
  const promptBuilder = new RagPromptBuilder()

  const sendAiMessageUseCase = new SendAiMessageUseCase({
    retriever,
    llm,
    promptBuilder,
    retrievalTopK: env.RAG_TOP_K,
  })

  return {
    vectorStore,
    sendAiMessageUseCase,
    shutdown: async () => {
      await vectorStore.end()
    },
  }
}
