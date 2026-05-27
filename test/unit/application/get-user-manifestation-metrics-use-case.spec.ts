import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type {
  ManifestationMetrics,
  ManifestationsRepository,
} from '#src/application/repositories/manifestations-repository.js'
import { GetUserManifestationMetricsUseCase } from '#src/application/use-cases/get-user-manifestation-metrics/get-user-manifestation-metrics-use-case.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'

const metrics: ManifestationMetrics = {
  statusTotals: {
    [ManifestationStatus.IN_ANALYSIS]: 1,
    [ManifestationStatus.AWAITING_UNIT]: 0,
    [ManifestationStatus.ANSWERED]: 2,
    [ManifestationStatus.CANCELED]: 0,
    [ManifestationStatus.FINALIZED]: 3,
  },
  totalItems: 6,
}

describe('GetUserManifestationMetricsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let sut: GetUserManifestationMetricsUseCase

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    mockReset(manifestationsRepository)
    sut = new GetUserManifestationMetricsUseCase(manifestationsRepository)
  })

  it('returns the metrics scoped to the requesting author', async () => {
    manifestationsRepository.getMetricsByAuthorUserId.mockResolvedValue(metrics)

    const result = await sut.execute({ userId: 'author-1' })

    expect(manifestationsRepository.getMetricsByAuthorUserId.mock.calls).toStrictEqual([['author-1']])
    expect(result).toStrictEqual(metrics)
  })

  it('propagates repository failures', async () => {
    const failure = new Error('db down')
    manifestationsRepository.getMetricsByAuthorUserId.mockRejectedValue(failure)

    await expect(sut.execute({ userId: 'author-1' })).rejects.toThrow(failure)
  })
})
