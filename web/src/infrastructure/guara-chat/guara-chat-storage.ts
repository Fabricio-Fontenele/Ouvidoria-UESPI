import type { GuaraChatDraft, GuaraMessage, GuaraMessageAuthor } from '../../application/guara-chat/guara-chat-types'
import { manifestationTypeValues } from '../../application/manifestations/manifestation-type-contract'
import type { ManifestationType } from '../../application/manifestations/manifestation-type-contract'

const GUARA_CHAT_MESSAGES_KEY = 'guara-chat:messages'
const GUARA_PENDING_DRAFT_KEY = 'guara-chat:pending-draft'

const messageAuthors: readonly GuaraMessageAuthor[] = ['guara', 'user']

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    return window.sessionStorage
  } catch {
    return null
  }
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // ignore (quota / private mode)
  }
}

function isManifestationType(value: unknown): value is ManifestationType {
  return typeof value === 'string' && (manifestationTypeValues as readonly string[]).includes(value)
}

function parseMessage(entry: unknown): GuaraMessage | null {
  if (entry === null || typeof entry !== 'object') {
    return null
  }

  const record = entry as Record<string, unknown>

  if (typeof record.id !== 'string' || record.id.length === 0) {
    return null
  }

  if (typeof record.text !== 'string') {
    return null
  }

  if (!messageAuthors.includes(record.author as GuaraMessageAuthor)) {
    return null
  }

  return {
    author: record.author as GuaraMessageAuthor,
    id: record.id,
    text: record.text,
  }
}

function parseDraft(entry: unknown): GuaraChatDraft | null {
  if (entry === null || typeof entry !== 'object') {
    return null
  }

  const record = entry as Record<string, unknown>

  const draft: GuaraChatDraft = {
    administrativeUnitId: typeof record.administrativeUnitId === 'string' ? record.administrativeUnitId : null,
    campusId: typeof record.campusId === 'string' ? record.campusId : null,
    description: typeof record.description === 'string' ? record.description : null,
    involvedPeople: typeof record.involvedPeople === 'string' ? record.involvedPeople : null,
    type: isManifestationType(record.type) ? record.type : null,
  }

  return draft
}

export function readChatMessages(): GuaraMessage[] | null {
  const storage = getStorage()

  if (storage === null) {
    return null
  }

  const raw = storage.getItem(GUARA_CHAT_MESSAGES_KEY)

  if (raw === null) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      safeRemove(storage, GUARA_CHAT_MESSAGES_KEY)
      return null
    }

    const messages: GuaraMessage[] = []

    for (const entry of parsed) {
      const message = parseMessage(entry)

      if (message === null) {
        safeRemove(storage, GUARA_CHAT_MESSAGES_KEY)
        return null
      }

      messages.push(message)
    }

    return messages
  } catch {
    safeRemove(storage, GUARA_CHAT_MESSAGES_KEY)
    return null
  }
}

export function writeChatMessages(messages: GuaraMessage[]): void {
  const storage = getStorage()

  if (storage === null) {
    return
  }

  safeSet(storage, GUARA_CHAT_MESSAGES_KEY, JSON.stringify(messages))
}

export function clearChatMessages(): void {
  const storage = getStorage()

  if (storage === null) {
    return
  }

  safeRemove(storage, GUARA_CHAT_MESSAGES_KEY)
}

export function stashPendingDraft(draft: GuaraChatDraft): void {
  const storage = getStorage()

  if (storage === null) {
    return
  }

  safeSet(storage, GUARA_PENDING_DRAFT_KEY, JSON.stringify(draft))
}

export function consumePendingDraft(): GuaraChatDraft | null {
  const storage = getStorage()

  if (storage === null) {
    return null
  }

  const raw = storage.getItem(GUARA_PENDING_DRAFT_KEY)

  safeRemove(storage, GUARA_PENDING_DRAFT_KEY)

  if (raw === null) {
    return null
  }

  try {
    return parseDraft(JSON.parse(raw))
  } catch {
    return null
  }
}

export function clearPendingDraft(): void {
  const storage = getStorage()

  if (storage === null) {
    return
  }

  safeRemove(storage, GUARA_PENDING_DRAFT_KEY)
}
