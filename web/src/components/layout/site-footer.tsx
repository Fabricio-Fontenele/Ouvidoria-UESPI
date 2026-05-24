import type { ComponentProps } from 'react'

import { routes } from '../../app/routes'
import { cx } from '../../utils/cx'
import { Icon, type IconName } from '../icons/icon'

type SiteFooterProps = ComponentProps<'footer'> & {
  variant?: 'default' | 'ombudsman'
}

const institutionalLinks: Array<{ external?: boolean; href: string; label: string }> = [
  { external: true, href: 'https://transparencia.uespi.br/', label: 'Transparência' },
  { external: true, href: 'https://sigaa.uespi.br/sigaa/?modo=classico', label: 'Portal do Aluno' },
  { href: routes.faq, label: 'FAQ' },
  { href: routes.privacy, label: 'Privacidade' },
] as const

const socialLinks: Array<{ href: string; icon: IconName; label: string }> = [
  {
    href: 'https://www.youtube.com/c/UESPIoficial',
    icon: 'youtube',
    label: 'YouTube da UESPI',
  },
  {
    href: 'https://instagram.com/uespioficial',
    icon: 'instagram',
    label: 'Instagram da UESPI',
  },
  {
    href: 'mailto:comunicacao@uespi.br',
    icon: 'email',
    label: 'E-mail da Comunicação',
  },
]

export function SiteFooter({ className, variant = 'default', ...props }: SiteFooterProps) {
  return (
    <footer
      className={cx('mt-12 bg-landing-footer px-[18px] py-7 text-landing-text md:mt-16 md:px-0 md:py-9', className)}
      {...props}
    >
      {variant === 'ombudsman' ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-[11px] leading-6 md:flex-row md:items-center md:justify-between md:px-8 md:text-sm">
          <div className="flex items-center gap-2 text-landing-blue">
            <Icon className="size-5" name="shield" />
            <strong className="text-xl leading-none font-bold md:text-2xl">Ouvidoria UESPI</strong>
          </div>

          <p>&copy; 2024 Universidade Estadual do Piauí - UESPI</p>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 md:px-8">
          <div className="flex flex-col gap-6 border-b border-landing-text/10 pb-5 md:flex-row md:items-start md:justify-between md:pb-6">
            <div className="max-w-md">
              <div className="flex items-center gap-2 text-landing-blue">
                <Icon className="size-5" name="shield" />
                <strong className="text-xl leading-none font-bold md:text-2xl">Ouvidoria UESPI</strong>
              </div>
              <p className="mt-3 max-w-sm text-xs leading-5 text-landing-menu md:text-sm md:leading-6">
                Canal oficial para manifestações, acompanhamento e diálogo com a comunidade universitária.
              </p>
            </div>

            <nav aria-label="Links institucionais">
              <h2 className="text-xs leading-none font-black tracking-[0.12em] text-landing-blue uppercase">
                Institucional
              </h2>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5 font-bold text-landing-text md:justify-end md:text-sm">
                {institutionalLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      className="no-underline transition duration-150 hover:text-landing-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                      href={link.href}
                      rel={link.external ? 'noreferrer' : undefined}
                      target={link.external ? '_blank' : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-4 text-xs leading-5 text-landing-menu md:flex-row md:items-center md:justify-between md:text-sm">
            <p>&copy; 2026 Universidade Estadual do Piauí - UESPI. Todos os direitos reservados.</p>

            <div aria-label="Canais oficiais" className="flex gap-2">
              {socialLinks.map((link) => (
                <a
                  aria-label={link.label}
                  className="grid size-9 place-items-center rounded-full border border-landing-blue/20 bg-landing-surface text-landing-blue transition duration-150 hover:bg-landing-blue hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                  href={link.href}
                  key={link.href}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                >
                  <Icon className="size-4" name={link.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
