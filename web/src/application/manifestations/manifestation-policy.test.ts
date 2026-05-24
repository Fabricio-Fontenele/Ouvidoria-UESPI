import { describe, expect, it } from 'vitest'

import type { ManifestationDetail, ManifestationHistoryEntry } from './manifestation-detail-contract'
import { canEvaluate, canFinalize, canSendMessage, hasEvaluationRecorded } from './manifestation-policy'
import type { ManifestationStatus } from './manifestation-status-contract'

function buildDetail(overrides: Partial<ManifestationDetail> = {}): ManifestationDetail {
  return {
    administrativeUnitId: 'unit-1',
    attachments: [],
    attendantUserId: null,
    authorUserId: 'user-1',
    campusId: 'campus-1',
    createdAt: '2026-05-01T10:00:00.000Z',
    description: 'Descrição da manifestação para os testes de policy.',
    forwardedToUnit: null,
    history: [],
    id: 'manifestation-1',
    involvedPeople: null,
    isAnonymous: false,
    messages: [],
    protocol: '2026-0001',
    status: 'in_analysis',
    type: 'complaint',
    ...overrides,
  }
}

function evaluationRecordedEntry(): ManifestationHistoryEntry {
  return {
    actorType: 'manifestant',
    actorUserId: 'user-1',
    attendantUserId: 'ombudsman-1',
    createdAt: '2026-05-05T10:00:00.000Z',
    description: 'Atendimento avaliado pelo autor (5/5).',
    fromStatus: null,
    rating: 5,
    toStatus: null,
    type: 'evaluation_recorded',
  }
}

describe('canSendMessage', () => {
  it.each<[ManifestationStatus, boolean]>([
    ['in_analysis', true],
    ['answered', true],
    ['finalized', false],
    ['canceled', false],
  ])('returns %s for status %s', (status, expected) => {
    expect(canSendMessage(buildDetail({ status }))).toBe(expected)
  })
})

describe('canFinalize', () => {
  it.each<[ManifestationStatus, boolean]>([
    ['in_analysis', false],
    ['answered', true],
    ['finalized', false],
    ['canceled', false],
  ])('returns %s for status %s', (status, expected) => {
    expect(canFinalize(buildDetail({ status }))).toBe(expected)
  })
})

describe('hasEvaluationRecorded', () => {
  it('returns false when history has no evaluation entry', () => {
    expect(hasEvaluationRecorded(buildDetail())).toBe(false)
  })

  it('returns true when history has an evaluation_recorded entry', () => {
    expect(hasEvaluationRecorded(buildDetail({ history: [evaluationRecordedEntry()] }))).toBe(true)
  })
})

describe('canEvaluate', () => {
  it('returns true when finalized, attendant assigned, no evaluation yet', () => {
    const detail = buildDetail({ attendantUserId: 'ombudsman-1', status: 'finalized' })
    expect(canEvaluate(detail)).toBe(true)
  })

  it('returns false when status is not finalized', () => {
    const detail = buildDetail({ attendantUserId: 'ombudsman-1', status: 'answered' })
    expect(canEvaluate(detail)).toBe(false)
  })

  it('returns false when there is no attendant', () => {
    expect(canEvaluate(buildDetail({ status: 'finalized' }))).toBe(false)
  })

  it('returns false when evaluation was already recorded', () => {
    const detail = buildDetail({
      attendantUserId: 'ombudsman-1',
      history: [evaluationRecordedEntry()],
      status: 'finalized',
    })
    expect(canEvaluate(detail)).toBe(false)
  })
})
