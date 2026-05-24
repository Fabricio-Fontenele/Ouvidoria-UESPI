import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { ForwardTargetUnitInactiveError } from '#src/application/use-cases/forward-manifestation-to-unit/errors/forward-target-unit-inactive-error.js'
import { ForwardTargetUnitNotFoundError } from '#src/application/use-cases/forward-manifestation-to-unit/errors/forward-target-unit-not-found-error.js'
import type { ForwardManifestationToUnitUseCase } from '#src/application/use-cases/forward-manifestation-to-unit/forward-manifestation-to-unit-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import {
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
} from '#src/domain/entities/manifestation.js'
import { UserRole } from '#src/domain/entities/user.js'
import {
  ForwardManifestationToUnitController,
  type ForwardManifestationToUnitBody,
  type ForwardManifestationToUnitParams,
} from '#src/presentation/controllers/admin/forward-manifestation-to-unit.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('ForwardManifestationToUnitController', () => {
  let useCase: DeepMockProxy<ForwardManifestationToUnitUseCase>
  let validator: DeepMockProxy<Validator<ForwardManifestationToUnitBody>>
  let sut: ForwardManifestationToUnitController
  let validBody: ForwardManifestationToUnitBody
  let baseRequest: HttpRequest<unknown, ForwardManifestationToUnitParams>

  beforeEach(() => {
    useCase = mockDeep<ForwardManifestationToUnitUseCase>()
    validator = mockDeep<Validator<ForwardManifestationToUnitBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { administrativeUnitId: 'unit-2' }
    baseRequest = {
      body: validBody,
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'ombudsman-1', role: UserRole.OMBUDSMAN },
    }

    sut = new ForwardManifestationToUnitController(useCase, validator)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      manifestation: {
        id: 'manifestation-1',
        status: ManifestationStatus.AWAITING_UNIT,
        forwardedToUnit: { id: 'unit-2', name: 'Coordenação de TI' },
      },
    })
  }

  it('returns 200 with the forwarded manifestation when validation succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      administrativeUnitId: 'unit-2',
    })
  })

  it('returns 401 and skips downstream work when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(validator.validate.mock.calls).toHaveLength(0)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with MissingParamError when manifestationId is empty', async () => {
    const response = await sut.handle({ ...baseRequest, params: { manifestationId: '   ' } })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(MissingParamError)
    expect(validator.validate.mock.calls).toHaveLength(0)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps ManifestationNotFoundError to 404', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new ManifestationNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationNotFoundError)
  })

  it('maps ForwardTargetUnitNotFoundError to 404', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new ForwardTargetUnitNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ForwardTargetUnitNotFoundError)
  })

  it('maps NotAllowedToManageManifestationError to 403', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new NotAllowedToManageManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToManageManifestationError)
  })

  it('maps ForwardTargetUnitInactiveError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new ForwardTargetUnitInactiveError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(ForwardTargetUnitInactiveError)
  })

  it('maps ManifestationStatusTransitionNotAllowedError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(
      new ManifestationStatusTransitionNotAllowedError(
        ManifestationStatus.FINALIZED,
        ManifestationStatus.AWAITING_UNIT,
      ),
    )

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
