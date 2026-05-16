import type { ComponentProps } from 'react'

import { cx } from '../utils/cx'
import { Icon } from './icon'

interface SiteFooterProps extends ComponentProps<'footer'> {
  variant?: 'auth' | 'home'
}

export function SiteFooter({ className, variant = 'auth', ...props }: SiteFooterProps) {
  const isHome = variant === 'home'
  const socialAccentClassName = isHome ? 'bg-home-blue' : 'bg-login-blue'
  const textClassName = isHome ? 'text-home-brown' : 'text-login-brown'
  const focusClassName = isHome ? 'focus-visible:outline-home-blue' : 'focus-visible:outline-login-blue'
  const footerClasses = isHome
    ? 'mt-10 rounded-t-lg bg-home-footer px-6 pt-8 pb-6 text-center md:mt-14 md:rounded-none'
    : 'w-full flex-none rounded-t-lg bg-login-footer px-6 pt-[33px] pb-[22px] text-center md:rounded-none md:px-10 md:py-8'
  const navGapClasses = isHome ? 'gap-x-8' : 'gap-x-[18px] min-[361px]:gap-x-8 md:gap-x-10'
  const linkClasses = cx(
    'rounded-sm text-sm leading-5 font-bold no-underline transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3',
    textClassName,
    focusClassName,
  )
  const socialLinkClasses = cx(
    'grid size-6 place-items-center rounded-full text-white transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-3',
    socialAccentClassName,
    focusClassName,
  )

  return (
    <footer className={cx(footerClasses, textClassName, className)} {...props}>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 md:flex-row md:justify-between md:gap-8">
        <p className={cx('text-sm leading-5', isHome ? undefined : 'md:text-left')}>
          © 2026 Universidade Estadual do Piauí
        </p>

        <nav aria-label="Links institucionais" className={cx('flex flex-wrap justify-center gap-y-2', navGapClasses)}>
          <a className={linkClasses} href="https://www.uespi.br">
            Portal Uespi
          </a>
          <a className={linkClasses} href="#privacidade">
            Privacidade
          </a>
          <a className={linkClasses} href="#suporte">
            Suporte
          </a>
        </nav>

        <div className="flex justify-center gap-6">
          <a aria-label="Compartilhar" className={socialLinkClasses} href="#compartilhar">
            <Icon className="size-3.5" name="share" />
          </a>
          <a aria-label="Enviar email" className={socialLinkClasses} href="mailto:ouvidoria@uespi.br">
            <Icon className="size-3.5" name="email" />
          </a>
        </div>
      </div>
    </footer>
  )
}
