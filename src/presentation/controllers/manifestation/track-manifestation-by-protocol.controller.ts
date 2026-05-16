import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'
import type { TrackManifestationByProtocolUseCase } from '#src/application/use-cases/track-manifestation-by-protocol/track-manifestation-by-protocol-use-case.js'

import { badRequest, notFound, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface TrackManifestationByProtocolBody {
  protocol: string
  accessCode: string
}

export class TrackManifestationByProtocolController extends BaseController {
  constructor(
    private readonly useCase: TrackManifestationByProtocolUseCase,
    private readonly validator: Validator<TrackManifestationByProtocolBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    const result = await this.useCase.execute(validation.data)

    return ok(result)
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationTrackingNotFoundError) {
      return notFound(error)
    }

    return null
  }
}
