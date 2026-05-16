import type { AnswerManifestationUseCase } from '#src/application/use-cases/answer-manifestation/answer-manifestation-use-case.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { ManifestationStatusTransitionNotAllowedError } from '#src/domain/entities/manifestation.js'
import { InvalidManifestationMessageContentError } from '#src/domain/value-objects/manifestation-message-content.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { badRequest, conflict, created, forbidden, notFound, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

export interface AnswerManifestationBody {
  content: string
}

export interface AnswerManifestationParams {
  manifestationId: string
}

type AnswerManifestationRequest = HttpRequest<unknown, AnswerManifestationParams>

export class AnswerManifestationController extends BaseController<AnswerManifestationRequest> {
  constructor(
    private readonly useCase: AnswerManifestationUseCase,
    private readonly validator: Validator<AnswerManifestationBody>,
  ) {
    super()
  }

  protected async perform(request: AnswerManifestationRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new Error('Authentication required.'))
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
      content: validation.data.content,
    })

    return created(result)
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

    if (error instanceof InvalidManifestationMessageContentError) {
      return badRequest(error)
    }

    return null
  }
}
