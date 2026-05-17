import { createContext } from 'react'

import type { GuaraChatService } from '../application/guara-chat/guara-chat-service'

export const GuaraChatServiceContext = createContext<GuaraChatService | null>(null)
