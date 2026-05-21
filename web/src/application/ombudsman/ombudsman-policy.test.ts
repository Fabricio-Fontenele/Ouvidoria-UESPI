import { describe, expect, it } from 'vitest'

import type { ManifestationDetail } from '../manifestations/manifestation-detail-contract'
import type { ManifestationStatus } from '../manifestations/manifestation-status-contract'

import { canAnswer, canCancel, canFinalize } from './ombudsman-policy'

function buildDetail(status: ManifestationStatus): ManifestationDetail {
  return {
    administrativeUnitId: 'unit-1',
    attachments: [],
    attendantUserId: null,
    authorUserId: 'user-1',
    campusId: 'campus-1',
    createdAt: '2026-05-10T12:00:00.000Z',
    description: 'desc',
    history: [],
    id: 'manifestation-1',
    involvedPeople: null,
    isAnonymous: false,
    messages: [],
    protocol: '2026-0001',
    status,
    type: 'complaint',
  }
}

describe('ombudsman-policy', () => {
  describe('canAnswer', () => {
    it('allows answering while in analysis or already answered', () => {
      expect(canAnswer(buildDetail('in_analysis'))).toBe(true)
      expect(canAnswer(buildDetail('answered'))).toBe(true)
    })

    it('blocks answering after closure', () => {
      expect(canAnswer(buildDetail('finalized'))).toBe(false)
      expect(canAnswer(buildDetail('canceled'))).toBe(false)
    })
  })

  describe('canFinalize', () => {
    it('only allows finalizing after an answer has been registered', () => {
      expect(canFinalize(buildDetail('answered'))).toBe(true)
    })

    it('blocks finalizing from any other status', () => {
      expect(canFinalize(buildDetail('in_analysis'))).toBe(false)
      expect(canFinalize(buildDetail('finalized'))).toBe(false)
      expect(canFinalize(buildDetail('canceled'))).toBe(false)
    })
  })

  describe('canCancel', () => {
    it('allows canceling while still actionable', () => {
      expect(canCancel(buildDetail('in_analysis'))).toBe(true)
      expect(canCancel(buildDetail('answered'))).toBe(true)
    })

    it('blocks canceling after closure', () => {
      expect(canCancel(buildDetail('finalized'))).toBe(false)
      expect(canCancel(buildDetail('canceled'))).toBe(false)
    })
  })
})
