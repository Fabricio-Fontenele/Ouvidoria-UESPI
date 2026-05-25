import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AddTrackedManifestationMessageUseCase } from '#src/application/use-cases/add-tracked-manifestation-message/add-tracked-manifestation-message-use-case.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { ManifestationInteractionNotAllowedError } from '#src/application/use-cases/manifestation-messaging/errors/manifestation-interaction-not-allowed-error.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'
import { AddTrackedManifestationMessageController } from '#src/presentation/controllers/manifestation/add-tracked-manifestation-message.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

interface Body {
  protocol: string
  accessCode: string
  content: string
}

describe('AddTrackedManifestationMessageController', () => {
  let useCase: DeepMockProxy<AddTrackedManifestationMessageUseCase>
  let validator: DeepMockProxy<Validator<Body>>
  let sut: AddTrackedManifestationMessageController
  let baseRequest: HttpRequest<Body>

  beforeEach(() => {
    useCase = mockDeep<AddTrackedManifestationMessageUseCase>()
    validator = mockDeep<Validator<Body>>()

    mockReset(useCase)
    mockReset(validator)

    baseRequest = {
      body: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234', content: 'Poderiam atualizar o andamento?' },
      params: {},
      query: {},
      headers: {},
    }

    sut = new AddTrackedManifestationMessageController(useCase, validator)
  })

  function arrangeUseCaseSuccess(): void {
    useCase.execute.mockResolvedValue({
      message: {
        id: 'message-1',
        senderType: ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT,
        content: baseRequest.body.content,
        createdAt: new Date('2026-05-10T15:00:00.000Z'),
      },
    })
  }

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 201 with the persisted message and forwards the validated data', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    arrangeUseCaseSuccess()

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual(baseRequest.body)
  })

  it('maps ManifestationTrackingNotFoundError to 404', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockRejectedValue(new ManifestationTrackingNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationTrackingNotFoundError)
  })

  it('maps ManifestationInteractionNotAllowedError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockRejectedValue(new ManifestationInteractionNotAllowedError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(ManifestationInteractionNotAllowedError)
  })

  it('maps InvalidManifestationMessageContentError to 400', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockRejectedValue(new InvalidManifestationMessageContentError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidManifestationMessageContentError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    const unexpected = new Error('interactions repository down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
