import type { GuarapiChatService } from '../../application/guarapi-chat/guarapi-chat-service'
import type {
  SendGuarapiMessageInput,
  SendGuarapiMessageOutput,
} from '../../application/guarapi-chat/guarapi-chat-types'

export class DemoGuarapiChatService implements GuarapiChatService {
  async sendMessage(input: SendGuarapiMessageInput): Promise<SendGuarapiMessageOutput> {
    const protocolText = input.context.protocol !== null ? ` sobre o protocolo ${input.context.protocol}` : ''
    const modeText =
      input.context.mode === 'new-manifestation'
        ? 'Posso te ajudar a transformar isso em uma manifestação clara e objetiva.'
        : input.context.mode === 'manifestation-detail'
          ? 'Posso explicar o andamento, resumir o histórico ou ajudar você a escrever uma nova mensagem.'
          : 'Posso orientar você sobre tipos de manifestação, cadastro e acompanhamento.'

    await new Promise((resolve) => {
      window.setTimeout(resolve, 350)
    })

    return {
      message: {
        author: 'guarapi',
        id: crypto.randomUUID(),
        text: `Entendi${protocolText}. ${modeText}`,
      },
    }
  }
}
