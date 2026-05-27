import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { InvalidPasswordResetCodeError } from '#src/application/use-cases/password-reset/errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from '#src/application/use-cases/password-reset/errors/password-reset-code-expired-error.js'
import type { ResetPasswordUseCase } from '#src/application/use-cases/password-reset/reset-password-use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import { InvalidPasswordError } from '#src/domain/value-objects/password.js'
import {
  ResetPasswordController,
  type ResetPasswordBody,
} from '#src/presentation/controllers/auth/reset-password.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('ResetPasswordController', () => {
  let useCase: DeepMockProxy<ResetPasswordUseCase>
  let validator: DeepMockProxy<Validator<ResetPasswordBody>>
  let sut: ResetPasswordController
  let validBody: ResetPasswordBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<ResetPasswordUseCase>()
    validator = mockDeep<Validator<ResetPasswordBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { email: 'user@example.com', code: '123456', password: 'NewPass123' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new ResetPasswordController(useCase, validator)
  })

  it('returns 200 with the issued token when the reset succeeds', async () => {
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

  it('maps InvalidPasswordError to 400', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new InvalidPasswordError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(InvalidPasswordError)
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
    const unexpected = new Error('token signing service down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
