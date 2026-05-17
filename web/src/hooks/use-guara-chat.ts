import { useMemo, useState } from 'react'

import { SendGuaraMessage } from '../application/guara-chat/send-guara-message'
import type { GuaraChatContext, GuaraMessage } from '../application/guara-chat/guara-chat-types'
import { useGuaraChatService } from './use-guara-chat-service'

interface UseGuaraChatParams {
  context: GuaraChatContext
  initialMessages: GuaraMessage[]
}

export function useGuaraChat({ context, initialMessages }: UseGuaraChatParams) {
  const guaraChatService = useGuaraChatService()
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<GuaraMessage[]>(initialMessages)

  const sendGuaraMessage = useMemo(() => {
    return new SendGuaraMessage(guaraChatService)
  }, [guaraChatService])

  const sendMessage = async (message: string) => {
    const userMessage: GuaraMessage = {
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
      const output = await sendGuaraMessage.execute({
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
