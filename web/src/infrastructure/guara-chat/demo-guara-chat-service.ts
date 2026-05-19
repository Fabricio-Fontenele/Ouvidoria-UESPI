import type { GuaraChatService } from '../../application/guara-chat/guara-chat-service'
import type { SendGuaraMessageInput, SendGuaraMessageOutput } from '../../application/guara-chat/guara-chat-types'

export class DemoGuaraChatService implements GuaraChatService {
  async sendMessage(input: SendGuaraMessageInput): Promise<SendGuaraMessageOutput> {
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
        author: 'guara',
        id: crypto.randomUUID(),
        text: `Entendi${protocolText}. ${modeText}`,
      },
    }
  }
}
