import { ForwardTargetUnitInactiveError } from '#src/application/use-cases/forward-manifestation-to-unit/errors/forward-target-unit-inactive-error.js'
import { ForwardTargetUnitNotFoundError } from '#src/application/use-cases/forward-manifestation-to-unit/errors/forward-target-unit-not-found-error.js'
import type { ForwardManifestationToUnitUseCase } from '#src/application/use-cases/forward-manifestation-to-unit/forward-manifestation-to-unit-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatusTransitionNotAllowedError } from '#src/domain/entities/manifestation.js'
import { InvalidAdministrativeUnitIdError } from '#src/domain/value-objects/administrative-unit-id.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, conflict, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface ForwardManifestationToUnitBody {
  administrativeUnitId: string
}

export interface ForwardManifestationToUnitParams {
  manifestationId: string
}

type ForwardManifestationToUnitRequest = HttpRequest<unknown, ForwardManifestationToUnitParams>

export class ForwardManifestationToUnitController extends BaseController<ForwardManifestationToUnitRequest> {
  constructor(
    private readonly useCase: ForwardManifestationToUnitUseCase,
    private readonly validator: Validator<ForwardManifestationToUnitBody>,
  ) {
    super()
  }

  protected async perform(request: ForwardManifestationToUnitRequest): Promise<HttpResponse> {
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
      administrativeUnitId: validation.data.administrativeUnitId,
    })

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationNotFoundError || error instanceof ForwardTargetUnitNotFoundError) {
      return notFound(error)
    }

    if (error instanceof NotAllowedToManageManifestationError) {
      return forbidden(error)
    }

    if (
      error instanceof ForwardTargetUnitInactiveError ||
      error instanceof ManifestationStatusTransitionNotAllowedError
    ) {
      return conflict(error)
    }

    if (error instanceof InvalidAdministrativeUnitIdError) {
      return badRequest(error)
    }

    return null
  }
}
