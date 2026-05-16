import type { GetAdminManifestationDetailsUseCase } from '#src/application/use-cases/get-admin-manifestation-details/get-admin-manifestation-details-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { badRequest, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export interface GetAdminManifestationDetailsParams {
  manifestationId: string
}

type GetAdminManifestationDetailsRequest = HttpRequest<unknown, GetAdminManifestationDetailsParams>

export class GetAdminManifestationDetailsController extends BaseController<GetAdminManifestationDetailsRequest> {
  constructor(private readonly useCase: GetAdminManifestationDetailsUseCase) {
    super()
  }

  protected async perform(request: GetAdminManifestationDetailsRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new Error('Authentication required.'))
    }

    const { manifestationId } = request.params

    if (manifestationId.trim() === '') {
      return badRequest(new MissingParamError('manifestationId'))
    }

    const result = await this.useCase.execute({
      requesterUserId: request.user.id,
      manifestationId,
    })

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationNotFoundError) {
      return notFound(error)
    }

    if (error instanceof NotAllowedToManageManifestationError) {
      return forbidden(error)
    }

    return null
  }
}
