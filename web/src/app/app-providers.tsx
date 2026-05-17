import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { GuarapiChatServiceProvider } from '../contexts/guarapi-chat-service-provider'
import { makeGuarapiChatService } from '../infrastructure/guarapi-chat/guarapi-chat-service-factory'

export function AppProviders({ children }: { children: ReactNode }) {
  const guarapiChatService = useMemo(() => makeGuarapiChatService(), [])

  return <GuarapiChatServiceProvider service={guarapiChatService}>{children}</GuarapiChatServiceProvider>
}
