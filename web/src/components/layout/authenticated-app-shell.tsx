import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { replaceWith, routes } from '../../app/routes'
import { useAuth } from '../../hooks/use-auth'
import { AppHeader } from './app-header'

interface AuthenticatedAppShellProps {
  children: ReactNode
}

export function AuthenticatedAppShell({ children }: AuthenticatedAppShellProps) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      replaceWith(routes.login)
    }
  }, [isAuthenticated, isLoading])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
        <AppHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
          <p className="text-base leading-7 text-landing-brown" role="status">
            Redirecionando para o acesso ao sistema...
          </p>
        </main>
      </div>
    )
  }

  return (
    <>
      <AppHeader isAuthenticated />
      {children}
    </>
  )
}
