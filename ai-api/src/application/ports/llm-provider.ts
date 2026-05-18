import type { AiChatResponse } from '../dtos/ai-chat-response.js'

export interface StructuredCompletionInput {
  systemPrompt: string
  userPrompt: string
}

export interface LlmProvider {
  completeStructured(input: StructuredCompletionInput): Promise<AiChatResponse>
}
