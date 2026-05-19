import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { FinalizeManifestationUseCase } from '#src/application/use-cases/finalize-manifestation/finalize-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import {
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
  ManifestationType,
} from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  FinalizeManifestationController,
  type FinalizeManifestationParams,
} from '#src/presentation/controllers/manifestation/finalize-manifestation.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('FinalizeManifestationController', () => {
  let useCase: DeepMockProxy<FinalizeManifestationUseCase>
  let sut: FinalizeManifestationController
  let baseRequest: HttpRequest<unknown, FinalizeManifestationParams>

  beforeEach(() => {
    useCase = mockDeep<FinalizeManifestationUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: undefined,
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    }

    sut = new FinalizeManifestationController(useCase)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      manifestation: {
        id: 'manifestation-1',
        protocol: '2026-0001',
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.FINALIZED,
        campusId: 'campus-1',
        administrativeUnitId: 'unit-1',
        description: 'desc',
        involvedPeople: null,
        authorUserId: 'user-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })
  }

  it('returns 200 with the finalized manifestation when the author owns it', async () => {
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

  it('maps ManifestationStatusTransitionNotAllowedError to 409', async () => {
    useCase.execute.mockRejectedValue(
      new ManifestationStatusTransitionNotAllowedError(ManifestationStatus.CANCELED, ManifestationStatus.FINALIZED),
    )

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)
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
