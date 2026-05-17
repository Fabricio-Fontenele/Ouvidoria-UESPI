import type { SendGuaraMessageInput, SendGuaraMessageOutput } from './guara-chat-types'

export interface GuaraChatService {
  sendMessage(input: SendGuaraMessageInput): Promise<SendGuaraMessageOutput>
}
