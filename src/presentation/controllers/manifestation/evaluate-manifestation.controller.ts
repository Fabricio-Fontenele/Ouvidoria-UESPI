import { ManifestationAlreadyEvaluatedError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-already-evaluated-error.js'
import { ManifestationHasNoAttendantError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-has-no-attendant-error.js'
import { ManifestationNotFinalizedError } from '#src/application/use-cases/evaluate-manifestation/errors/manifestation-not-finalized-error.js'
import type { EvaluateManifestationUseCase } from '#src/application/use-cases/evaluate-manifestation/evaluate-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { InvalidRatingError } from '#src/domain/value-objects/rating.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import {
  badRequest,
  conflict,
  created,
  forbidden,
  notFound,
  unauthorized,
  unprocessableEntity,
} from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface EvaluateManifestationParams {
  manifestationId: string
}

export interface EvaluateManifestationBody {
  rating: number
  comment?: string | null
}

type EvaluateManifestationRequest = HttpRequest<unknown, EvaluateManifestationParams>

export class EvaluateManifestationController extends BaseController<EvaluateManifestationRequest> {
  constructor(
    private readonly useCase: EvaluateManifestationUseCase,
    private readonly validator: Validator<EvaluateManifestationBody>,
  ) {
    super()
  }

  protected async perform(request: EvaluateManifestationRequest): Promise<HttpResponse> {
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
      manifestationId,
      userId: request.user.id,
      rating: validation.data.rating,
      comment: validation.data.comment ?? null,
    })

    return created(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationNotFoundError) {
      return notFound(error)
    }

    if (error instanceof NotAllowedToAccessManifestationError) {
      return forbidden(error)
    }

    if (
      error instanceof ManifestationNotFinalizedError ||
      error instanceof ManifestationHasNoAttendantError ||
      error instanceof ManifestationAlreadyEvaluatedError
    ) {
      return conflict(error)
    }

    if (error instanceof InvalidRatingError) {
      return unprocessableEntity(error)
    }

    return null
  }
}
