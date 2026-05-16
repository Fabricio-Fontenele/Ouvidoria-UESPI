import type { GuarapiChatService } from '../../application/guarapi-chat/guarapi-chat-service'
import { DemoGuarapiChatService } from './demo-guarapi-chat-service'
import { HttpGuarapiChatService } from './http-guarapi-chat-service'

export function makeGuarapiChatService(): GuarapiChatService {
  const endpoint = import.meta.env.VITE_GUARAPI_CHAT_ENDPOINT

  if (typeof endpoint === 'string' && endpoint.trim().length > 0) {
    return new HttpGuarapiChatService({ endpoint })
  }

  return new DemoGuarapiChatService()
}
