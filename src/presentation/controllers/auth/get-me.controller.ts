import { UserNotFoundError } from '#src/application/use-cases/get-me/errors/user-not-found-error.js'
import type { GetMeUseCase } from '#src/application/use-cases/get-me/get-me-use-case.js'

import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export class GetMeController extends BaseController {
  constructor(private readonly useCase: GetMeUseCase) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const result = await this.useCase.execute({ userId: request.user.id })

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof UserNotFoundError) {
      return notFound(error)
    }

    return null
  }
}
