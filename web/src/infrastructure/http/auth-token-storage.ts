const authTokenStorageKey = 'ouvidoria-uespi-auth-token'

export function getAuthToken(): string | null {
  return window.sessionStorage.getItem(authTokenStorageKey)
}

export function setAuthToken(token: string): void {
  window.sessionStorage.setItem(authTokenStorageKey, token)
}

export function clearAuthToken(): void {
  window.sessionStorage.removeItem(authTokenStorageKey)
}
