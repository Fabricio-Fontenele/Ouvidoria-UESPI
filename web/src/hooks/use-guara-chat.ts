import { useEffect, useMemo, useRef, useState } from 'react'

import { SendGuaraMessage } from '../application/guara-chat/send-guara-message'
import type {
  GuaraChatDraft,
  GuaraChatHistoryItem,
  GuaraChatIntent,
  GuaraChatMissingField,
  GuaraMessage,
} from '../application/guara-chat/guara-chat-types'
import { clearChatMessages, readChatMessages, writeChatMessages } from '../infrastructure/guara-chat/guara-chat-storage'
import { useGuaraChatService } from './use-guara-chat-service'

interface UseGuaraChatParams {
  initialMessages: GuaraMessage[]
}

interface UseGuaraChatResult {
  clearConversation: () => void
  error: string | null
  isSending: boolean
  messages: GuaraMessage[]
  missingFields: GuaraChatMissingField[]
  pendingDraft: GuaraChatDraft | null
  pendingIntent: GuaraChatIntent | null
  sendMessage: (message: string) => Promise<void>
  shouldOpenManifestationDraft: boolean
}

function buildHistory(messages: GuaraMessage[]): GuaraChatHistoryItem[] {
  return messages.map((message) => ({
    content: message.text,
    role: message.author === 'guara' ? 'assistant' : 'user',
  }))
}

export function useGuaraChat({ initialMessages }: UseGuaraChatParams): UseGuaraChatResult {
  const guaraChatService = useGuaraChatService()
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<GuaraChatDraft | null>(null)
  const [pendingIntent, setPendingIntent] = useState<GuaraChatIntent | null>(null)
  const [missingFields, setMissingFields] = useState<GuaraChatMissingField[]>([])
  const [shouldOpenManifestationDraft, setShouldOpenManifestationDraft] = useState(false)

  const initialMessagesRef = useRef(initialMessages)

  useEffect(() => {
    initialMessagesRef.current = initialMessages
  }, [initialMessages])

  const [messages, setMessages] = useState<GuaraMessage[]>(() => {
    const stored = readChatMessages()

    if (stored !== null && stored.length > 0) {
      return stored
    }

    return initialMessages
  })

  useEffect(() => {
    writeChatMessages(messages)
  }, [messages])

  const sendGuaraMessage = useMemo(() => new SendGuaraMessage(guaraChatService), [guaraChatService])

  const sendMessage = async (message: string) => {
    const trimmed = message.trim()

    if (trimmed.length === 0 || isSending) {
      return
    }

    const userMessage: GuaraMessage = {
      author: 'user',
      id: crypto.randomUUID(),
      text: trimmed,
    }

    const nextMessages = [...messages, userMessage]

    setError(null)
    setIsSending(true)
    setMessages(nextMessages)

    try {
      const output = await sendGuaraMessage.execute({
        history: buildHistory(messages),
        message: trimmed,
      })

      const assistantMessage: GuaraMessage = {
        author: 'guara',
        id: crypto.randomUUID(),
        text: output.answer,
      }

      setMessages([...nextMessages, assistantMessage])
      setPendingDraft(output.draft)
      setPendingIntent(output.intent)
      setMissingFields(output.missingFields)
      setShouldOpenManifestationDraft(output.shouldOpenManifestationDraft)
    } catch {
      setError('Não foi possível enviar a mensagem. Tente novamente em instantes.')
    } finally {
      setIsSending(false)
    }
  }

  const clearConversation = () => {
    setMessages(initialMessagesRef.current)
    setPendingDraft(null)
    setPendingIntent(null)
    setMissingFields([])
    setShouldOpenManifestationDraft(false)
    setError(null)
    clearChatMessages()
  }

  return {
    clearConversation,
    error,
    isSending,
    messages,
    missingFields,
    pendingDraft,
    pendingIntent,
    sendMessage,
    shouldOpenManifestationDraft,
  }
}
