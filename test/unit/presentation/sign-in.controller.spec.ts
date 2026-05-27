import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { EmailNotVerifiedError } from '#src/application/use-cases/signin/errors/email-not-verified-error.js'
import { InvalidCredentialsError } from '#src/application/use-cases/signin/errors/invalid-credentials-error.js'
import type { SignInUseCase } from '#src/application/use-cases/signin/sign-in-use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import { SignInController, type SignInBody } from '#src/presentation/controllers/auth/sign-in.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('SignInController', () => {
  let useCase: DeepMockProxy<SignInUseCase>
  let validator: DeepMockProxy<Validator<SignInBody>>
  let sut: SignInController
  let validBody: SignInBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<SignInUseCase>()
    validator = mockDeep<Validator<SignInBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { email: 'user@example.com', password: 'plain-password' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new SignInController(useCase, validator)
  })

  it('returns 200 with the issued token when validation and authentication succeed', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({ token: 'jwt-token' })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({ token: 'jwt-token' })
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual(validBody)
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('maps InvalidCredentialsError to 401', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new InvalidCredentialsError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(InvalidCredentialsError)
  })

  it('maps EmailNotVerifiedError to 403', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new EmailNotVerifiedError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(EmailNotVerifiedError)
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
    const unexpected = new Error('token signing service down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
