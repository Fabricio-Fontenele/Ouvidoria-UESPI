import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToManageManifestationError } from '#src/application/use-cases/manifestation-administration/errors/not-allowed-to-manage-manifestation-error.js'
import { AttachmentNotFoundError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-not-found-error.js'
import type { GetAdminManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-admin-manifestation-attachment-download-url-use-case.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, forbidden, notFound, ok, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

interface GetAdminManifestationAttachmentDownloadUrlParams {
  manifestationId: string
  attachmentId: string
}

type GetAdminManifestationAttachmentDownloadUrlRequest = HttpRequest<
  unknown,
  GetAdminManifestationAttachmentDownloadUrlParams
>

export class GetAdminManifestationAttachmentDownloadUrlController extends BaseController<GetAdminManifestationAttachmentDownloadUrlRequest> {
  constructor(private readonly useCase: GetAdminManifestationAttachmentDownloadUrlUseCase) {
    super()
  }

  protected async perform(request: GetAdminManifestationAttachmentDownloadUrlRequest): Promise<HttpResponse> {
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
    if (error instanceof NotAllowedToManageManifestationError) {
      return forbidden(error)
    }

    if (error instanceof ManifestationNotFoundError || error instanceof AttachmentNotFoundError) {
      return notFound(error)
    }

    return null
  }
}
