import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'

import { buildGuarapiNewManifestationHref, routes } from '../../app/routes'
import uespiLogo from '../../assets/brasao.png'
import { cx } from '../../utils/cx'
import { Icon, type IconName } from '../icons/icon'

interface AppHeaderProps {
  isAuthenticated?: boolean
}

interface MenuItem {
  href: string
  icon: IconName
  label: string
}

const authenticatedMenuItems: MenuItem[] = [
  { href: routes.home, icon: 'home', label: 'Início' },
  { href: '#buscar-manifestacao', icon: 'file-text', label: 'Minhas manifestações' },
  { href: buildGuarapiNewManifestationHref(), icon: 'plus-circle', label: 'Novo registro' },
  { href: '#notificacoes', icon: 'bell', label: 'Notificações' },
  { href: '#perfil', icon: 'user', label: 'Perfil' },
  { href: '#suporte', icon: 'help', label: 'Suporte' },
  { href: '#configuracoes', icon: 'settings', label: 'Configurações' },
  { href: routes.landing, icon: 'log-out', label: 'Sair' },
]

const publicMenuItems: MenuItem[] = [
  { href: routes.landing, icon: 'home', label: 'Início' },
  { href: '#o-que-e', icon: 'info', label: 'O que é' },
  { href: '#tipos', icon: 'file-text', label: 'Tipos de manifestação' },
  { href: '#como-funciona', icon: 'braces', label: 'Como funciona' },
  { href: routes.guarapi, icon: 'message-circle', label: 'Fale com o Guarapi' },
  { href: routes.login, icon: 'user', label: 'Acessar sistema' },
  { href: '#faq', icon: 'help', label: 'FAQ' },
]

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const iconButtonClasses =
  'grid size-10 place-items-center rounded-full text-login-blue transition duration-150 hover:bg-login-blue/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'

function AppMenuLink({
  href,
  icon,
  isActive = false,
  label,
  onNavigate,
}: MenuItem & { isActive?: boolean; onNavigate: () => void }) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        'grid min-h-12 grid-cols-[22px_1fr] items-center gap-3 rounded-lg px-3 text-sm leading-5 font-semibold no-underline transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue',
        isActive ? 'bg-login-blue text-white' : 'text-login-brown hover:bg-login-field/40 active:bg-login-field',
      )}
      href={href}
      onClick={onNavigate}
    >
      <Icon className="size-[18px]" name={icon} />
      <span>{label}</span>
    </a>
  )
}

function AppSideMenu({
  isAuthenticated,
  isOpen,
  onClose,
  openerRef,
}: {
  isAuthenticated: boolean
  isOpen: boolean
  onClose: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const menuItems = isAuthenticated ? authenticatedMenuItems : publicMenuItems
  const titleId = isAuthenticated ? 'authenticated-project-menu-title' : 'public-project-menu-title'

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

    const focusableElements = event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector)
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
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Fechar menu"
        className="absolute inset-0 cursor-default bg-login-text/35"
        onClick={handleClose}
        type="button"
      />

      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        className="absolute top-0 left-0 flex h-full w-[min(86vw,360px)] flex-col bg-login-surface px-5 pt-5 pb-6 shadow-login-card"
        onKeyDown={handlePanelKeyDown}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <a
            className="flex min-w-0 items-center gap-2 text-login-blue no-underline"
            href={isAuthenticated ? routes.home : routes.landing}
            onClick={onClose}
          >
            <img alt="Brasão da UESPI" className="h-12 w-8 object-contain" src={uespiLogo} />
            <strong className="truncate text-base leading-6 font-bold" id={titleId}>
              Ouvidoria UESPI
            </strong>
          </a>

          <button
            aria-label="Fechar menu"
            className={iconButtonClasses}
            onClick={handleClose}
            ref={closeButtonRef}
            type="button"
          >
            <Icon className="size-5" name="x" />
          </button>
        </div>

        <nav aria-label={isAuthenticated ? 'Menu autenticado' : 'Menu público'} className="mt-8">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <AppMenuLink
                  {...item}
                  isActive={item.href === (isAuthenticated ? routes.home : routes.landing)}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export function AppHeader({ isAuthenticated = false }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <header className="relative z-40 h-22 w-full flex-none bg-login-surface shadow-login-header md:h-24">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-[52px_1fr_40px] items-center gap-3 px-5 min-[361px]:gap-6 min-[361px]:px-[34px] sm:px-8 md:h-22 md:grid-cols-[60px_1fr_52px] lg:px-12">
          <a
            className="justify-self-start"
            href={isAuthenticated ? routes.home : routes.landing}
            aria-label="Página inicial"
          >
            <img
              alt="Brasão da UESPI"
              className="h-[72px] w-[52px] object-contain md:h-20 md:w-[58px]"
              src={uespiLogo}
            />
          </a>
          <strong className="text-center text-lg leading-8 font-bold whitespace-nowrap text-login-blue min-[361px]:text-xl md:text-[22px]">
            Ouvidoria UESPI
          </strong>
          <button
            aria-controls="project-menu"
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu"
            className={cx(iconButtonClasses, 'justify-self-end')}
            onClick={() => setIsMenuOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <Icon className="size-[22px] md:size-6" name="menu" />
          </button>
        </div>
      </header>

      <div id="project-menu">
        <AppSideMenu
          isAuthenticated={isAuthenticated}
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          openerRef={menuButtonRef}
        />
      </div>
    </>
  )
}
