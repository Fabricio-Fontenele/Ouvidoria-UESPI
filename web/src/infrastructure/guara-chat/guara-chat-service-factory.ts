import type { GuaraChatService } from '../../application/guara-chat/guara-chat-service'
import { DemoGuaraChatService } from './demo-guara-chat-service'
import { HttpGuaraChatService } from './http-guara-chat-service'

export function makeGuaraChatService(): GuaraChatService {
  const endpoint = import.meta.env.VITE_GUARA_CHAT_ENDPOINT

  if (typeof endpoint === 'string' && endpoint.trim().length > 0) {
    return new HttpGuaraChatService({ endpoint })
  }

  return new DemoGuaraChatService()
}
