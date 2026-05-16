import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import type { UpdateManifestationStatusUseCase } from '#src/application/use-cases/update-manifestation-status/update-manifestation-status-use-case.js'
import {
  type ManifestationStatus,
  ManifestationStatusTransitionNotAllowedError,
} from '#src/domain/entities/manifestation.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, conflict, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface UpdateManifestationStatusBody {
  status: ManifestationStatus
}

export interface UpdateManifestationStatusParams {
  manifestationId: string
}

type UpdateManifestationStatusRequest = HttpRequest<unknown, UpdateManifestationStatusParams>

export class UpdateManifestationStatusController extends BaseController<UpdateManifestationStatusRequest> {
  constructor(
    private readonly useCase: UpdateManifestationStatusUseCase,
    private readonly validator: Validator<UpdateManifestationStatusBody>,
  ) {
    super()
  }

  protected async perform(request: UpdateManifestationStatusRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const { manifestationId } = request.params

    if (manifestationId.trim() === '') {
      return badRequest(new MissingParamError('manifestationId'))
    }

    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    const result = await this.useCase.execute({
      requesterUserId: request.user.id,
      manifestationId,
      status: validation.data.status,
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

    if (error instanceof ManifestationStatusTransitionNotAllowedError) {
      return conflict(error)
    }

    return null
  }
}
