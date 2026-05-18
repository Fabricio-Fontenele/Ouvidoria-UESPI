import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import { ManifestationNotFoundError } from '#src/application/use-cases/manifestation-access/errors/manifestation-not-found-error.js'
import { NotAllowedToAccessManifestationError } from '#src/application/use-cases/manifestation-access/errors/not-allowed-to-access-manifestation-error.js'
import { AttachmentNotFoundError } from '#src/application/use-cases/manifestation-attachments/errors/attachment-not-found-error.js'
import type { GetManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-manifestation-attachment-download-url-use-case.js'
import { UserRole } from '#src/domain/entities/user.js'
import { GetManifestationAttachmentDownloadUrlController } from '#src/presentation/controllers/manifestation/get-manifestation-attachment-download-url.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import { UnauthenticatedError } from '#src/presentation/errors/unauthenticated-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('GetManifestationAttachmentDownloadUrlController', () => {
  let useCase: DeepMockProxy<GetManifestationAttachmentDownloadUrlUseCase>
  let sut: GetManifestationAttachmentDownloadUrlController
  let baseRequest: HttpRequest<unknown, { manifestationId: string; attachmentId: string }>

  beforeEach(() => {
    useCase = mockDeep<GetManifestationAttachmentDownloadUrlUseCase>()
    mockReset(useCase)

    baseRequest = {
      body: undefined,
      params: { manifestationId: 'manifestation-1', attachmentId: 'attachment-1' },
      query: {},
      headers: {},
      user: { id: 'user-1', role: UserRole.MANIFESTANT },
    }

    sut = new GetManifestationAttachmentDownloadUrlController(useCase)
  })

  it('returns 200 with the signed download url', async () => {
    useCase.execute.mockResolvedValue({ downloadUrl: 'https://storage.test/download/1' })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      manifestationId: 'manifestation-1',
      attachmentId: 'attachment-1',
      requesterUserId: 'user-1',
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
      params: { ...baseRequest.params, manifestationId: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(MissingParamError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with MissingParamError when attachmentId is empty', async () => {
    const response = await sut.handle({
      ...baseRequest,
      params: { ...baseRequest.params, attachmentId: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(MissingParamError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it.each([new ManifestationNotFoundError(), new AttachmentNotFoundError()])(
    'maps not found domain errors to 404',
    async (error) => {
      useCase.execute.mockRejectedValue(error)

      const response = await sut.handle(baseRequest)

      expect(response.statusCode).toBe(404)
      expect(response.body).toBe(error)
    },
  )

  it('maps NotAllowedToAccessManifestationError to 403', async () => {
    useCase.execute.mockRejectedValue(new NotAllowedToAccessManifestationError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(403)
    expect(response.body).toBeInstanceOf(NotAllowedToAccessManifestationError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    const unexpected = new Error('storage down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
