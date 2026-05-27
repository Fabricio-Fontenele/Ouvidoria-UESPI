const postAuthNotificationKey = 'ouvidoria-uespi-post-auth-notification'

export type PostAuthNotification = 'email-verified' | 'password-reset'

export function savePostAuthNotification(notification: PostAuthNotification): void {
  window.sessionStorage.setItem(postAuthNotificationKey, notification)
}

export function consumePostAuthNotification(): PostAuthNotification | null {
  const value = window.sessionStorage.getItem(postAuthNotificationKey)
  window.sessionStorage.removeItem(postAuthNotificationKey)

  if (value === 'email-verified' || value === 'password-reset') {
    return value
  }

  return null
}
