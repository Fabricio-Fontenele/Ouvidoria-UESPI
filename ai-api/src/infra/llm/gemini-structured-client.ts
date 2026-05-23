import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import type { Runnable } from '@langchain/core/runnables'
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'

import { aiChatResponseSchema, type AiChatResponse } from '../../application/dtos/ai-chat-response.js'
import type { LlmProvider, StructuredCompletionInput } from '../../application/ports/llm-provider.js'

export interface GeminiClientConfig {
  apiKey: string
  chatModel: string
  embeddingModel: string
  temperature: number
}

export function createGeminiEmbeddings(config: GeminiClientConfig): GoogleGenerativeAIEmbeddings {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.apiKey,
    model: config.embeddingModel,
  })
}

type StructuredRunnable = Runnable<BaseLanguageModelInput, AiChatResponse>

export class GeminiStructuredLlmProvider implements LlmProvider {
  private readonly structured: StructuredRunnable

  constructor(config: GeminiClientConfig) {
    const model = new ChatGoogleGenerativeAI({
      apiKey: config.apiKey,
      model: config.chatModel,
      temperature: config.temperature,
      maxRetries: 0,
    })

    this.structured = model.withStructuredOutput(aiChatResponseSchema, {
      name: 'ai_chat_response',
    }) as StructuredRunnable
  }

  async completeStructured({ systemPrompt, userPrompt }: StructuredCompletionInput): Promise<AiChatResponse> {
    return this.structured.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])
  }
}
