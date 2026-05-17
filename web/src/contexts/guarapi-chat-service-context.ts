import { createContext } from 'react'

import type { GuarapiChatService } from '../application/guarapi-chat/guarapi-chat-service'

export const GuarapiChatServiceContext = createContext<GuarapiChatService | null>(null)
