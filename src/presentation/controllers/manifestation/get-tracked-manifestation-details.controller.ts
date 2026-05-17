import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import type { GetTrackedManifestationDetailsUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-details-use-case.js'

import { badRequest, notFound, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

interface GetTrackedManifestationDetailsBody {
  protocol: string
  accessCode: string
}

export class GetTrackedManifestationDetailsController extends BaseController<
  HttpRequest<GetTrackedManifestationDetailsBody>
> {
  constructor(
    private readonly useCase: GetTrackedManifestationDetailsUseCase,
    private readonly validator: Validator<GetTrackedManifestationDetailsBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest<GetTrackedManifestationDetailsBody>): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    return ok(await this.useCase.execute(validation.data))
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationTrackingNotFoundError) {
      return notFound(error)
    }

    return null
  }
}
