import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AddManifestationMessageUseCase } from '#src/application/use-cases/add-manifestation-message/add-manifestation-message-use-case.js'
import { ManifestationInteractionNotAllowedError } from '#src/application/use-cases/add-manifestation-message/errors/manifestation-interaction-not-allowed-error.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'
import {
  AddManifestationMessageController,
  type AddManifestationMessageBody,
  type AddManifestationMessageParams,
} from '#src/presentation/controllers/manifestation/add-manifestation-message.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('AddManifestationMessageController', () => {
  let useCase: DeepMockProxy<AddManifestationMessageUseCase>
  let validator: DeepMockProxy<Validator<AddManifestationMessageBody>>
  let sut: AddManifestationMessageController
  let validBody: AddManifestationMessageBody
  let baseRequest: HttpRequest<unknown, AddManifestationMessageParams>

  beforeEach(() => {
    useCase = mockDeep<AddManifestationMessageUseCase>()
    validator = mockDeep<Validator<AddManifestationMessageBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { content: 'Poderiam compartilhar uma atualização do andamento?' }
    baseRequest = {
      body: validBody,
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'user-1', role: 'manifestant' },
    }

    sut = new AddManifestationMessageController(useCase, validator)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      message: {
        id: 'message-1',
        senderUserId: 'user-1',
        senderType: ManifestationMessageSenderType.MANIFESTANT,
        content: validBody.content,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })
  }

  it('returns 201 with the persisted message when validation succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      manifestationId: 'manifestation-1',
      userId: 'user-1',
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

  it('maps NotAllowedToAccessManifestationError to 403', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new NotAllowedToAccessManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it('maps ManifestationInteractionNotAllowedError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new ManifestationInteractionNotAllowedError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(ManifestationInteractionNotAllowedError)
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
    const unexpected = new Error('interactions repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
