import type { ConfirmEmailVerificationUseCase } from '#src/application/use-cases/confirm-email-verification/confirm-email-verification-use-case.js'
import { EmailAlreadyVerifiedError } from '#src/application/use-cases/confirm-email-verification/errors/email-already-verified-error.js'
import { EmailVerificationCodeExpiredError } from '#src/application/use-cases/confirm-email-verification/errors/email-verification-code-expired-error.js'
import { InvalidEmailVerificationCodeError } from '#src/application/use-cases/confirm-email-verification/errors/invalid-email-verification-code-error.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'

import { badRequest, conflict, ok, unprocessableEntity } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface ConfirmEmailVerificationBody {
  email: string
  code: string
}

export class ConfirmEmailVerificationController extends BaseController {
  constructor(
    private readonly useCase: ConfirmEmailVerificationUseCase,
    private readonly validator: Validator<ConfirmEmailVerificationBody>,
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
    if (error instanceof InvalidEmailError) {
      return badRequest(error)
    }

    if (error instanceof InvalidEmailVerificationCodeError) {
      return unprocessableEntity(error)
    }

    if (error instanceof EmailVerificationCodeExpiredError) {
      return unprocessableEntity(error)
    }

    if (error instanceof EmailAlreadyVerifiedError) {
      return conflict(error)
    }

    return null
  }
}
