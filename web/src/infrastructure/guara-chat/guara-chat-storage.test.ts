import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { GuaraChatDraft, GuaraMessage } from '../../application/guara-chat/guara-chat-types'
import {
  clearChatMessages,
  clearPendingDraft,
  consumePendingDraft,
  readChatMessages,
  stashPendingDraft,
  writeChatMessages,
} from './guara-chat-storage'

const GUARA_CHAT_MESSAGES_KEY = 'guara-chat:messages'
const GUARA_PENDING_DRAFT_KEY = 'guara-chat:pending-draft'

interface MemoryStorage {
  storage: Map<string, string>
  getItem: ReturnType<typeof vi.fn>
  removeItem: ReturnType<typeof vi.fn>
  setItem: ReturnType<typeof vi.fn>
}

function createMemoryStorage(): MemoryStorage {
  const storage = new Map<string, string>()

  return {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      storage.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value)
    }),
    storage,
  }
}

describe('guara-chat-storage', () => {
  let memory: MemoryStorage

  beforeEach(() => {
    memory = createMemoryStorage()
    vi.stubGlobal('window', { sessionStorage: memory })
  })

  it('writes and reads chat messages preserving the order', () => {
    const messages: GuaraMessage[] = [
      { author: 'guara', id: 'a', text: 'Olá!' },
      { author: 'user', id: 'b', text: 'Bom dia' },
    ]

    writeChatMessages(messages)

    expect(readChatMessages()).toEqual(messages)
  })

  it('returns null and clears storage when payload is malformed JSON', () => {
    memory.storage.set(GUARA_CHAT_MESSAGES_KEY, '{not json')

    expect(readChatMessages()).toBeNull()
    expect(memory.storage.has(GUARA_CHAT_MESSAGES_KEY)).toBe(false)
  })

  it('returns null when an entry fails the shape check and clears storage', () => {
    memory.storage.set(GUARA_CHAT_MESSAGES_KEY, JSON.stringify([{ author: 'system', id: 'x', text: 'hi' }]))

    expect(readChatMessages()).toBeNull()
    expect(memory.storage.has(GUARA_CHAT_MESSAGES_KEY)).toBe(false)
  })

  it('clearChatMessages removes the chat key without touching the draft key', () => {
    memory.storage.set(GUARA_CHAT_MESSAGES_KEY, '[]')
    memory.storage.set(GUARA_PENDING_DRAFT_KEY, '{}')

    clearChatMessages()

    expect(memory.storage.has(GUARA_CHAT_MESSAGES_KEY)).toBe(false)
    expect(memory.storage.has(GUARA_PENDING_DRAFT_KEY)).toBe(true)
  })

  it('stashPendingDraft + consumePendingDraft round-trips and deletes the key', () => {
    const draft: GuaraChatDraft = {
      administrativeUnitId: 'unit-1',
      campusId: 'campus-1',
      description: 'Relato',
      involvedPeople: null,
      type: 'report',
    }

    stashPendingDraft(draft)
    expect(memory.storage.has(GUARA_PENDING_DRAFT_KEY)).toBe(true)

    expect(consumePendingDraft()).toEqual(draft)
    expect(memory.storage.has(GUARA_PENDING_DRAFT_KEY)).toBe(false)
  })

  it('consumePendingDraft narrows invalid type to null and still consumes the key', () => {
    memory.storage.set(
      GUARA_PENDING_DRAFT_KEY,
      JSON.stringify({
        administrativeUnitId: 'u',
        campusId: 'c',
        description: 'd',
        involvedPeople: null,
        type: 'bogus',
      }),
    )

    const draft = consumePendingDraft()

    expect(draft).not.toBeNull()
    expect(draft?.type).toBeNull()
    expect(memory.storage.has(GUARA_PENDING_DRAFT_KEY)).toBe(false)
  })

  it('consumePendingDraft returns null when storage is empty', () => {
    expect(consumePendingDraft()).toBeNull()
  })

  it('clearPendingDraft only removes the draft key', () => {
    memory.storage.set(GUARA_CHAT_MESSAGES_KEY, '[]')
    memory.storage.set(GUARA_PENDING_DRAFT_KEY, '{}')

    clearPendingDraft()

    expect(memory.storage.has(GUARA_CHAT_MESSAGES_KEY)).toBe(true)
    expect(memory.storage.has(GUARA_PENDING_DRAFT_KEY)).toBe(false)
  })
})
