import type { AttachmentUploadFile } from '#src/application/attachments/attachment-policy.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { AttachmentFileEmptyError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-empty-error.js'
import { AttachmentFileTooLargeError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-too-large-error.js'
import { AttachmentMimeTypeNotAllowedError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-mime-type-not-allowed-error.js'
import { ManifestationAttachmentsLimitExceededError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-cannot-receive-attachments-error.js'
import type { UploadAnonymousManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-anonymous-manifestation-attachment-use-case.js'

import { badRequest, conflict, created, notFound } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

interface UploadAnonymousManifestationAttachmentBody {
  protocol: string
  accessCode: string
  file: AttachmentUploadFile
}

type UploadAnonymousManifestationAttachmentValidationBody = Omit<UploadAnonymousManifestationAttachmentBody, 'file'>

export class UploadAnonymousManifestationAttachmentController extends BaseController<
  HttpRequest<UploadAnonymousManifestationAttachmentBody>
> {
  constructor(
    private readonly useCase: UploadAnonymousManifestationAttachmentUseCase,
    private readonly validator: Validator<UploadAnonymousManifestationAttachmentValidationBody>,
  ) {
    super()
  }

  protected async perform(request: HttpRequest<UploadAnonymousManifestationAttachmentBody>): Promise<HttpResponse> {
    const validation = this.validator.validate({
      protocol: request.body.protocol,
      accessCode: request.body.accessCode,
    })

    if (!validation.success) {
      return badRequest(validation.error)
    }

    return created(
      await this.useCase.execute({
        ...validation.data,
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

    if (error instanceof ManifestationTrackingNotFoundError) {
      return notFound(error)
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
