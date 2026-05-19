import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import type { ListUserManifestationsUseCase } from '#src/application/use-cases/list-user-manifestations/list-user-manifestations-use-case.js'

import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export interface ListUserManifestationsQuery {
  page?: string
}

type ListUserManifestationsRequest = HttpRequest<unknown, Record<string, string>, ListUserManifestationsQuery>

const POSITIVE_INTEGER = /^[1-9]\d*$/

export class ListUserManifestationsController extends BaseController<ListUserManifestationsRequest> {
  constructor(private readonly useCase: ListUserManifestationsUseCase) {
    super()
  }

  protected async perform(request: ListUserManifestationsRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const rawPage = request.query.page

    if (rawPage !== undefined && !POSITIVE_INTEGER.test(rawPage)) {
      return badRequest(new InvalidPageNumberError())
    }

    const page = rawPage === undefined ? 1 : Number.parseInt(rawPage, 10)

    const result = await this.useCase.execute({
      userId: request.user.id,
      page,
    })

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof InvalidPageNumberError) {
      return badRequest(error)
    }

    return null
  }
}
