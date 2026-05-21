import type { GuaraChatService } from '../../application/guara-chat/guara-chat-service'
import { HttpGuaraChatService } from './http-guara-chat-service'

export function makeGuaraChatService(): GuaraChatService {
  return new HttpGuaraChatService()
}
