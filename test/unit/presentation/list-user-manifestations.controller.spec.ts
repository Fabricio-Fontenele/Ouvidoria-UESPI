import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import type { ListUserManifestationsUseCase } from '#src/application/use-cases/list-user-manifestations/list-user-manifestations-use-case.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  ListUserManifestationsController,
  type ListUserManifestationsQuery,
} from '#src/presentation/controllers/manifestation/list-user-manifestations.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('ListUserManifestationsController', () => {
  let useCase: DeepMockProxy<ListUserManifestationsUseCase>
  let sut: ListUserManifestationsController
  let baseRequest: HttpRequest<unknown, Record<string, string>, ListUserManifestationsQuery>

  beforeEach(() => {
    useCase = mockDeep<ListUserManifestationsUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: undefined,
      params: {},
      query: {},
      headers: {},
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    }

    sut = new ListUserManifestationsController(useCase)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      manifestations: [
        {
          id: 'manifestation-1',
          protocol: '2026-0001',
          type: ManifestationType.COMPLAINT,
          status: ManifestationStatus.IN_ANALYSIS,
          campusId: 'campus-1',
          administrativeUnitId: 'unit-1',
          description: 'desc',
          authorUserId: 'user-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      page: 1,
      pageSize: 3,
      statusTotals: {
        answered: 0,
        awaiting_unit: 0,
        canceled: 0,
        finalized: 0,
        in_analysis: 1,
      },
      totalItems: 1,
      totalPages: 1,
    })
  }

  it('returns 200 and defaults page to 1 when the query has no page', async () => {
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({ userId: 'user-1', page: 1 })
  })

  it('parses a valid page string from the query', async () => {
    arrangeUseCaseSuccess()

    await sut.handle({ ...baseRequest, query: { page: '3' } })

    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({ userId: 'user-1', page: 3 })
  })

  it('returns 401 and skips the use case when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it.each([
    ['zero', '0'],
    ['negative', '-1'],
    ['non-numeric', 'abc'],
    ['decimal', '1.5'],
    ['trailing garbage', '2abc'],
    ['empty string', ''],
  ])('returns 400 InvalidPageNumberError for %s page query', async (_label, raw) => {
    const response = await sut.handle({ ...baseRequest, query: { page: raw } })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidPageNumberError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps InvalidPageNumberError thrown by the use case to 400', async () => {
    useCase.execute.mockRejectedValue(new InvalidPageNumberError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidPageNumberError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    const unexpected = new Error('repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
