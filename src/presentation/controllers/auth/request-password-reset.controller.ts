import type { RequestPasswordResetUseCase } from '#src/application/use-cases/password-reset/request-password-reset-use-case.js'
import { InvalidEmailError } from '#src/domain/value-objects/email.js'

import { badRequest, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface RequestPasswordResetBody {
  email: string
}

export class RequestPasswordResetController extends BaseController {
  constructor(
    private readonly useCase: RequestPasswordResetUseCase,
    private readonly validator: Validator<RequestPasswordResetBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    await this.useCase.execute(validation.data)
    return ok({ message: 'If the account exists, a password reset code was sent.' })
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof InvalidEmailError) {
      return badRequest(error)
    }

    return null
  }
}
