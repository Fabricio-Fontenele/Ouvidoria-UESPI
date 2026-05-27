import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ConfirmPasswordResetCodeUseCase } from '#src/application/use-cases/password-reset/confirm-password-reset-code-use-case.js'
import { InvalidPasswordResetCodeError } from '#src/application/use-cases/password-reset/errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from '#src/application/use-cases/password-reset/errors/password-reset-code-expired-error.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import {
  ConfirmPasswordResetCodeController,
  type ConfirmPasswordResetCodeBody,
} from '#src/presentation/controllers/auth/confirm-password-reset-code.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('ConfirmPasswordResetCodeController', () => {
  let useCase: DeepMockProxy<ConfirmPasswordResetCodeUseCase>
  let validator: DeepMockProxy<Validator<ConfirmPasswordResetCodeBody>>
  let sut: ConfirmPasswordResetCodeController
  let validBody: ConfirmPasswordResetCodeBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<ConfirmPasswordResetCodeUseCase>()
    validator = mockDeep<Validator<ConfirmPasswordResetCodeBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { email: 'user@example.com', code: '123456' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new ConfirmPasswordResetCodeController(useCase, validator)
  })

  it('returns 200 with the use case result when the code is valid', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({ passwordResetAllowed: true })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({ passwordResetAllowed: true })
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

  it('maps InvalidPasswordResetCodeError to 422', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new InvalidPasswordResetCodeError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(422)
    expect(response.body).toBeInstanceOf(InvalidPasswordResetCodeError)
  })

  it('maps PasswordResetCodeExpiredError to 422', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new PasswordResetCodeExpiredError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(422)
    expect(response.body).toBeInstanceOf(PasswordResetCodeExpiredError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    const unexpected = new Error('hash service down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
