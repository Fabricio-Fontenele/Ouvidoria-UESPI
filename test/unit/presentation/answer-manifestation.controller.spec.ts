import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AnswerManifestationUseCase } from '#src/application/use-cases/answer-manifestation/answer-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import {
  ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
} from '#src/domain/entities/manifestation.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'
import {
  AnswerManifestationController,
  type AnswerManifestationBody,
  type AnswerManifestationParams,
} from '#src/presentation/controllers/admin/answer-manifestation.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('AnswerManifestationController', () => {
  let useCase: DeepMockProxy<AnswerManifestationUseCase>
  let validator: DeepMockProxy<Validator<AnswerManifestationBody>>
  let sut: AnswerManifestationController
  let validBody: AnswerManifestationBody
  let baseRequest: HttpRequest<unknown, AnswerManifestationParams>

  beforeEach(() => {
    useCase = mockDeep<AnswerManifestationUseCase>()
    validator = mockDeep<Validator<AnswerManifestationBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { content: 'A ouvidoria está analisando seu caso.' }
    baseRequest = {
      body: validBody,
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'ombudsman-1', role: 'ombudsman' },
    }

    sut = new AnswerManifestationController(useCase, validator)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      message: {
        id: 'message-1',
        senderUserId: 'ombudsman-1',
        senderType: ManifestationMessageSenderType.OMBUDSMAN,
        content: validBody.content,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })
  }

  it('returns 201 with the persisted answer when validation succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      requesterUserId: 'ombudsman-1',
      manifestationId: 'manifestation-1',
      content: validBody.content,
    })
  })

  it('returns 401 and skips downstream work when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(validator.validate.mock.calls).toHaveLength(0)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with MissingParamError when manifestationId is empty', async () => {
    const response = await sut.handle({
      ...baseRequest,
      params: { manifestationId: '   ' },
    })

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

  it('maps NotAllowedToManageManifestationError to 403', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new NotAllowedToManageManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToManageManifestationError)
  })

  it('maps ManifestationStatusTransitionNotAllowedError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(
      new ManifestationStatusTransitionNotAllowedError(ManifestationStatus.FINALIZED, ManifestationStatus.ANSWERED),
    )

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(ManifestationStatusTransitionNotAllowedError)
  })

  it('maps InvalidManifestationMessageContentError to 400', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new InvalidManifestationMessageContentError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidManifestationMessageContentError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('admin repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
