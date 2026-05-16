import type { GetManifestationDetailsUseCase } from '#src/application/use-cases/get-manifestation-details/get-manifestation-details-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { badRequest, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export interface GetManifestationDetailsParams {
  manifestationId: string
}

type GetManifestationDetailsRequest = HttpRequest<unknown, GetManifestationDetailsParams>

export class GetManifestationDetailsController extends BaseController<GetManifestationDetailsRequest> {
  constructor(private readonly useCase: GetManifestationDetailsUseCase) {
    super()
  }

  protected async perform(request: GetManifestationDetailsRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new Error('Authentication required.'))
    }

    const { manifestationId } = request.params

    if (manifestationId.trim() === '') {
      return badRequest(new MissingParamError('manifestationId'))
    }

    const result = await this.useCase.execute({
      manifestationId,
      userId: request.user.id,
    })

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationNotFoundError) {
      return notFound(error)
    }

    if (error instanceof NotAllowedToAccessManifestationError) {
      return forbidden(error)
    }

    return null
  }
}
