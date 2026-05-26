import type { CancelManifestationUseCase } from '#src/application/use-cases/cancel-manifestation/cancel-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import {
  type ManifestationCancellationReason,
  CancellationReasonRequiresNoteError,
  ManifestationStatusTransitionNotAllowedError,
} from '#src/domain/entities/manifestation.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, conflict, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface CancelManifestationBody {
  reason: ManifestationCancellationReason
  note?: string
}

export interface CancelManifestationParams {
  manifestationId: string
}

type CancelManifestationRequest = HttpRequest<unknown, CancelManifestationParams>

export class CancelManifestationController extends BaseController<CancelManifestationRequest> {
  constructor(
    private readonly useCase: CancelManifestationUseCase,
    private readonly validator: Validator<CancelManifestationBody>,
  ) {
    super()
  }

  protected async perform(request: CancelManifestationRequest): Promise<HttpResponse> {
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
      reason: validation.data.reason,
      note: validation.data.note ?? null,
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

    if (error instanceof CancellationReasonRequiresNoteError) {
      return badRequest(error)
    }

    if (error instanceof ManifestationStatusTransitionNotAllowedError) {
      return conflict(error)
    }

    return null
  }
}
