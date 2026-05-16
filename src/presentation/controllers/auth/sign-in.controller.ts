import { InvalidCredentialsError } from '#src/application/use-cases/signin/errors/invalid-credentials-error.js'
import type { SignInUseCase } from '#src/application/use-cases/signin/sign-in-use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'

import { badRequest, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface SignInBody {
  email: string
  password: string
}

export class SignInController extends BaseController {
  constructor(
    private readonly useCase: SignInUseCase,
    private readonly validator: Validator<SignInBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    const result = await this.useCase.execute(validation.data)

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof InvalidCredentialsError) {
      return unauthorized(error)
    }

    if (error instanceof InvalidEmailError) {
      return badRequest(error)
    }

    return null
  }
}
