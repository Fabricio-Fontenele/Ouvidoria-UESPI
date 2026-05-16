import { useMemo, useState } from 'react'

import { SendGuarapiMessage } from '../application/guarapi-chat/send-guarapi-message'
import type { GuarapiChatContext, GuarapiMessage } from '../application/guarapi-chat/guarapi-chat-types'
import { makeGuarapiChatService } from '../infrastructure/guarapi-chat/guarapi-chat-service-factory'

interface UseGuarapiChatParams {
  context: GuarapiChatContext
  initialMessages: GuarapiMessage[]
}

export function useGuarapiChat({ context, initialMessages }: UseGuarapiChatParams) {
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<GuarapiMessage[]>(initialMessages)

  const sendGuarapiMessage = useMemo(() => {
    return new SendGuarapiMessage(makeGuarapiChatService())
  }, [])

  const sendMessage = async (message: string) => {
    const userMessage: GuarapiMessage = {
      author: 'user',
      id: crypto.randomUUID(),
      text: message.trim(),
    }

    if (userMessage.text.length === 0) {
      return
    }

    setError(null)
    setIsSending(true)
    setMessages((currentMessages) => [...currentMessages, userMessage])

    try {
      const output = await sendGuarapiMessage.execute({
        context,
        message: userMessage.text,
        previousMessages: [...messages, userMessage],
      })

      setMessages((currentMessages) => [...currentMessages, output.message])
    } catch {
      setError('Não foi possível enviar a mensagem. Tente novamente em instantes.')
    } finally {
      setIsSending(false)
    }
  }

  return {
    error,
    isSending,
    messages,
    sendMessage,
  }
}
