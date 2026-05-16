import { UserAlreadyExistsError } from '#src/application/use-cases/register-user/errors/user-already-exists-error.js'
import type { RegisterUserUseCase } from '#src/application/use-cases/register-user/register-user.use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'
import { InvalidNameError } from '#src/domain/value-objects/name.js'
import { InvalidPasswordError } from '#src/domain/value-objects/password.js'

import { badRequest, conflict, created } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface RegisterUserBody {
  name: string
  email: string
  password: string
}

export class RegisterUserController extends BaseController {
  constructor(
    private readonly useCase: RegisterUserUseCase,
    private readonly validator: Validator<RegisterUserBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    const result = await this.useCase.execute(validation.data)

    return created(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof UserAlreadyExistsError) {
      return conflict(error)
    }

    if (
      error instanceof InvalidNameError ||
      error instanceof InvalidEmailError ||
      error instanceof InvalidPasswordError
    ) {
      return badRequest(error)
    }

    return null
  }
}
