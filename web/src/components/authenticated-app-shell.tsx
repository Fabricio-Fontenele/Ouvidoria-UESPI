import type { ReactNode } from 'react'

import { AppHeader } from './app-header'

interface AuthenticatedAppShellProps {
  children: ReactNode
}

export function AuthenticatedAppShell({ children }: AuthenticatedAppShellProps) {
  return (
    <>
      <AppHeader isAuthenticated />
      {children}
    </>
  )
}
