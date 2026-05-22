import { describe, expect, it } from 'vitest'

import type { GuaraChatDraft } from '../guara-chat/guara-chat-types'
import {
  getManifestationFormDefaultValues,
  getManifestationFormDefaultValuesFromDraft,
} from './manifestation-form-contract'
import type { CatalogLookup } from './manifestation-form-contract'

const catalog: CatalogLookup = {
  administrativeUnitBelongsToCampus: (campusId, unitId) => campusId === 'campus-1' && unitId === 'unit-1',
  campusExists: (campusId) => campusId === 'campus-1',
}

function buildDraft(overrides: Partial<GuaraChatDraft> = {}): GuaraChatDraft {
  return {
    administrativeUnitId: 'unit-1',
    campusId: 'campus-1',
    description: 'Descrição vinda do Guará',
    involvedPeople: 'Coordenação',
    type: 'report',
    ...overrides,
  }
}

describe('getManifestationFormDefaultValuesFromDraft', () => {
  it('applies all valid fields and forces isAnonymous=true when unauthenticated', () => {
    const defaults = getManifestationFormDefaultValuesFromDraft(buildDraft(), { catalog, isAuthenticated: false })

    expect(defaults).toMatchObject({
      administrativeUnitId: 'unit-1',
      campusId: 'campus-1',
      description: 'Descrição vinda do Guará',
      involvedPeople: 'Coordenação',
      isAnonymous: true,
      type: 'report',
    })
  })

  it('defaults isAnonymous=false when the user is authenticated', () => {
    const defaults = getManifestationFormDefaultValuesFromDraft(buildDraft(), { catalog, isAuthenticated: true })

    expect(defaults.isAnonymous).toBe(false)
  })

  it('falls back to empty string when type is null', () => {
    const fallback = getManifestationFormDefaultValues()
    const defaults = getManifestationFormDefaultValuesFromDraft(buildDraft({ type: null }), {
      catalog,
      isAuthenticated: true,
    })

    expect(defaults.type).toBe(fallback.type)
  })

  it('ignores campusId not present in the catalog and clears the unit too', () => {
    const defaults = getManifestationFormDefaultValuesFromDraft(
      buildDraft({ administrativeUnitId: 'unit-1', campusId: 'campus-x' }),
      { catalog, isAuthenticated: true },
    )

    expect(defaults.campusId).toBe('')
    expect(defaults.administrativeUnitId).toBe('')
  })

  it('keeps campusId but drops administrativeUnitId when the unit does not belong to the campus', () => {
    const defaults = getManifestationFormDefaultValuesFromDraft(
      buildDraft({ administrativeUnitId: 'unit-other', campusId: 'campus-1' }),
      { catalog, isAuthenticated: true },
    )

    expect(defaults.campusId).toBe('campus-1')
    expect(defaults.administrativeUnitId).toBe('')
  })

  it('treats whitespace-only description/involvedPeople as empty', () => {
    const defaults = getManifestationFormDefaultValuesFromDraft(
      buildDraft({ description: '   ', involvedPeople: '' }),
      { catalog, isAuthenticated: true },
    )

    expect(defaults.description).toBe('')
    expect(defaults.involvedPeople).toBe('')
  })
})
