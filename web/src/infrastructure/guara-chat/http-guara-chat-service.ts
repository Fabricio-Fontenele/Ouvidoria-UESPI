import type { GuaraChatService } from '../../application/guara-chat/guara-chat-service'
import type {
  GuaraChatHistoryItem,
  SendGuaraMessageInput,
  SendGuaraMessageOutput,
} from '../../application/guara-chat/guara-chat-types'
import { ApiHttpError } from '../http/api-error'
import { publicApiFetch } from '../http/api-client'
import { normalizeGuaraChatResponse } from './guara-chat-response-normalizer'

const MAX_MESSAGE_LENGTH = 4000
const MAX_HISTORY_ITEMS = 20

export class GuaraChatRequestError extends Error {
  constructor(message = 'Não foi possível enviar a mensagem para o Guará.') {
    super(message)
    this.name = 'GuaraChatRequestError'
  }
}

function sanitizeHistory(history: GuaraChatHistoryItem[]): GuaraChatHistoryItem[] {
  const sanitized: GuaraChatHistoryItem[] = []

  for (const entry of history) {
    if (entry.role !== 'user' && entry.role !== 'assistant') {
      continue
    }

    const trimmed = entry.content.trim()

    if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) {
      continue
    }

    sanitized.push({ content: trimmed, role: entry.role })
  }

  return sanitized.slice(-MAX_HISTORY_ITEMS)
}

export class HttpGuaraChatService implements GuaraChatService {
  async sendMessage(input: SendGuaraMessageInput): Promise<SendGuaraMessageOutput> {
    const trimmedMessage = input.message.trim()

    if (trimmedMessage.length === 0) {
      throw new GuaraChatRequestError('A mensagem para o Guará não pode estar vazia.')
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new GuaraChatRequestError('A mensagem deve ter no máximo 4000 caracteres.')
    }

    const history = sanitizeHistory(input.history)

    try {
      const raw = await publicApiFetch<unknown>('/ai/messages', {
        body: { history, message: trimmedMessage },
        method: 'POST',
      })

      return normalizeGuaraChatResponse(raw)
    } catch (error) {
      if (error instanceof ApiHttpError) {
        throw new GuaraChatRequestError()
      }

      throw error
    }
  }
}
