import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { AttachmentUploadFile } from '#src/application/attachments/attachment-policy.js'
import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { AttachmentFileEmptyError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-empty-error.js'
import { AttachmentFileTooLargeError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-file-too-large-error.js'
import { AttachmentMimeTypeNotAllowedError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-mime-type-not-allowed-error.js'
import { ManifestationAttachmentsLimitExceededError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-attachments-limit-exceeded-error.js'
import { ManifestationCannotReceiveAttachmentsError } from '#src/application/use-cases/manifestation-attachments/errors/manifestation-cannot-receive-attachments-error.js'
import type { UploadManifestationAttachmentUseCase } from '#src/application/use-cases/manifestation-attachments/upload-manifestation-attachment-use-case.js'
import { UserRole } from '#src/domain/entities/user.js'
import { UploadManifestationAttachmentController } from '#src/presentation/controllers/manifestation/upload-manifestation-attachment.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

import { createPdfBuffer } from '../../utils/attachment-fixtures.js'

describe('UploadManifestationAttachmentController', () => {
  let useCase: DeepMockProxy<UploadManifestationAttachmentUseCase>
  let sut: UploadManifestationAttachmentController
  let file: AttachmentUploadFile
  let baseRequest: HttpRequest<{ file: AttachmentUploadFile }, { manifestationId: string }>

  beforeEach(() => {
    useCase = mockDeep<UploadManifestationAttachmentUseCase>()
    mockReset(useCase)

    file = {
      originalName: 'evidence.pdf',
      mimeType: 'application/pdf',
      sizeInBytes: 1024,
      content: createPdfBuffer(),
    }

    baseRequest = {
      body: { file },
      params: { manifestationId: 'manifestation-1' },
      query: {},
      headers: {},
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    }

    sut = new UploadManifestationAttachmentController(useCase)
  })

  it('returns 201 with the public attachment DTO when upload succeeds', async () => {
    useCase.execute.mockResolvedValue({
      attachment: {
        id: 'attachment-1',
        originalName: 'evidence.pdf',
        mimeType: 'application/pdf',
        sizeInBytes: 1024,
        uploadedByType: 'manifestant',
        createdAt: new Date('2026-05-10T12:30:00.000Z'),
      },
    })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(201)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      manifestationId: 'manifestation-1',
      requesterUserId: 'user-1',
      file,
    })
  })

  it('returns 401 when the request has no authenticated user', async () => {
    const { user: _user, ...unauthenticated } = baseRequest

    const response = await sut.handle(unauthenticated)

    expect(response.statusCode).toBe(401)
    expect(response.body).toBeInstanceOf(UnauthenticatedError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with MissingParamError when manifestationId is empty', async () => {
    const response = await sut.handle({
      ...baseRequest,
      params: { manifestationId: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(MissingParamError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it.each([new AttachmentFileEmptyError(), new AttachmentFileTooLargeError(), new AttachmentMimeTypeNotAllowedError()])(
    'maps attachment validation errors to 400',
    async (error) => {
      useCase.execute.mockRejectedValue(error)

      const response = await sut.handle(baseRequest)

      expect(response.statusCode).toBe(400)
      expect(response.body).toBe(error)
    },
  )

  it('maps ManifestationNotFoundError to 404', async () => {
    useCase.execute.mockRejectedValue(new ManifestationNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationNotFoundError)
  })

  it('maps NotAllowedToAccessManifestationError to 403', async () => {
    useCase.execute.mockRejectedValue(new NotAllowedToAccessManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it.each([new ManifestationAttachmentsLimitExceededError(), new ManifestationCannotReceiveAttachmentsError()])(
    'maps attachment state conflicts to 409',
    async (error) => {
      useCase.execute.mockRejectedValue(error)

      const response = await sut.handle(baseRequest)

      expect(response.statusCode).toBe(409)
      expect(response.body).toBe(error)
    },
  )

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    const unexpected = new Error('storage down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
