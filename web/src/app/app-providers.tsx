import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { AuthProvider } from '../contexts/auth-provider'
import { GuarapiChatServiceProvider } from '../contexts/guarapi-chat-service-provider'
import { makeAuthService } from '../infrastructure/auth/auth-service-factory'
import { makeGuarapiChatService } from '../infrastructure/guarapi-chat/guarapi-chat-service-factory'

export function AppProviders({ children }: { children: ReactNode }) {
  const authService = useMemo(() => makeAuthService(), [])
  const guarapiChatService = useMemo(() => makeGuarapiChatService(), [])

  return (
    <AuthProvider service={authService}>
      <GuarapiChatServiceProvider service={guarapiChatService}>{children}</GuarapiChatServiceProvider>
    </AuthProvider>
  )
}
