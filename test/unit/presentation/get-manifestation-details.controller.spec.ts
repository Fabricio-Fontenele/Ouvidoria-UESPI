import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { GetManifestationDetailsUseCase } from '#src/application/use-cases/get-manifestation-details/get-manifestation-details-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  GetManifestationDetailsController,
  type GetManifestationDetailsParams,
} from '#src/presentation/controllers/manifestation/get-manifestation-details.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('GetManifestationDetailsController', () => {
  let useCase: DeepMockProxy<GetManifestationDetailsUseCase>
  let sut: GetManifestationDetailsController
  let baseRequest: HttpRequest<unknown, GetManifestationDetailsParams>

  beforeEach(() => {
    useCase = mockDeep<GetManifestationDetailsUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: undefined,
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    }

    sut = new GetManifestationDetailsController(useCase)
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
        attendantUserId: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        history: [],
        messages: [],
        attachments: [],
      },
    })
  }

  it('returns 200 with the manifestation details when the user owns it', async () => {
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      manifestationId: 'manifestation-1',
      userId: 'user-1',
    })
  })

  it('returns 401 and skips the use case when the request has no authenticated user', async () => {
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

  it('maps NotAllowedToAccessManifestationError to 403', async () => {
    useCase.execute.mockRejectedValue(new NotAllowedToAccessManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToAccessManifestationError)
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
