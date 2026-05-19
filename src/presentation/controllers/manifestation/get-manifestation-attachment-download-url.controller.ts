import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { AttachmentNotFoundError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-not-found-error.js'
import type { GetManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-manifestation-attachment-download-url-use-case.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

interface GetManifestationAttachmentDownloadUrlParams {
  manifestationId: string
  attachmentId: string
}

type GetManifestationAttachmentDownloadUrlRequest = HttpRequest<unknown, GetManifestationAttachmentDownloadUrlParams>

export class GetManifestationAttachmentDownloadUrlController extends BaseController<GetManifestationAttachmentDownloadUrlRequest> {
  constructor(private readonly useCase: GetManifestationAttachmentDownloadUrlUseCase) {
    super()
  }

  protected async perform(request: GetManifestationAttachmentDownloadUrlRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const { manifestationId, attachmentId } = request.params

    if (manifestationId.trim() === '') {
      return badRequest(new MissingParamError('manifestationId'))
    }

    if (attachmentId.trim() === '') {
      return badRequest(new MissingParamError('attachmentId'))
    }

    return ok(
      await this.useCase.execute({
        manifestationId,
        attachmentId,
        requesterUserId: request.user.id,
      }),
    )
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationNotFoundError || error instanceof AttachmentNotFoundError) {
      return notFound(error)
    }

    if (error instanceof NotAllowedToAccessManifestationError) {
      return forbidden(error)
    }

    return null
  }
}
