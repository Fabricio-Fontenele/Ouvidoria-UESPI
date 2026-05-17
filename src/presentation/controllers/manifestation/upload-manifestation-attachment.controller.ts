import type { AttachmentUploadFile } from '#src/application/attachments/attachment-policy.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { AttachmentFileEmptyError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-empty-error.js'
import { AttachmentFileTooLargeError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-too-large-error.js'
import { AttachmentMimeTypeNotAllowedError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-mime-type-not-allowed-error.js'
import { ManifestationAttachmentsLimitExceededError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-cannot-receive-attachments-error.js'
import type { UploadManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-manifestation-attachment-use-case.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { UnauthenticatedError } from '../../errors/unauthenticated-error.js'
import { badRequest, conflict, created, forbidden, notFound, unauthorized } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import { BaseController } from '../base-controller.js'

interface UploadManifestationAttachmentBody {
  file: AttachmentUploadFile
}

interface UploadManifestationAttachmentParams {
  manifestationId: string
}

type UploadManifestationAttachmentRequest = HttpRequest<
  UploadManifestationAttachmentBody,
  UploadManifestationAttachmentParams
>

export class UploadManifestationAttachmentController extends BaseController<UploadManifestationAttachmentRequest> {
  constructor(private readonly useCase: UploadManifestationAttachmentUseCase) {
    super()
  }

  protected async perform(request: UploadManifestationAttachmentRequest): Promise<HttpResponse> {
    if (request.user === undefined) {
      return unauthorized(new UnauthenticatedError())
    }

    const { manifestationId } = request.params

    if (manifestationId.trim() === '') {
      return badRequest(new MissingParamError('manifestationId'))
    }

    return created(
      await this.useCase.execute({
        manifestationId,
        requesterUserId: request.user.id,
        file: request.body.file,
      }),
    )
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (
      error instanceof AttachmentFileEmptyError ||
      error instanceof AttachmentFileTooLargeError ||
      error instanceof AttachmentMimeTypeNotAllowedError
    ) {
      return badRequest(error)
    }

    if (error instanceof ManifestationNotFoundError) {
      return notFound(error)
    }

    if (error instanceof NotAllowedToAccessManifestationError) {
      return forbidden(error)
    }

    if (
      error instanceof ManifestationAttachmentsLimitExceededError ||
      error instanceof ManifestationCannotReceiveAttachmentsError
    ) {
      return conflict(error)
    }

    return null
  }
}
