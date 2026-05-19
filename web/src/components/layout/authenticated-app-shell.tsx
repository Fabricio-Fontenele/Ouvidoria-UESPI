import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { getAuthenticatedHomeRoute, replaceWith, routes } from '../../app/routes'
import type { AuthenticatedUserRole } from '../../application/auth/auth-types'
import { useAuth } from '../../hooks/use-auth'
import { AppHeader } from './app-header'

interface AuthenticatedAppShellProps {
  allowedRoles?: readonly AuthenticatedUserRole[]
  children: ReactNode
  fixedHeader?: boolean
}

export function AuthenticatedAppShell({ allowedRoles, children, fixedHeader = false }: AuthenticatedAppShellProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const hasAllowedRole = user !== null && (allowedRoles === undefined || allowedRoles.includes(user.role))

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!isAuthenticated) {
      replaceWith(routes.login)
      return
    }

    if (user !== null && !hasAllowedRole) {
      replaceWith(getAuthenticatedHomeRoute(user.role))
    }
  }, [hasAllowedRole, isAuthenticated, isLoading, user])

  if (isLoading || !isAuthenticated || !hasAllowedRole) {
    return (
      <div className="min-h-svh bg-landing-surface font-sans text-landing-text">
        <AppHeader isAuthenticated={isAuthenticated} />
        <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
          <p className="text-base leading-7 text-landing-brown" role="status">
            Redirecionando para a área correta...
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
