import type { ReactNode } from 'react'

import type { GuarapiChatService } from '../application/guarapi-chat/guarapi-chat-service'
import { GuarapiChatServiceContext } from './guarapi-chat-service-context'

export function GuarapiChatServiceProvider({
  children,
  service,
}: {
  children: ReactNode
  service: GuarapiChatService
}) {
  return <GuarapiChatServiceContext.Provider value={service}>{children}</GuarapiChatServiceContext.Provider>
}
