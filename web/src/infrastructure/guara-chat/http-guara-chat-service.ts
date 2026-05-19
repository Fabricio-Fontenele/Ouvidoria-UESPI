import type { GuaraChatService } from '../../application/guara-chat/guara-chat-service'
import type { SendGuaraMessageInput, SendGuaraMessageOutput } from '../../application/guara-chat/guara-chat-types'

interface HttpGuaraChatServiceConfig {
  endpoint?: string
}

export class GuaraChatRequestError extends Error {
  constructor() {
    super('Não foi possível enviar a mensagem para o Guará.')
    this.name = 'GuaraChatRequestError'
  }
}

export class HttpGuaraChatService implements GuaraChatService {
  private readonly endpoint: string

  constructor(config: HttpGuaraChatServiceConfig = {}) {
    this.endpoint = config.endpoint ?? '/api/guara/chat'
  }

  async sendMessage(input: SendGuaraMessageInput): Promise<SendGuaraMessageOutput> {
    const response = await fetch(this.endpoint, {
      body: JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new GuaraChatRequestError()
    }

    return response.json() as Promise<SendGuaraMessageOutput>
  }
}
