import { useState } from 'react'

import { consumePostAuthNotification } from '../../application/auth/post-auth-notification'
import type { PostAuthNotification } from '../../application/auth/post-auth-notification'
import { Icon } from '../icons/icon'

const messages: Record<PostAuthNotification, { body: string; title: string }> = {
  'email-verified': {
    title: 'Email verificado',
    body: 'Sua conta foi confirmada com sucesso.',
  },
  'password-reset': {
    title: 'Senha atualizada',
    body: 'Sua senha foi redefinida com sucesso.',
  },
}

export function DashboardStatusMessage() {
  const [notification] = useState(() => consumePostAuthNotification())

  if (notification === null) {
    return null
  }

  const message = messages[notification]

  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-green-900 shadow-login-card sm:px-5"
      role="status"
    >
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-green-700 text-white">
        <Icon className="size-4" name="check-circle" />
      </span>
      <span>
        <strong className="block text-sm leading-5 font-black">{message.title}</strong>
        <span className="mt-0.5 block text-sm leading-5">{message.body}</span>
      </span>
    </div>
  )
}
