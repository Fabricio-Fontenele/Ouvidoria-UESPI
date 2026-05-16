import type { FinalizeManifestationUseCase } from '#src/application/use-cases/finalize-manifestation/finalize-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { ManifestationStatusTransitionNotAllowedError } from '#src/domain/entities/manifestation.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { badRequest, conflict, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

export interface FinalizeManifestationParams {
  manifestationId: string
}

type FinalizeManifestationRequest = HttpRequest<unknown, FinalizeManifestationParams>

export class FinalizeManifestationController extends BaseController<FinalizeManifestationRequest> {
  constructor(private readonly useCase: FinalizeManifestationUseCase) {
    super()
  }

  protected async perform(request: FinalizeManifestationRequest): Promise<HttpResponse> {
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

    if (error instanceof ManifestationStatusTransitionNotAllowedError) {
      return conflict(error)
    }

    return null
  }
}
