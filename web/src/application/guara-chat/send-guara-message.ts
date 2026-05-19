import type { GuaraChatService } from './guara-chat-service'
import type { SendGuaraMessageInput, SendGuaraMessageOutput } from './guara-chat-types'

export class EmptyGuaraMessageError extends Error {
  constructor() {
    super('A mensagem para o Guará não pode estar vazia.')
    this.name = 'EmptyGuaraMessageError'
  }
}

export class SendGuaraMessage {
  private readonly chatService: GuaraChatService

  constructor(chatService: GuaraChatService) {
    this.chatService = chatService
  }

  async execute(input: SendGuaraMessageInput): Promise<SendGuaraMessageOutput> {
    if (input.message.trim().length === 0) {
      throw new EmptyGuaraMessageError()
    }

    return this.chatService.sendMessage({
      ...input,
      message: input.message.trim(),
    })
  }
}
