import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'

import { buildGuaraNewManifestationHref, getAuthenticatedHomeRoute, navigateTo, routes } from '../../app/routes'
import type { AuthenticatedUser, AuthenticatedUserRole } from '../../application/auth/auth-types'
import uespiLogo from '../../assets/brasao.png'
import { useAuth } from '../../hooks/use-auth'
import { cx } from '../../utils/cx'
import { ConfirmDialog } from '../feedback/confirm-dialog'
import { Icon, type IconName } from '../icons/icon'

interface AppHeaderProps {
  isAuthenticated?: boolean
}

interface MenuItem {
  action?: 'sign-out'
  href: string
  icon: IconName
  label: string
}

interface HeaderNavItem {
  href: string
  label: string
}

interface HeaderAuthItem extends HeaderNavItem {
  icon: IconName
  tone: 'primary' | 'secondary'
}

const publicMenuItems: MenuItem[] = [
  { href: routes.login, icon: 'user', label: 'Login' },
  { href: routes.restrictedLogin, icon: 'lock', label: 'Acesso restrito' },
  { href: routes.landing, icon: 'home', label: 'Início' },
  { href: `${routes.landing}#registro`, icon: 'edit', label: 'Registrar manifestação' },
  { href: `${routes.landing}#consultar-manifestacao`, icon: 'search', label: 'Consultar manifestação' },
  { href: `${routes.landing}#guara`, icon: 'message-circle', label: 'Fale com o Guará' },
  { href: `${routes.landing}#tipos`, icon: 'file-text', label: 'Tipos de manifestação' },
  { href: `${routes.landing}#como-funciona`, icon: 'braces', label: 'Como funciona' },
  { href: `${routes.landing}#o-que-e`, icon: 'info', label: 'O que é' },
  { href: routes.faq, icon: 'help', label: 'FAQ' },
]

const publicHeaderNavItems: HeaderNavItem[] = [
  { href: `${routes.landing}#registro`, label: 'Registrar' },
  { href: routes.track, label: 'Consultar' },
  { href: routes.faq, label: 'FAQ' },
]

const publicHeaderAuthItems: HeaderAuthItem[] = [
  { href: routes.login, icon: 'user', label: 'Login', tone: 'secondary' },
  { href: routes.restrictedLogin, icon: 'lock', label: 'Acesso restrito', tone: 'primary' },
]

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
const iconButtonClasses =
  'grid size-10 place-items-center rounded-full text-login-blue transition duration-150 hover:bg-login-blue/10 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue'
const ratingFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

const roleLabels: Record<AuthenticatedUserRole, string> = {
  admin: 'Administrador',
  manifestant: 'Manifestante',
  ombudsman: 'Ouvidor',
}

function AppMenuLink({
  href,
  icon,
  isActive = false,
  label,
  onNavigate,
}: MenuItem & { isActive?: boolean; onNavigate: () => void }) {
  const handleClick = () => {
    onNavigate()
  }

  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className={cx(
        'grid min-h-12 grid-cols-[22px_1fr] items-center gap-3 rounded-lg px-3 text-sm leading-5 font-semibold no-underline transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue',
        isActive ? 'bg-login-blue text-white' : 'text-login-brown hover:bg-login-field/40 active:bg-login-field',
      )}
      href={href}
      onClick={handleClick}
    >
      <Icon className="size-[18px]" name={icon} />
      <span>{label}</span>
    </a>
  )
}

function AppProfileMenuItem({ user }: { user: AuthenticatedUser | null }) {
  if (user === null) {
    return null
  }

  const displayName = user.name ?? 'Usuário autenticado'
  const displayEmail = user.email ?? 'E-mail não informado'
  const rating = user.attendanceRating
  const ratingText =
    rating === null
      ? null
      : rating.count === 0 || rating.average === null
        ? 'Sem avaliações ainda'
        : `${ratingFormatter.format(rating.average)}/5 em ${rating.count.toString()} avaliação${
            rating.count === 1 ? '' : 'ões'
          }`

  return (
    <section
      aria-label="Perfil autenticado"
      className="relative overflow-hidden rounded-2xl border border-login-blue/10 bg-login-field/55 px-4 py-4 shadow-login-card"
    >
      <div className="absolute -top-10 -right-10 size-28 rounded-full bg-login-blue/10" />
      <div className="absolute -bottom-14 -left-10 size-28 rounded-full bg-login-action/60" />

      <div className="relative grid grid-cols-[48px_1fr] gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-login-blue text-white shadow-login-card">
          <Icon className="size-5" name="user" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] leading-4 font-black tracking-[0.12em] text-login-blue uppercase">Perfil</p>
          <p className="mt-0.5 truncate text-base leading-6 font-black text-login-text">{displayName}</p>
          <p className="truncate text-xs leading-5 text-login-brown">{displayEmail}</p>
          <p className="mt-2 inline-flex rounded-full bg-login-blue/10 px-2.5 py-1 text-[11px] leading-4 font-bold text-login-blue">
            {roleLabels[user.role]}
          </p>
        </div>
      </div>

      {ratingText !== null ? (
        <p className="relative mt-3 rounded-xl bg-login-surface/90 px-3 py-2 text-xs leading-5 font-semibold text-login-brown">
          Atendimento: <span className="font-black text-login-text">{ratingText}</span>
        </p>
      ) : null}
    </section>
  )
}

function AppProfileDropdown({
  isOpen,
  onClose,
  onSignOut,
  openerRef,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  onSignOut: () => Promise<void>
  openerRef: RefObject<HTMLButtonElement | null>
  user: AuthenticatedUser | null
}) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (dropdownRef.current?.contains(target) === true || openerRef.current?.contains(target) === true) {
        return
      }

      onClose()
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        openerRef.current?.focus()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, openerRef])

  if (!isOpen || user === null) {
    return null
  }

  return (
    <div
      className="absolute top-[calc(100%+10px)] right-5 z-50 w-[min(calc(100vw-24px),340px)] overflow-hidden rounded-2xl border border-login-blue/10 bg-login-surface shadow-login-card sm:right-8 lg:right-12"
      ref={dropdownRef}
    >
      <div className="p-3">
        <AppProfileMenuItem user={user} />
      </div>

      <div className="border-t border-login-blue/10 p-2">
        <button
          className="grid min-h-12 w-full grid-cols-[22px_1fr] items-center gap-3 rounded-lg px-3 text-left text-sm leading-5 font-semibold text-login-brown transition duration-150 hover:bg-login-field/60 active:bg-login-field focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue"
          onClick={() => {
            void onSignOut()
          }}
          type="button"
        >
          <Icon className="size-[18px]" name="log-out" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}

function AppSideMenu({
  isOpen,
  onClose,
  openerRef,
}: {
  isOpen: boolean
  onClose: () => void
  openerRef: RefObject<HTMLButtonElement | null>
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const homeHref = routes.landing
  const titleId = 'public-project-menu-title'

  // Monta o menu na própria renderização ao abrir (padrão "ajustar estado durante a
  // renderização" do React), evitando chamar setState de forma síncrona dentro do efeito.
  if (isOpen && !shouldRender) {
    setShouldRender(true)
  }

  useEffect(() => {
    if (isOpen) {
      const animationFrameId = window.requestAnimationFrame(() => {
        setIsMenuVisible(true)
      })

      return () => {
        window.cancelAnimationFrame(animationFrameId)
      }
    }

    // Fechando: dispara a transição de saída no próximo frame e desmonta após ela.
    const animationFrameId = window.requestAnimationFrame(() => {
      setIsMenuVisible(false)
    })
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
    }, 220)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(timeoutId)
    }
  }, [isOpen])

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

  if (!shouldRender) {
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
    <div className={cx('fixed inset-0 z-50', !isMenuVisible && 'pointer-events-none')}>
      <button
        aria-label="Fechar menu"
        className={cx(
          'absolute inset-0 cursor-default bg-login-text/35 transition-opacity duration-200 ease-out',
          isMenuVisible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={handleClose}
        type="button"
      />

      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        className={cx(
          'absolute top-0 right-0 flex h-full w-[min(86vw,360px)] flex-col bg-login-surface px-5 pt-5 pb-6 shadow-login-card transition-transform duration-200 ease-out',
          isMenuVisible ? 'translate-x-0' : 'translate-x-full',
        )}
        onKeyDown={handlePanelKeyDown}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4">
          <a className="flex min-w-0 items-center gap-2 text-login-blue no-underline" href={homeHref} onClick={onClose}>
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

        <nav aria-label="Menu público" className="mt-8 min-h-0 overflow-y-auto pr-1">
          <ul className="space-y-2">
            {publicMenuItems.map((item) => (
              <li key={`${item.label}-${item.href}`}>
                <AppMenuLink {...item} isActive={item.href === homeHref} onNavigate={onClose} />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export function AppHeader({ isAuthenticated = false }: AppHeaderProps) {
  const { signOut, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const role = user?.role ?? null
  const isUserAuthenticated = isAuthenticated || user !== null
  const shouldShowPublicHeaderNav = !isUserAuthenticated
  const homeHref = isUserAuthenticated && role !== null ? getAuthenticatedHomeRoute(role) : routes.landing
  const shouldShowNewRecordAction = isUserAuthenticated && role === 'manifestant'
  const requestSignOut = async () => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
    setIsSignOutDialogOpen(true)
  }
  const handleConfirmSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsMenuOpen(false)
    setIsSignOutDialogOpen(false)
    navigateTo(routes.landing)
  }
  const handleCancelSignOut = () => {
    if (isSigningOut) {
      return
    }

    setIsSignOutDialogOpen(false)
  }

  return (
    <>
      <header className="relative z-40 h-22 w-full flex-none bg-login-surface shadow-login-header md:h-24">
        <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 px-3 min-[361px]:grid-cols-[52px_minmax(0,1fr)_auto] min-[361px]:gap-4 min-[361px]:px-5 sm:gap-6 sm:px-8 md:h-22 md:grid-cols-[60px_minmax(0,1fr)_auto] lg:px-12">
          <a className="justify-self-start" href={homeHref} aria-label="Página inicial">
            <img
              alt="Brasão da UESPI"
              className="h-16 w-11 object-contain min-[361px]:h-[72px] min-[361px]:w-[52px] md:h-20 md:w-[58px]"
              src={uespiLogo}
            />
          </a>
          <strong className="min-w-0 truncate text-left text-base leading-7 font-bold whitespace-nowrap text-login-blue min-[361px]:text-lg sm:text-xl md:text-[22px]">
            Ouvidoria UESPI
          </strong>
          <div className="flex min-w-0 items-center justify-end gap-1 justify-self-end min-[390px]:gap-2">
            {shouldShowPublicHeaderNav ? (
              <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
                {publicHeaderNavItems.map((item) => (
                  <a
                    className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm leading-5 font-bold text-login-brown no-underline transition duration-150 hover:bg-login-blue/10 hover:text-login-blue active:bg-login-field focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue lg:px-4"
                    href={item.href}
                    key={item.label}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : null}
            {!isUserAuthenticated ? (
              <nav aria-label="Acessos" className="hidden items-center gap-2 min-[1180px]:flex">
                {publicHeaderAuthItems.map((item) => (
                  <a
                    className={cx(
                      'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm leading-5 font-bold no-underline transition duration-150 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue',
                      item.tone === 'primary'
                        ? 'bg-login-blue text-white hover:bg-login-blue/90'
                        : 'border border-login-blue/20 text-login-blue hover:bg-login-blue/10',
                    )}
                    href={item.href}
                    key={item.label}
                  >
                    <Icon className="size-4" name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            ) : null}
            {isUserAuthenticated ? (
              <nav aria-label="Navegação autenticada" className="flex items-center gap-1 min-[420px]:gap-2">
                <a
                  className="inline-flex size-9 items-center justify-center rounded-lg text-login-blue no-underline transition duration-150 hover:bg-login-blue/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue min-[390px]:size-10 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm sm:leading-5 sm:font-bold"
                  href={homeHref}
                >
                  <Icon className="size-4" name="home" />
                  <span className="hidden sm:inline">Início</span>
                </a>

                {shouldShowNewRecordAction ? (
                  <a
                    className="inline-flex size-9 items-center justify-center rounded-lg bg-login-blue text-white no-underline transition duration-150 hover:bg-login-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue min-[390px]:size-10 sm:w-auto sm:gap-2 sm:px-4 sm:text-sm sm:leading-5 sm:font-bold"
                    href={buildGuaraNewManifestationHref()}
                  >
                    <Icon className="size-4" name="plus-circle" />
                    <span className="hidden sm:inline">Novo registro</span>
                  </a>
                ) : null}
              </nav>
            ) : null}
            {isUserAuthenticated ? (
              <button
                aria-controls="profile-menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="Abrir perfil"
                className="grid size-9 place-items-center rounded-full bg-login-blue text-white shadow-login-card transition duration-150 hover:bg-login-blue/90 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-login-blue min-[390px]:size-10"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                ref={profileButtonRef}
                type="button"
              >
                <Icon className="size-5" name="user" />
              </button>
            ) : null}
            {!isUserAuthenticated ? (
              <button
                aria-controls="project-menu"
                aria-expanded={isMenuOpen}
                aria-label="Abrir menu"
                className={iconButtonClasses}
                onClick={() => setIsMenuOpen(true)}
                ref={menuButtonRef}
                type="button"
              >
                <Icon className="size-[22px] md:size-6" name="menu" />
              </button>
            ) : null}
          </div>
        </div>
        <div id="profile-menu">
          <AppProfileDropdown
            isOpen={isProfileMenuOpen}
            onClose={() => setIsProfileMenuOpen(false)}
            onSignOut={requestSignOut}
            openerRef={profileButtonRef}
            user={user}
          />
        </div>
      </header>

      {!isUserAuthenticated ? (
        <div id="project-menu">
          <AppSideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} openerRef={menuButtonRef} />
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Continuar conectado"
        confirmingLabel="Saindo..."
        confirmLabel="Sair"
        description="Você precisará entrar novamente para acessar as áreas autenticadas do sistema."
        icon="log-out"
        isConfirming={isSigningOut}
        onCancel={handleCancelSignOut}
        onConfirm={() => {
          void handleConfirmSignOut()
        }}
        open={isSignOutDialogOpen}
        title="Deseja sair da sua conta?"
        tone="danger"
      />
    </>
  )
}
