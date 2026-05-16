import type { SendGuarapiMessageInput, SendGuarapiMessageOutput } from './guarapi-chat-types'

export interface GuarapiChatService {
  sendMessage(input: SendGuarapiMessageInput): Promise<SendGuarapiMessageOutput>
}
