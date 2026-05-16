import type { GuarapiChatService } from '../../application/guarapi-chat/guarapi-chat-service'
import type {
  SendGuarapiMessageInput,
  SendGuarapiMessageOutput,
} from '../../application/guarapi-chat/guarapi-chat-types'

interface HttpGuarapiChatServiceConfig {
  endpoint?: string
}

export class GuarapiChatRequestError extends Error {
  constructor() {
    super('Não foi possível enviar a mensagem para o Guarapi.')
    this.name = 'GuarapiChatRequestError'
  }
}

export class HttpGuarapiChatService implements GuarapiChatService {
  private readonly endpoint: string

  constructor(config: HttpGuarapiChatServiceConfig = {}) {
    this.endpoint = config.endpoint ?? '/api/guarapi/chat'
  }

  async sendMessage(input: SendGuarapiMessageInput): Promise<SendGuarapiMessageOutput> {
    const response = await fetch(this.endpoint, {
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new GuarapiChatRequestError()
    }

    return response.json() as Promise<SendGuarapiMessageOutput>
  }
}
