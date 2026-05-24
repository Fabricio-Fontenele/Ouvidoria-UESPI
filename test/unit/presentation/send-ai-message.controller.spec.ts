import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { SendAiMessageUseCase } from '#src/application/use-cases/send-ai-message/send-ai-message-use-case.js'
import { UserRole } from '#src/domain/entities/user.js'
import { AiServiceError } from '#src/infra/ai/ai-service-error.js'
import {
  SendAiMessageController,
  type SendAiMessageBody,
} from '#src/presentation/controllers/ai/send-ai-message.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('SendAiMessageController', () => {
  let useCase: DeepMockProxy<SendAiMessageUseCase>
  let validator: DeepMockProxy<Validator<SendAiMessageBody>>
  let sut: SendAiMessageController
  let validBody: SendAiMessageBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<SendAiMessageUseCase>()
    validator = mockDeep<Validator<SendAiMessageBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = {
      history: [],
      message: 'Quero registrar uma reclamação sobre o serviço.',
    }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new SendAiMessageController(useCase, validator)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 200 with the AI response and forwards userRole=null for anonymous callers', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({
      answer: 'Entendi sua demanda.',
      intent: 'manifestation_candidate',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: ['type', 'campusId', 'administrativeUnitId', 'description'],
      confidence: 0.8,
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({ ...validBody, userRole: null })
  })

  it('forwards the authenticated user role into the use case', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({
      answer: 'ok',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.5,
    })

    const authenticatedRequest: HttpRequest = {
      ...baseRequest,
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    }

    await sut.handle(authenticatedRequest)

    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({ ...validBody, userRole: UserRole.MANIFESTANT })
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 200 with the fallback response and logs the kind when the AI service errors', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    useCase.execute.mockRejectedValue(
      new AiServiceError('timeout', 'ai-api timed out after 30000ms', new Error('TimeoutError')),
    )

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect((response.body as { answer: string }).answer).toContain('dificuldade para responder')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const logged = warnSpy.mock.calls[0]?.[0] as string
    expect(logged).toContain('kind=timeout')
    expect(logged).toContain('cause=TimeoutError')
  })

  it('returns 500 with a ServerError when the AI gateway fails', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('AI gateway unreachable')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
