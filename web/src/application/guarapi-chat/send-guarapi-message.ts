import type { GuarapiChatService } from './guarapi-chat-service'
import type { SendGuarapiMessageInput, SendGuarapiMessageOutput } from './guarapi-chat-types'

export class EmptyGuarapiMessageError extends Error {
  constructor() {
    super('A mensagem para o Guarapi não pode estar vazia.')
    this.name = 'EmptyGuarapiMessageError'
  }
}

export class SendGuarapiMessage {
  private readonly chatService: GuarapiChatService

  constructor(chatService: GuarapiChatService) {
    this.chatService = chatService
  }

  async execute(input: SendGuarapiMessageInput): Promise<SendGuarapiMessageOutput> {
    if (input.message.trim().length === 0) {
      throw new EmptyGuarapiMessageError()
    }

    return this.chatService.sendMessage({
      ...input,
      message: input.message.trim(),
    })
  }
}
