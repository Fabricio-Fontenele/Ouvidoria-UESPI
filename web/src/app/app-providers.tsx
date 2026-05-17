import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { AuthProvider } from '../contexts/auth-provider'
import { GuaraChatServiceProvider } from '../contexts/guara-chat-service-provider'
import { makeAuthService } from '../infrastructure/auth/auth-service-factory'
import { makeGuaraChatService } from '../infrastructure/guara-chat/guara-chat-service-factory'

export function AppProviders({ children }: { children: ReactNode }) {
  const authService = useMemo(() => makeAuthService(), [])
  const guaraChatService = useMemo(() => makeGuaraChatService(), [])

  return (
    <AuthProvider service={authService}>
      <GuaraChatServiceProvider service={guaraChatService}>{children}</GuaraChatServiceProvider>
    </AuthProvider>
  )
}
