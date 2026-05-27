import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationMetrics } from '#src/application/repositories/manifestations-repository.js'
import type { GetUserManifestationMetricsUseCase } from '#src/application/use-cases/get-user-manifestation-metrics/get-user-manifestation-metrics-use-case.js'
import { ManifestationStatus } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import { GetUserManifestationMetricsController } from '#src/presentation/controllers/manifestation/get-user-manifestation-metrics.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

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

describe('GetUserManifestationMetricsController', () => {
  let useCase: DeepMockProxy<GetUserManifestationMetricsUseCase>
  let sut: GetUserManifestationMetricsController
  let authedRequest: HttpRequest<unknown, Record<string, string>, Record<string, string>>

  beforeEach(() => {
    useCase = mockDeep<GetUserManifestationMetricsUseCase>()
    mockReset(useCase)

    authedRequest = {
      body: undefined,
      params: {},
      query: {},
      headers: {},
      user: { id: 'author-1', role: UserRole.MANIFESTANT },
    }

    sut = new GetUserManifestationMetricsController(useCase)
  })

  it('returns 200 with the metrics scoped to the authenticated author', async () => {
    useCase.execute.mockResolvedValue(metrics)

    const response = await sut.handle(authedRequest)

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual(metrics)
    expect(useCase.execute.mock.calls).toStrictEqual([[{ userId: 'author-1' }]])
  })

  it('returns 401 and skips the use case when unauthenticated', async () => {
    const { user: _user, ...unauthenticated } = authedRequest
    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    const unexpected = new Error('db down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(authedRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
