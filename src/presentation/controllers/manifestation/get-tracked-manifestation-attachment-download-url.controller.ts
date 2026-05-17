import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import type { GetTrackedManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-attachment-download-url-use-case.js'

import { MissingParamError } from '../../errors/missing-param-error.js'
import { badRequest, notFound, ok } from '../../helpers/http-helpers.js'
import type { HttpRequest, HttpResponse } from '../../protocols/http.js'
import type { Validator } from '../../protocols/validator.js'
import { BaseController } from '../base-controller.js'

interface GetTrackedManifestationAttachmentDownloadUrlBody {
  protocol: string
  accessCode: string
}

interface GetTrackedManifestationAttachmentDownloadUrlParams {
  attachmentId: string
}

type GetTrackedManifestationAttachmentDownloadUrlRequest = HttpRequest<
  GetTrackedManifestationAttachmentDownloadUrlBody,
  GetTrackedManifestationAttachmentDownloadUrlParams
>

export class GetTrackedManifestationAttachmentDownloadUrlController extends BaseController<GetTrackedManifestationAttachmentDownloadUrlRequest> {
  constructor(
    private readonly useCase: GetTrackedManifestationAttachmentDownloadUrlUseCase,
    private readonly validator: Validator<GetTrackedManifestationAttachmentDownloadUrlBody>,
  ) {
    super()
  }

  protected async perform(request: GetTrackedManifestationAttachmentDownloadUrlRequest): Promise<HttpResponse> {
    const { attachmentId } = request.params

    if (attachmentId.trim() === '') {
      return badRequest(new MissingParamError('attachmentId'))
    }

    const validation = this.validator.validate(request.body)

    if (!validation.success) {
      return badRequest(validation.error)
    }

    return ok(
      await this.useCase.execute({
        attachmentId,
        ...validation.data,
      }),
    )
  }

  protected override mapError(error: unknown): HttpResponse | null {
    if (error instanceof ManifestationTrackingNotFoundError) {
      return notFound(error)
    }

    return null
  }
}
