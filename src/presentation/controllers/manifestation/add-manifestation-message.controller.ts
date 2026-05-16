import type { AddManifestationMessageUseCase } from '#src/application/use-cases/add-manifestation-message/add-manifestation-message-use-case.js'
import { ManifestationInteractionNotAllowedError } from '#src/application/use-cases/add-manifestation-message/errors/manifestation-interaction-not-allowed-error.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, conflict, created, forbidden, notFound, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface AddManifestationMessageBody {
  content: string
}

export interface AddManifestationMessageParams {
  manifestationId: string
}

type AddManifestationMessageRequest = HttpRequest<unknown, AddManifestationMessageParams>

export class AddManifestationMessageController extends BaseController<AddManifestationMessageRequest> {
  constructor(
    private readonly useCase: AddManifestationMessageUseCase,
    private readonly validator: Validator<AddManifestationMessageBody>,
  ) {
    super()
  }

  protected async perform(request: AddManifestationMessageRequest): Promise<HttpResponse> {
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
      content: validation.data.content,
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

    if (error instanceof ManifestationInteractionNotAllowedError) {
      return conflict(error)
    }

    if (error instanceof InvalidManifestationMessageContentError) {
      return badRequest(error)
    }

    return null
  }
}
