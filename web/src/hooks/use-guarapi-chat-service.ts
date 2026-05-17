import { useContext } from 'react'

import { GuarapiChatServiceContext } from '../contexts/guarapi-chat-service-context'

export function useGuarapiChatService() {
  const service = useContext(GuarapiChatServiceContext)

  if (service === null) {
    throw new Error('GuarapiChatServiceProvider is required to use Guarapi chat.')
  }

  return service
}
