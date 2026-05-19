import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { replaceWith, routes } from '../../app/routes'
import { useAuth } from '../../hooks/use-auth'
import { AppHeader } from './app-header'

interface AuthenticatedAppShellProps {
  children: ReactNode
  fixedHeader?: boolean
}

export function AuthenticatedAppShell({ children, fixedHeader = false }: AuthenticatedAppShellProps) {
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
      {fixedHeader ? (
        <>
          <div className="fixed inset-x-0 top-0 z-50">
            <AppHeader isAuthenticated />
          </div>
          <div aria-hidden="true" className="h-22 md:h-24" />
        </>
      ) : (
        <AppHeader isAuthenticated />
      )}
      {children}
    </>
  )
}
