import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react'

import uespiLogo from '../assets/brasao.png'
import { cx } from '../utils/cx'
import { Icon, type IconName } from './icon'

interface AuthenticatedAppShellProps {
  children: ReactNode
}

interface MenuItem {
  href: string
  icon: IconName
  label: string
}

const mainMenuItems: MenuItem[] = [
  { href: '/home', icon: 'home', label: 'Início' },
  { href: '#buscar-manifestacao', icon: 'file-text', label: 'Minhas manifestações' },
  { href: '#guarapi', icon: 'plus-circle', label: 'Novo registro' },
  { href: '#notificacoes', icon: 'bell', label: 'Notificações' },
  { href: '#perfil', icon: 'user', label: 'Perfil' },
]

const supportMenuItems: MenuItem[] = [
  { href: '#suporte', icon: 'help', label: 'Suporte' },
  { href: '#configuracoes', icon: 'settings', label: 'Configurações' },
]

const iconButtonClasses =
  'grid size-9 place-items-center rounded-full text-home-blue transition duration-150 hover:bg-home-blue/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue'

function MenuLink({ href, icon, isActive = false, label, onNavigate }: MenuItem & { isActive?: boolean; onNavigate: () => void }) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        'grid min-h-12 grid-cols-[22px_1fr] items-center gap-3 rounded-lg px-3 text-sm leading-5 font-semibold no-underline transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue',
        isActive ? 'bg-home-blue text-white' : 'text-home-brown hover:bg-home-action active:bg-home-chip',
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="size-[18px]" name={icon} />
      <span>{label}</span>
    </a>
  )
}

function AuthenticatedMenu({
  isOpen,
  onClose,
  openerRef,
}: {
  isOpen: boolean
  onClose: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        openerRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, openerRef])

  if (!isOpen) {
    return null
  }

  const handleClose = () => {
    onClose()
    openerRef.current?.focus()
  }

  const handlePanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') {
      return
    }

    const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (firstElement === undefined || lastElement === undefined) {
      return
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="Fechar menu"
        className="absolute inset-0 cursor-default bg-home-text/35"
        onClick={handleClose}
        type="button"
      />

      <aside
        aria-labelledby="authenticated-menu-title"
        aria-modal="true"
        className="absolute top-0 left-0 flex h-full w-[min(86vw,360px)] flex-col bg-home-surface px-5 pt-5 pb-6 shadow-home-card"
        onKeyDown={handlePanelKeyDown}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <a className="flex min-w-0 items-center gap-2 text-home-blue no-underline" href="/home" onClick={onClose}>
            <img alt="Brasão da UESPI" className="h-12 w-8 object-contain" src={uespiLogo} />
            <strong className="truncate text-base leading-6 font-bold" id="authenticated-menu-title">
              Ouvidoria UESPI
            </strong>
          </a>

          <button aria-label="Fechar menu" className={iconButtonClasses} onClick={handleClose} ref={closeButtonRef} type="button">
            <Icon className="size-5" name="x" />
          </button>
        </div>

        <nav aria-label="Menu principal" className="mt-8">
          <ul className="space-y-2">
            {mainMenuItems.map((item) => (
              <li key={item.label}>
                <MenuLink {...item} isActive={item.href === '/home'} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Menu de apoio" className="mt-8 border-t border-home-chip pt-6">
          <ul className="space-y-2">
            {supportMenuItems.map((item) => (
              <li key={item.label}>
                <MenuLink {...item} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-home-chip pt-5">
          <a
            className="grid min-h-12 grid-cols-[22px_1fr] items-center gap-3 rounded-lg px-3 text-sm leading-5 font-semibold text-home-brown no-underline transition duration-150 hover:bg-home-action active:bg-home-chip focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            href="/"
            onClick={onClose}
          >
            <Icon className="size-[18px]" name="log-out" />
            <span>Sair</span>
          </a>
        </div>
      </aside>
    </div>
  )
}

function AuthenticatedHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <header className="sticky top-0 z-20 h-20 bg-home-surface shadow-home-header">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-[44px_1fr_76px] items-center gap-4 px-4 min-[375px]:px-7 sm:grid-cols-[52px_1fr_92px] sm:px-8 lg:px-12">
          <button
            aria-controls="authenticated-menu"
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu"
            className={iconButtonClasses}
            onClick={() => setIsMenuOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <Icon className="size-[18px]" name="menu" />
          </button>

          <a className="flex min-w-0 items-center justify-center gap-1.5 text-home-blue no-underline" href="/home">
            <img alt="Brasão da UESPI" className="h-12 w-7 object-contain" src={uespiLogo} />
            <strong className="truncate text-base leading-6 font-bold sm:text-lg">Ouvidoria UESPI</strong>
          </a>

          <div className="flex items-center justify-end gap-1">
            <a aria-label="Buscar" className={iconButtonClasses} href="#buscar-manifestacao">
              <Icon className="size-5" name="search" />
            </a>
            <a aria-label="Notificações" className={iconButtonClasses} href="#notificacoes">
              <Icon className="size-5" name="bell" />
            </a>
          </div>
        </div>
      </header>

      <div id="authenticated-menu">
        <AuthenticatedMenu isOpen={isMenuOpen} onClose={closeMenu} openerRef={menuButtonRef} />
      </div>
    </>
  )
}

export function AuthenticatedAppShell({ children }: AuthenticatedAppShellProps) {
  return (
    <>
      <AuthenticatedHeader />
      {children}
    </>
  )
}
