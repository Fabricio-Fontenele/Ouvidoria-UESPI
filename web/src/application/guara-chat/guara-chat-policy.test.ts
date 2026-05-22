import { describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '../auth/auth-types'
import { canApplyDraft, getGuaraChatCapabilities } from './guara-chat-policy'
import type { GuaraChatDraft } from './guara-chat-types'

function buildUser(role: AuthenticatedUser['role']): AuthenticatedUser {
  return { email: null, id: 'user-1', name: null, role }
}

function buildDraft(overrides: Partial<GuaraChatDraft> = {}): GuaraChatDraft {
  return {
    administrativeUnitId: 'unit-1',
    campusId: 'campus-1',
    description: 'Algum relato',
    involvedPeople: null,
    type: 'report',
    ...overrides,
  }
}

describe('getGuaraChatCapabilities', () => {
  it('returns public capabilities for unauthenticated visitors', () => {
    const capabilities = getGuaraChatCapabilities(null)

    expect(capabilities.canAskInstitutionalInfo).toBe(true)
    expect(capabilities.canCreateDraft).toBe(true)
    expect([...capabilities.allowedDraftTypes]).toEqual(['report'])
  })

  it('returns manifestant capabilities for the manifestant role', () => {
    const capabilities = getGuaraChatCapabilities(buildUser('manifestant'))

    expect(capabilities.canCreateDraft).toBe(true)
    expect([...capabilities.allowedDraftTypes]).toEqual(['report', 'complaint', 'suggestion', 'compliment'])
  })

  it('returns administrative capabilities for ombudsman and admin', () => {
    for (const role of ['ombudsman', 'admin'] as const) {
      const capabilities = getGuaraChatCapabilities(buildUser(role))

      expect(capabilities.canAskInstitutionalInfo).toBe(true)
      expect(capabilities.canCreateDraft).toBe(false)
      expect([...capabilities.allowedDraftTypes]).toEqual([])
    }
  })
})

describe('canApplyDraft', () => {
  it('allows drafts of type report when capability permits', () => {
    const capabilities = getGuaraChatCapabilities(null)

    expect(canApplyDraft(capabilities, buildDraft({ type: 'report' }))).toBe(true)
  })

  it('rejects draft when capabilities do not allow creation', () => {
    const capabilities = getGuaraChatCapabilities(buildUser('ombudsman'))

    expect(canApplyDraft(capabilities, buildDraft({ type: 'report' }))).toBe(false)
  })

  it('allows manifestant drafts of any type', () => {
    const capabilities = getGuaraChatCapabilities(buildUser('manifestant'))

    expect(canApplyDraft(capabilities, buildDraft({ type: 'report' }))).toBe(true)
    expect(canApplyDraft(capabilities, buildDraft({ type: 'complaint' }))).toBe(true)
    expect(canApplyDraft(capabilities, buildDraft({ type: 'suggestion' }))).toBe(true)
    expect(canApplyDraft(capabilities, buildDraft({ type: 'compliment' }))).toBe(true)
  })

  it('rejects non-report drafts for anonymous public visitors', () => {
    const capabilities = getGuaraChatCapabilities(null)

    expect(canApplyDraft(capabilities, buildDraft({ type: 'complaint' }))).toBe(false)
    expect(canApplyDraft(capabilities, buildDraft({ type: 'suggestion' }))).toBe(false)
    expect(canApplyDraft(capabilities, buildDraft({ type: 'compliment' }))).toBe(false)
  })

  it('rejects null draft or null type', () => {
    const capabilities = getGuaraChatCapabilities(null)

    expect(canApplyDraft(capabilities, null)).toBe(false)
    expect(canApplyDraft(capabilities, buildDraft({ type: null }))).toBe(false)
  })
})
