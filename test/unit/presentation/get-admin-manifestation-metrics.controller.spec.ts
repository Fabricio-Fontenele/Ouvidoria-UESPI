import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AdminManifestationFilters } from '#src/application/repositories/admin-manifestation-filters.js'
import type { ManifestationMetrics } from '#src/application/repositories/manifestations-repository.js'
import type { GetAdminManifestationMetricsUseCase } from '#src/application/use-cases/get-admin-manifestation-metrics/get-admin-manifestation-metrics-use-case.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  GetAdminManifestationMetricsController,
  type GetAdminManifestationMetricsQuery,
} from '#src/presentation/controllers/admin/get-admin-manifestation-metrics.controller.js'
import { InvalidParamError } from '#src/presentation/errors/invalid-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

const metrics: ManifestationMetrics = {
  statusTotals: {
    [ManifestationStatus.IN_ANALYSIS]: 4,
    [ManifestationStatus.AWAITING_UNIT]: 1,
    [ManifestationStatus.ANSWERED]: 2,
    [ManifestationStatus.CANCELED]: 1,
    [ManifestationStatus.FINALIZED]: 5,
  },
  totalItems: 13,
}

type AdminMetricsRequest = HttpRequest<unknown, Record<string, string>, GetAdminManifestationMetricsQuery>

describe('GetAdminManifestationMetricsController', () => {
  let useCase: DeepMockProxy<GetAdminManifestationMetricsUseCase>
  let sut: GetAdminManifestationMetricsController

  const buildRequest = (query: GetAdminManifestationMetricsQuery): AdminMetricsRequest => ({
    body: undefined,
    params: {},
    query,
    headers: {},
    user: { id: 'requester-1', role: UserRole.OMBUDSMAN },
  })

  beforeEach(() => {
    useCase = mockDeep<GetAdminManifestationMetricsUseCase>()
    mockReset(useCase)
    sut = new GetAdminManifestationMetricsController(useCase)
  })

  it('returns 401 and skips the use case when unauthenticated', async () => {
    const { user: _user, ...unauthenticated } = buildRequest({})
    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 200 with empty filters when no query params are present', async () => {
    useCase.execute.mockResolvedValue(metrics)

    const response = await sut.handle(buildRequest({}))

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual(metrics)
    expect(useCase.execute.mock.calls).toStrictEqual([[{ requesterUserId: 'requester-1', filters: {} }]])
  })

  it('parses and forwards every supported filter, scoping onlyMine to the requester', async () => {
    useCase.execute.mockResolvedValue(metrics)

    const response = await sut.handle(
      buildRequest({
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        onlyMine: 'true',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-12-31T23:59:59.000Z',
      }),
    )

    const expectedFilters: AdminManifestationFilters = {
      type: ManifestationType.COMPLAINT,
      campusId: 'campus-1',
      administrativeUnitId: 'unit-1',
      attendantUserId: 'requester-1',
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-12-31T23:59:59.000Z'),
    }

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls).toStrictEqual([[{ requesterUserId: 'requester-1', filters: expectedFilters }]])
  })

  it('does not set attendantUserId when onlyMine is false', async () => {
    useCase.execute.mockResolvedValue(metrics)

    await sut.handle(buildRequest({ onlyMine: 'false' }))

    expect(useCase.execute.mock.calls).toStrictEqual([[{ requesterUserId: 'requester-1', filters: {} }]])
  })

  it('returns 400 for an unknown manifestation type', async () => {
    const response = await sut.handle(buildRequest({ type: 'invalid-type' }))

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidParamError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 for an invalid onlyMine flag', async () => {
    const response = await sut.handle(buildRequest({ onlyMine: 'maybe' }))

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidParamError)
  })

  it('returns 400 for a malformed from date', async () => {
    const response = await sut.handle(buildRequest({ from: '2026-01-01' }))

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidParamError)
  })

  it('returns 400 for a malformed to date', async () => {
    const response = await sut.handle(buildRequest({ to: 'not-a-date' }))

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidParamError)
  })

  it('maps NotAllowedToManageManifestationError to 403', async () => {
    useCase.execute.mockRejectedValue(new NotAllowedToManageManifestationError())

    const response = await sut.handle(buildRequest({}))

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToManageManifestationError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    const unexpected = new Error('db down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(buildRequest({}))

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
