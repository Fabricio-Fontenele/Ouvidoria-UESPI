import type { ResendEmailVerificationCodeUseCase } from '#src/application/use-cases/resend-email-verification-code/resend-email-verification-code-use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'

import { badRequest, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface ResendEmailVerificationCodeBody {
  email: string
}

export class ResendEmailVerificationCodeController extends BaseController {
  constructor(
    private readonly useCase: ResendEmailVerificationCodeUseCase,
    private readonly validator: Validator<ResendEmailVerificationCodeBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    await this.useCase.execute(validation.data)
    return ok({ message: 'If the account exists and is pending verification, a new code was sent.' })
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof InvalidEmailError) {
      return badRequest(error)
    }

    return null
  }
}
