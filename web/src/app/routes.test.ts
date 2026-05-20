import { describe, expect, it } from 'vitest'

import {
  buildEvaluationHref,
  buildManifestationDetailsHref,
  buildManifestationFormHref,
  normalizeProtocol,
  protocolForQuery,
  routes,
} from './routes'

describe('routes', () => {
  describe('protocolForQuery', () => {
    it('strips the leading hash', () => {
      expect(protocolForQuery('#2026-0001')).toBe('2026-0001')
    })

    it('keeps the value unchanged when there is no hash', () => {
      expect(protocolForQuery('2026-0001')).toBe('2026-0001')
    })
  })

  describe('normalizeProtocol', () => {
    it('adds the leading hash when missing', () => {
      expect(normalizeProtocol('2026-0001')).toBe('#2026-0001')
    })

    it('keeps the value unchanged when already prefixed', () => {
      expect(normalizeProtocol('#2026-0001')).toBe('#2026-0001')
    })
  })

  describe('buildManifestationDetailsHref', () => {
    it('builds an URL with the id as query param', () => {
      expect(buildManifestationDetailsHref('abc-123')).toBe(`${routes.manifestation}?id=abc-123`)
    })
  })

  describe('buildEvaluationHref', () => {
    it('builds an URL with the id as query param', () => {
      expect(buildEvaluationHref('abc-123')).toBe(`${routes.evaluation}?id=abc-123`)
    })

    it('returns the base route when id is null or undefined', () => {
      expect(buildEvaluationHref(null)).toBe(routes.evaluation)
      expect(buildEvaluationHref()).toBe(routes.evaluation)
    })
  })

  describe('buildManifestationFormHref', () => {
    it('returns the base route when no protocol is provided', () => {
      expect(buildManifestationFormHref()).toBe(routes.manifestationForm)
      expect(buildManifestationFormHref(null)).toBe(routes.manifestationForm)
    })

    it('strips the hash from the protocol query', () => {
      expect(buildManifestationFormHref('#2026-0001')).toBe(`${routes.manifestationForm}?protocol=2026-0001`)
    })
  })
})
