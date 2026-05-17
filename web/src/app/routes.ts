export const routes = {
  guarapi: '/guarapi',
  home: '/home',
  landing: '/',
  login: '/login',
  manifestation: '/manifestation',
  manifestationForm: '/manifestation-form',
  sign: '/sign',
} as const

export type AppRoute = (typeof routes)[keyof typeof routes]

export function getCurrentPath(pathname = window.location.pathname) {
  const normalizedPath = pathname.replace(/\/$/, '')

  return normalizedPath === '' ? routes.landing : normalizedPath
}

export function getSearchParams(search = window.location.search) {
  return new URLSearchParams(search)
}

export function normalizeProtocol(protocol: string) {
  return protocol.startsWith('#') ? protocol : `#${protocol}`
}

export function protocolForQuery(protocol: string) {
  return protocol.replace('#', '')
}

export function buildGuarapiNewManifestationHref() {
  return `${routes.guarapi}?mode=new`
}

export function buildManifestationDetailsHref(protocol: string) {
  return `${routes.manifestation}?protocol=${protocolForQuery(protocol)}`
}

export function buildManifestationFormHref(protocol?: string | null) {
  if (protocol === undefined || protocol === null) {
    return routes.manifestationForm
  }

  return `${routes.manifestationForm}?protocol=${protocolForQuery(protocol)}`
}
