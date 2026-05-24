import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { GetAdminManifestationDetailsUseCase } from '#src/application/use-cases/get-admin-manifestation-details/get-admin-manifestation-details-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  GetAdminManifestationDetailsController,
  type GetAdminManifestationDetailsParams,
} from '#src/presentation/controllers/admin/get-admin-manifestation-details.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('GetAdminManifestationDetailsController', () => {
  let useCase: DeepMockProxy<GetAdminManifestationDetailsUseCase>
  let sut: GetAdminManifestationDetailsController
  let baseRequest: HttpRequest<unknown, GetAdminManifestationDetailsParams>

  beforeEach(() => {
    useCase = mockDeep<GetAdminManifestationDetailsUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: undefined,
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'ombudsman-1', role: UserRole.OMBUDSMAN },
    }

    sut = new GetAdminManifestationDetailsController(useCase)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      manifestation: {
        id: 'manifestation-1',
        protocol: '2026-0001',
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        description: 'desc',
        involvedPeople: null,
        authorUserId: 'user-1',
        attendantUserId: null,
        forwardedToUnit: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        history: [],
        messages: [],
        attachments: [],
      },
    })
  }

  it('returns 200 with the manifestation details for an authorized requester', async () => {
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
    })
  })

  it('returns 401 when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with MissingParamError when manifestationId is empty', async () => {
    const response = await sut.handle({
      ...baseRequest,
      params: { manifestationId: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(MissingParamError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps ManifestationNotFoundError to 404', async () => {
    useCase.execute.mockRejectedValue(new ManifestationNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationNotFoundError)
  })

  it('maps NotAllowedToManageManifestationError to 403', async () => {
    useCase.execute.mockRejectedValue(new NotAllowedToManageManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToManageManifestationError)
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
