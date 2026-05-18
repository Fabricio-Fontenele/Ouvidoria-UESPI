import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AttachmentUploadFile } from '#src/application/attachments/attachment-policy.js'
import { AttachmentFileEmptyError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-empty-error.js'
import { AttachmentFileTooLargeError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-too-large-error.js'
import { AttachmentMimeTypeNotAllowedError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-mime-type-not-allowed-error.js'
import { ManifestationAttachmentsLimitExceededError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-cannot-receive-attachments-error.js'
import type { UploadAnonymousManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-anonymous-manifestation-attachment-use-case.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'
import { UploadAnonymousManifestationAttachmentController } from '#src/presentation/controllers/manifestation/upload-anonymous-manifestation-attachment.controller.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

import { createPdfBuffer } from '../../utils/attachment-fixtures.js'

interface Body {
  protocol: string
  accessCode: string
  file: AttachmentUploadFile
}

interface ValidationBody {
  protocol: string
  accessCode: string
}

describe('UploadAnonymousManifestationAttachmentController', () => {
  let useCase: DeepMockProxy<UploadAnonymousManifestationAttachmentUseCase>
  let validator: DeepMockProxy<Validator<ValidationBody>>
  let sut: UploadAnonymousManifestationAttachmentController
  let file: AttachmentUploadFile
  let baseRequest: HttpRequest<Body>

  beforeEach(() => {
    useCase = mockDeep<UploadAnonymousManifestationAttachmentUseCase>()
    validator = mockDeep<Validator<ValidationBody>>()

    mockReset(useCase)
    mockReset(validator)

    file = {
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      sizeInBytes: 1024,
      content: createPdfBuffer(),
    }

    baseRequest = {
      body: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234', file },
      params: {},
      query: {},
      headers: {},
    }

    sut = new UploadAnonymousManifestationAttachmentController(useCase, validator)
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 201 with the public attachment DTO when upload succeeds', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
    })
    useCase.execute.mockResolvedValue({
      attachment: {
        id: 'attachment-1',
        originalName: 'evidence.pdf',
        mimeType: 'application/pdf',
        sizeInBytes: 1024,
        uploadedByType: 'anonymous_manifestant',
        createdAt: new Date('2026-05-10T12:30:00.000Z'),
      },
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      protocol: 'OUV-2026-K7F9Q2',
      accessCode: 'ABCD-1234',
      file,
    })
  })

  it.each([new AttachmentFileEmptyError(), new AttachmentFileTooLargeError(), new AttachmentMimeTypeNotAllowedError()])(
    'maps attachment validation errors to 400',
    async (error) => {
      validator.validate.mockReturnValue({
        success: true,
        data: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
      })
      useCase.execute.mockRejectedValue(error)

      const response = await sut.handle(baseRequest)

      expect(response.statusCode).toBe(400)
      expect(response.body).toBe(error)
    },
  )

  it('maps ManifestationTrackingNotFoundError to 404', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
    })
    useCase.execute.mockRejectedValue(new ManifestationTrackingNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationTrackingNotFoundError)
  })

  it.each([new ManifestationAttachmentsLimitExceededError(), new ManifestationCannotReceiveAttachmentsError()])(
    'maps attachment state conflicts to 409',
    async (error) => {
      validator.validate.mockReturnValue({
        success: true,
        data: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
      })
      useCase.execute.mockRejectedValue(error)

      const response = await sut.handle(baseRequest)

      expect(response.statusCode).toBe(409)
      expect(response.body).toBe(error)
    },
  )

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({
      success: true,
      data: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
    })
    const unexpected = new Error('storage down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
