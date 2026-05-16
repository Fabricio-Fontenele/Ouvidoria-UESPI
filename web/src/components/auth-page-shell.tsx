import type { ReactNode } from 'react'

import uespiLogo from '../assets/brasao.png'
import { cx } from '../utils/cx'
import { Icon } from './icon'
import { SiteFooter } from './site-footer'

interface AuthPageShellProps {
  cardClassName?: string
  children: ReactNode
  footerId?: string
  titleId: string
}

function AuthHeader() {
  const linkFocusClasses =
    'transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

  return (
    <header className="h-22 w-full flex-none bg-login-surface shadow-login-header md:h-24">
      <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-[52px_1fr_40px] items-center gap-3 px-5 min-[361px]:gap-6 min-[361px]:px-[34px] sm:px-8 md:h-22 md:grid-cols-[60px_1fr_52px] lg:px-12">
        <img alt="Brasão da UESPI" className="h-[72px] w-[52px] object-contain md:h-20 md:w-[58px]" src={uespiLogo} />
        <strong className="text-center text-lg leading-8 font-bold whitespace-nowrap text-login-blue min-[361px]:text-xl md:text-[22px]">
          Ouvidoria UESPI
        </strong>
        <a
          aria-label="Ajuda"
          className={cx('grid size-7 place-items-center justify-self-end rounded-full text-login-blue md:size-8', linkFocusClasses)}
          href="#suporte"
        >
          <Icon className="size-[22px] md:size-6" name="help" />
        </a>
      </div>
    </header>
  )
}

export function AuthPageShell({ cardClassName, children, footerId, titleId }: AuthPageShellProps) {
  return (
    <main className="flex min-h-svh w-full flex-col bg-login-bg font-sans text-login-text">
      <AuthHeader />

      <div className="flex flex-1 items-start justify-center px-4 py-8 sm:px-8 sm:py-12 md:items-center md:px-10 md:py-14 lg:py-16">
        <section
          aria-labelledby={titleId}
          className={cx('w-full rounded-lg bg-login-bg px-5 pt-8 pb-[25px] shadow-login-card sm:px-8 sm:pt-10 sm:pb-8 md:px-10 md:py-11', cardClassName)}
        >
          {children}
        </section>
      </div>

      <SiteFooter id={footerId} />
    </main>
  )
}
