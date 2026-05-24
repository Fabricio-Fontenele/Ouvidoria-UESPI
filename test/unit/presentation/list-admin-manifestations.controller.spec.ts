import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ListAdminManifestationsUseCase } from '#src/application/use-cases/list-admin-manifestations/list-admin-manifestations-use-case.js'
import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  ListAdminManifestationsController,
  type ListAdminManifestationsQuery,
} from '#src/presentation/controllers/admin/list-admin-manifestations.controller.js'
import { InvalidParamError } from '#src/presentation/errors/invalid-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('ListAdminManifestationsController', () => {
  let useCase: DeepMockProxy<ListAdminManifestationsUseCase>
  let sut: ListAdminManifestationsController
  let baseRequest: HttpRequest<unknown, Record<string, string>, ListAdminManifestationsQuery>

  beforeEach(() => {
    useCase = mockDeep<ListAdminManifestationsUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: undefined,
      params: {},
      query: {},
      headers: {},
      user: { id: 'ombudsman-1', role: UserRole.OMBUDSMAN },
    }

    sut = new ListAdminManifestationsController(useCase)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      manifestations: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    })
  }

  it('returns 200 with defaults when the query is empty', async () => {
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      requesterUserId: 'ombudsman-1',
      page: 1,
      filters: {},
    })
  })

  it('parses and forwards all filter parameters', async () => {
    arrangeUseCaseSuccess()

    await sut.handle({
      ...baseRequest,
      query: {
        page: '2',
        status: ManifestationStatus.IN_ANALYSIS,
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-12-31T23:59:59.000Z',
      },
    })

    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      requesterUserId: 'ombudsman-1',
      page: 2,
      filters: {
        status: ManifestationStatus.IN_ANALYSIS,
        type: ManifestationType.COMPLAINT,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-12-31T23:59:59.000Z'),
      },
    })
  })

  it('drops empty string filters from campusId and administrativeUnitId', async () => {
    arrangeUseCaseSuccess()

    await sut.handle({
      ...baseRequest,
      query: { campusId: '', administrativeUnitId: '' },
    })

    expect(useCase.execute.mock.calls[0]?.[0].filters).toStrictEqual({})
  })

  it('returns 401 and skips the use case when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 InvalidPageNumberError for invalid page', async () => {
    const response = await sut.handle({ ...baseRequest, query: { page: '0' } })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidPageNumberError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it.each([
    ['status', { status: 'wrong-status' }],
    ['type', { type: 'wrong-type' }],
    ['from', { from: 'not-a-date' }],
    ['to', { to: '2026-13-99' }],
    ['from', { from: '2026-01-01' }],
    ['to', { to: '2026-12-31T23:59:59Z' }],
  ])('returns 400 InvalidParamError for invalid %s', async (param, query) => {
    const response = await sut.handle({ ...baseRequest, query })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidParamError)
    expect((response.body as InvalidParamError).message).toContain(param)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps NotAllowedToManageManifestationError to 403', async () => {
    useCase.execute.mockRejectedValue(new NotAllowedToManageManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToManageManifestationError)
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
