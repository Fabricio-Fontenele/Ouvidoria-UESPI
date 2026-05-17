import type { ReactNode } from 'react'

import type { GuaraChatService } from '../application/guara-chat/guara-chat-service'
import { GuaraChatServiceContext } from './guara-chat-service-context'

export function GuaraChatServiceProvider({
  children,
  service,
}: {
  children: ReactNode
  service: GuaraChatService
}) {
  return <GuaraChatServiceContext.Provider value={service}>{children}</GuaraChatServiceContext.Provider>
}
