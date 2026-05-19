import type { ReactNode } from 'react'

import { cx } from '../../utils/cx'
import { AppHeader } from './app-header'
import { SiteFooter } from './site-footer'

interface AuthPageShellProps {
  cardClassName?: string
  children: ReactNode
  footerId?: string
  titleId: string
}

export function AuthPageShell({ cardClassName, children, footerId, titleId }: AuthPageShellProps) {
  return (
    <main className="flex min-h-svh w-full flex-col bg-login-bg font-sans text-login-text">
      <AppHeader />

      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-8 sm:py-12 md:items-center md:px-10 md:py-14 lg:py-16">
        <section
          aria-labelledby={titleId}
          className={cx(
            'w-full rounded-lg bg-login-bg px-5 pt-8 pb-[25px] shadow-login-card sm:px-8 sm:pt-10 sm:pb-8 md:px-10 md:py-11',
            cardClassName,
          )}
        >
          {children}
        </section>
      </div>

      <SiteFooter id={footerId} />
    </main>
  )
}
