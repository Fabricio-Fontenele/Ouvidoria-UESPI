import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { AuthProvider } from '../contexts/auth-provider'
import { CatalogProvider } from '../contexts/catalog-provider'
import { GuaraChatServiceProvider } from '../contexts/guara-chat-service-provider'
import { makeAuthService } from '../infrastructure/auth/auth-service-factory'
import { makeCatalogService } from '../infrastructure/catalog/catalog-service-factory'
import { makeGuaraChatService } from '../infrastructure/guara-chat/guara-chat-service-factory'

export function AppProviders({ children }: { children: ReactNode }) {
  const authService = useMemo(() => makeAuthService(), [])
  const catalogService = useMemo(() => makeCatalogService(), [])
  const guaraChatService = useMemo(() => makeGuaraChatService(), [])

  return (
    <AuthProvider service={authService}>
      <CatalogProvider service={catalogService}>
        <GuaraChatServiceProvider service={guaraChatService}>{children}</GuaraChatServiceProvider>
      </CatalogProvider>
    </AuthProvider>
  )
}
