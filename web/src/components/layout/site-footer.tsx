import type { ComponentProps } from 'react'

import { cx } from '../../utils/cx'
import { Icon } from '../icons/icon'

type SiteFooterProps = ComponentProps<'footer'> & {
  variant?: 'default' | 'ombudsman'
}

export function SiteFooter({ className, variant = 'default', ...props }: SiteFooterProps) {
  return (
    <footer
      className={cx(
        'mt-12 rounded-t-lg bg-landing-footer px-[18px] pt-6 pb-7 text-landing-text md:mt-16 md:rounded-none md:px-0 md:pt-8 md:pb-10',
        className,
      )}
      {...props}
    >
      {variant === 'ombudsman' ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-[11px] leading-6 md:flex-row md:items-center md:justify-between md:px-8 md:text-sm">
          <div className="flex items-center gap-2 text-landing-blue">
            <Icon className="size-5" name="shield" />
            <strong className="text-xl leading-none font-bold md:text-2xl">Ouvidoria UESPI</strong>
          </div>

          <p>© 2024 Universidade Estadual do Piauí - UESPI</p>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-8 gap-y-6 md:px-8">
          <div>
            <h2 className="text-[13px] leading-none font-black tracking-[0.12em] text-landing-blue uppercase md:text-sm">
              Institucional
            </h2>
            <nav aria-label="Links institucionais" className="mt-6">
              <ul className="space-y-3 text-[11px] leading-none md:text-sm md:leading-5">
                <li>
                  <a
                    className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                    href="#transparencia"
                  >
                    Transparência
                  </a>
                </li>
                <li>
                  <a
                    className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                    href="https://aluno.uespi.br"
                  >
                    Portal do Aluno
                  </a>
                </li>
                <li>
                  <a
                    className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                    href="#privacidade"
                  >
                    Privacidade
                  </a>
                </li>
                <li>
                  <a
                    className="no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue"
                    href="#contato"
                  >
                    Contato
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div>
            <div className="flex items-center gap-2 text-landing-blue">
              <Icon className="size-5" name="shield" />
              <strong className="text-xl leading-none font-bold md:text-2xl">UESPI</strong>
            </div>
            <p className="mt-6 max-w-[180px] text-[11px] leading-[1.55] md:max-w-xs md:text-sm md:leading-6">
              Rua João Cabral, 2231 - Pirajá | Teresina - PI, 64002-150
            </p>
            <p className="mt-1 text-[11px] leading-none md:text-sm md:leading-5">(86) 3213-7150</p>
          </div>

          <p className="col-span-2 mx-auto max-w-[320px] text-center text-[11px] leading-[1.65] md:text-sm md:leading-6">
            © 2024 Universidade Estadual do Piauí - UESPI. Todos os direitos reservados.
          </p>

          <div className="col-span-2 flex gap-3">
            <a
              aria-label="Compartilhar"
              className="grid size-8 place-items-center rounded-full bg-landing-social text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:size-9"
              href="#compartilhar"
            >
              <Icon className="size-3.5 md:size-4" name="share" />
            </a>
            <a
              aria-label="Enviar email"
              className="grid size-8 place-items-center rounded-full bg-landing-social text-landing-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-landing-blue md:size-9"
              href="mailto:ouvidoria@uespi.br"
            >
              <Icon className="size-3.5 md:size-4" name="email" />
            </a>
          </div>
        </div>
      )}
    </footer>
  )
}
