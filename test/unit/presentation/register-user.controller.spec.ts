import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { UserAlreadyExistsError } from '#src/application/use-cases/register-user/errors/user-already-exists-error.js'
import type { RegisterUserUseCase } from '#src/application/use-cases/register-user/register-user.use-case.js'
import { UserRole } from '#src/domain/entities/user.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import { InvalidNameError } from '#src/domain/value-objects/name.js'
import { InvalidPasswordError } from '#src/domain/value-objects/password.js'
import {
  RegisterUserController,
  type RegisterUserBody,
} from '#src/presentation/controllers/auth/register-user.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

describe('RegisterUserController', () => {
  let useCase: DeepMockProxy<RegisterUserUseCase>
  let validator: DeepMockProxy<Validator<RegisterUserBody>>
  let sut: RegisterUserController
  let validBody: RegisterUserBody
  let baseRequest: HttpRequest

  beforeEach(() => {
    useCase = mockDeep<RegisterUserUseCase>()
    validator = mockDeep<Validator<RegisterUserBody>>()

    mockReset(useCase)
    mockReset(validator)

    validBody = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'plain-password' }
    baseRequest = { body: validBody, params: {}, query: {}, headers: {} }

    sut = new RegisterUserController(useCase, validator)
  })

  it('returns 201 with the created user when validation succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockResolvedValue({
      user: {
        id: 'user-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: UserRole.MANIFESTANT,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(201)
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

  it('maps UserAlreadyExistsError to 409', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })
    useCase.execute.mockRejectedValue(new UserAlreadyExistsError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(409)
    expect(response.body).toBeInstanceOf(UserAlreadyExistsError)
  })

  it('maps value-object errors (name, email, password) to 400', async () => {
    validator.validate.mockReturnValue({ success: true, data: validBody })

    useCase.execute.mockRejectedValueOnce(new InvalidNameError())
    const nameResponse = await sut.handle(baseRequest)
    expect(nameResponse.statusCode).toBe(400)
    expect(nameResponse.body).toBeInstanceOf(InvalidNameError)

    useCase.execute.mockRejectedValueOnce(new InvalidEmailError())
    const emailResponse = await sut.handle(baseRequest)
    expect(emailResponse.statusCode).toBe(400)
    expect(emailResponse.body).toBeInstanceOf(InvalidEmailError)

    useCase.execute.mockRejectedValueOnce(new InvalidPasswordError())
    const passwordResponse = await sut.handle(baseRequest)
    expect(passwordResponse.statusCode).toBe(400)
    expect(passwordResponse.body).toBeInstanceOf(InvalidPasswordError)
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
