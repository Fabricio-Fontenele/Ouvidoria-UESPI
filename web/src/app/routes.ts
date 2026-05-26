import type { AuthenticatedUserRole } from '../application/auth/auth-types'

export const routes = {
  evaluation: '/evaluation',
  faq: '/faq',
  guara: '/guara',
  home: '/home',
  landing: '/',
  login: '/login',
  manifestation: '/manifestation',
  manifestationForm: '/manifestation-form',
  ombudsmanManifestation: '/ombudsman/manifestation',
  ombudsmanHome: '/ombudsman/home',
  privacy: '/privacy',
  restrictedLogin: '/acesso-restrito',
  sign: '/sign',
  track: '/track',
} as const

export type AppRoute = (typeof routes)[keyof typeof routes]

export function getCurrentPath(pathname = window.location.pathname) {
  const normalizedPath = pathname.replace(/\/$/, '')

  return normalizedPath === '' ? routes.landing : normalizedPath
}

export function getSearchParams(search = window.location.search) {
  return new URLSearchParams(search)
}

export function navigateTo(href: string) {
  window.location.assign(href)
}

export function replaceWith(href: string) {
  window.location.replace(href)
}

export function getAuthenticatedHomeRoute(role: AuthenticatedUserRole) {
  if (role === 'manifestant') {
    return routes.home
  }

  return routes.ombudsmanHome
}

export function normalizeProtocol(protocol: string) {
  return protocol.startsWith('#') ? protocol : `#${protocol}`
}

export function protocolForQuery(protocol: string) {
  return protocol.replace('#', '')
}

export function buildGuaraNewManifestationHref() {
  return `${routes.guara}?mode=new`
}

export function buildManifestationDetailsHref(id: string) {
  return `${routes.manifestation}?id=${id}`
}

export function buildTrackHref() {
  return routes.track
}

export function buildOmbudsmanManifestationDetailsHref(id: string) {
  return `${routes.ombudsmanManifestation}?id=${id}`
}

export function buildManifestationFormHref(protocol?: string | null) {
  if (protocol === undefined || protocol === null) {
    return routes.manifestationForm
  }

  return `${routes.manifestationForm}?protocol=${protocolForQuery(protocol)}`
}

export function buildEvaluationHref(id?: string | null) {
  if (id === undefined || id === null) {
    return routes.evaluation
  }

  return `${routes.evaluation}?id=${id}`
}
