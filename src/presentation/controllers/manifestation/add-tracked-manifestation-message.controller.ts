import type { AddTrackedManifestationMessageUseCase } from '#src/application/use-cases/add-tracked-manifestation-message/add-tracked-manifestation-message-use-case.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { ManifestationInteractionNotAllowedError } from '#src/application/use-cases/manifestation-messaging/errors/manifestation-interaction-not-allowed-error.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'

import { badRequest, conflict, created, notFound } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

interface AddTrackedManifestationMessageBody {
  protocol: string
  accessCode: string
  content: string
}

export class AddTrackedManifestationMessageController extends BaseController<
  HttpRequest<AddTrackedManifestationMessageBody>
> {
  constructor(
    private readonly useCase: AddTrackedManifestationMessageUseCase,
    private readonly validator: Validator<AddTrackedManifestationMessageBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest<AddTrackedManifestationMessageBody>): Promise<HttpResponse> {
    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    return created(await this.useCase.execute(validation.data))
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationTrackingNotFoundError) {
      return notFound(error)
    }

    if (error instanceof ManifestationInteractionNotAllowedError) {
      return conflict(error)
    }

    if (error instanceof InvalidManifestationMessageContentError) {
      return badRequest(error)
    }

    return null
  }
}
