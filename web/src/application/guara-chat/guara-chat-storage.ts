import type { GuaraMessage } from './guara-chat-types'

const STORAGE_KEY = 'guara-chat-messages'
const PENDING_DRAFT_KEY = 'guara-pending-draft'

export function readChatMessages(): GuaraMessage[] | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)

  if (raw === null) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed as GuaraMessage[]
  } catch {
    return null
  }
}

export function writeChatMessages(messages: GuaraMessage[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

export function clearChatMessages(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function readPendingDraft(): unknown {
  const raw = sessionStorage.getItem(PENDING_DRAFT_KEY)

  if (raw === null) {
    return null
  }

  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function stashPendingDraft(draft: unknown): void {
  sessionStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(draft))
}

export function clearPendingDraft(): void {
  sessionStorage.removeItem(PENDING_DRAFT_KEY)
}
