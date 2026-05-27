import type { ConfirmPasswordResetCodeUseCase } from '#src/application/use-cases/password-reset/confirm-password-reset-code-use-case.js'
import { InvalidPasswordResetCodeError } from '#src/application/use-cases/password-reset/errors/invalid-password-reset-code-error.js'
import { PasswordResetCodeExpiredError } from '#src/application/use-cases/password-reset/errors/password-reset-code-expired-error.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'

import { badRequest, ok, unprocessableEntity } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface ConfirmPasswordResetCodeBody {
  email: string
  code: string
}

export class ConfirmPasswordResetCodeController extends BaseController {
  constructor(
    private readonly useCase: ConfirmPasswordResetCodeUseCase,
    private readonly validator: Validator<ConfirmPasswordResetCodeBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    return ok(await this.useCase.execute(validation.data))
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof InvalidEmailError) {
      return badRequest(error)
    }

    if (error instanceof InvalidPasswordResetCodeError || error instanceof PasswordResetCodeExpiredError) {
      return unprocessableEntity(error)
    }

    return null
  }
}
