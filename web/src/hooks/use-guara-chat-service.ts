import { useContext } from 'react'

import { GuaraChatServiceContext } from '../contexts/guara-chat-service-context'

export function useGuaraChatService() {
  const service = useContext(GuaraChatServiceContext)

  if (service === null) {
    throw new Error('GuaraChatServiceProvider is required to use Guará chat.')
  }

  return service
}
