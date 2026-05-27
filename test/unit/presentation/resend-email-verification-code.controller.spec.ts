import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ResendEmailVerificationCodeUseCase } from '#src/application/use-cases/resend-email-verification-code/resend-email-verification-code-use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import {
  ResendEmailVerificationCodeController,
  type ResendEmailVerificationCodeBody,
} from '#src/presentation/controllers/auth/resend-email-verification-code.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('ResendEmailVerificationCodeController', () => {
  let useCase: DeepMockProxy<ResendEmailVerificationCodeUseCase>
  let validator: DeepMockProxy<Validator<ResendEmailVerificationCodeBody>>
  let sut: ResendEmailVerificationCodeController
  let validBody: ResendEmailVerificationCodeBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<ResendEmailVerificationCodeUseCase>()
    validator = mockDeep<Validator<ResendEmailVerificationCodeBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { email: 'user@example.com' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new ResendEmailVerificationCodeController(useCase, validator)
  })

  it('returns 200 with a neutral message regardless of account state', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({ sent: false })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({
      message: 'If the account exists and is pending verification, a new code was sent.',
    })
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual(validBody)
  })

  it('returns 400 and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps InvalidEmailError to 400', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new InvalidEmailError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidEmailError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('email provider down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
