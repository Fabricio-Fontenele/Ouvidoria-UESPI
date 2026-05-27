import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ConfirmEmailVerificationUseCase } from '#src/application/use-cases/confirm-email-verification/confirm-email-verification-use-case.js'
import { EmailAlreadyVerifiedError } from '#src/application/use-cases/confirm-email-verification/errors/email-already-verified-error.js'
import { EmailVerificationCodeExpiredError } from '#src/application/use-cases/confirm-email-verification/errors/email-verification-code-expired-error.js'
import { InvalidEmailVerificationCodeError } from '#src/application/use-cases/confirm-email-verification/errors/invalid-email-verification-code-error.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import {
  ConfirmEmailVerificationController,
  type ConfirmEmailVerificationBody,
} from '#src/presentation/controllers/auth/confirm-email-verification.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('ConfirmEmailVerificationController', () => {
  let useCase: DeepMockProxy<ConfirmEmailVerificationUseCase>
  let validator: DeepMockProxy<Validator<ConfirmEmailVerificationBody>>
  let sut: ConfirmEmailVerificationController
  let validBody: ConfirmEmailVerificationBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<ConfirmEmailVerificationUseCase>()
    validator = mockDeep<Validator<ConfirmEmailVerificationBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { email: 'user@example.com', code: '123456' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new ConfirmEmailVerificationController(useCase, validator)
  })

  it('returns 200 with the issued token when verification succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({ token: 'jwt-token' })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({ token: 'jwt-token' })
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

  it('maps InvalidEmailVerificationCodeError to 422', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new InvalidEmailVerificationCodeError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(422)
    expect(response.body).toBeInstanceOf(InvalidEmailVerificationCodeError)
  })

  it('maps EmailVerificationCodeExpiredError to 422', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new EmailVerificationCodeExpiredError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(422)
    expect(response.body).toBeInstanceOf(EmailVerificationCodeExpiredError)
  })

  it('maps EmailAlreadyVerifiedError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new EmailAlreadyVerifiedError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(EmailAlreadyVerifiedError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('token signing service down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
