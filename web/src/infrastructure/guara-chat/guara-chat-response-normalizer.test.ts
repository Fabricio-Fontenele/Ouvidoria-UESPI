import { describe, expect, it } from 'vitest'

import { normalizeGuaraChatResponse } from './guara-chat-response-normalizer'

describe('normalizeGuaraChatResponse', () => {
  it('keeps a well-formed payload intact', () => {
    const output = normalizeGuaraChatResponse({
      answer: 'Posso te ajudar a abrir uma denúncia.',
      confidence: 0.7,
      draft: {
        administrativeUnitId: 'unit-1',
        campusId: 'campus-1',
        description: 'Relato.',
        involvedPeople: null,
        type: 'report',
      },
      intent: 'manifestation_draft_ready',
      missingFields: [],
      shouldOpenManifestationDraft: true,
    })

    expect(output.intent).toBe('manifestation_draft_ready')
    expect(output.shouldOpenManifestationDraft).toBe(true)
    expect(output.draft?.type).toBe('report')
    expect(output.confidence).toBe(0.7)
  })

  it('falls back to defaults when input is null or wrong shape', () => {
    const output = normalizeGuaraChatResponse(null)

    expect(output.answer).toBe('')
    expect(output.intent).toBe('unknown')
    expect(output.shouldOpenManifestationDraft).toBe(false)
    expect(output.draft).toBeNull()
    expect(output.missingFields).toEqual([])
    expect(output.confidence).toBeNull()
  })

  it('coerces unknown intent values to "unknown"', () => {
    const output = normalizeGuaraChatResponse({ answer: '', intent: 'bogus-intent' })

    expect(output.intent).toBe('unknown')
  })

  it('clamps confidence outside [0, 1] to null', () => {
    expect(normalizeGuaraChatResponse({ confidence: 1.4 }).confidence).toBeNull()
    expect(normalizeGuaraChatResponse({ confidence: -0.2 }).confidence).toBeNull()
    expect(normalizeGuaraChatResponse({ confidence: 'high' }).confidence).toBeNull()
  })

  it('drops draft fields that are not valid manifestation types', () => {
    const output = normalizeGuaraChatResponse({
      draft: {
        administrativeUnitId: null,
        campusId: null,
        description: null,
        involvedPeople: null,
        type: 'mystery',
      },
    })

    expect(output.draft).toBeNull()
  })

  it('filters missingFields to known keys only', () => {
    const output = normalizeGuaraChatResponse({
      missingFields: ['type', 'random', 'description', 42],
    })

    expect(output.missingFields).toEqual(['type', 'description'])
  })

  it('forces shouldOpenManifestationDraft to false when intent is not draft_ready', () => {
    const output = normalizeGuaraChatResponse({
      draft: {
        administrativeUnitId: 'unit-1',
        campusId: 'campus-1',
        description: 'ok',
        involvedPeople: null,
        type: 'report',
      },
      intent: 'manifestation_candidate',
      missingFields: [],
      shouldOpenManifestationDraft: true,
    })

    expect(output.shouldOpenManifestationDraft).toBe(false)
  })

  it('forces shouldOpenManifestationDraft to false when missingFields is non-empty', () => {
    const output = normalizeGuaraChatResponse({
      draft: {
        administrativeUnitId: 'unit-1',
        campusId: 'campus-1',
        description: 'ok',
        involvedPeople: null,
        type: 'report',
      },
      intent: 'manifestation_draft_ready',
      missingFields: ['description'],
      shouldOpenManifestationDraft: true,
    })

    expect(output.shouldOpenManifestationDraft).toBe(false)
  })
})
