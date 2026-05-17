import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { GetTrackedManifestationAttachmentDownloadUrlUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-attachment-download-url-use-case.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/track-manifestation-by-protocol/errors/manifestation-tracking-not-found-error.js'
import { GetTrackedManifestationAttachmentDownloadUrlController } from '#src/presentation/controllers/manifestation/get-tracked-manifestation-attachment-download-url.controller.js'
import { MissingParamError } from '#src/presentation/errors/missing-param-error.js'
import { ServerError } from '#src/presentation/errors/server-error.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'
import type { Validator } from '#src/presentation/protocols/validator.js'

interface Body {
  protocol: string
  accessCode: string
}

describe('GetTrackedManifestationAttachmentDownloadUrlController', () => {
  let useCase: DeepMockProxy<GetTrackedManifestationAttachmentDownloadUrlUseCase>
  let validator: DeepMockProxy<Validator<Body>>
  let sut: GetTrackedManifestationAttachmentDownloadUrlController
  let baseRequest: HttpRequest<Body, { attachmentId: string }>

  beforeEach(() => {
    useCase = mockDeep<GetTrackedManifestationAttachmentDownloadUrlUseCase>()
    validator = mockDeep<Validator<Body>>()

    mockReset(useCase)
    mockReset(validator)

    baseRequest = {
      body: { protocol: 'OUV-2026-K7F9Q2', accessCode: 'ABCD-1234' },
      params: { attachmentId: 'attachment-1' },
      query: {},
      headers: {},
    }

    sut = new GetTrackedManifestationAttachmentDownloadUrlController(useCase, validator)
  })

  it('returns 400 with MissingParamError when attachmentId is empty', async () => {
    const response = await sut.handle({
      ...baseRequest,
      params: { attachmentId: '   ' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.body).toBeInstanceOf(MissingParamError)
    expect(validator.validate.mock.calls).toHaveLength(0)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 400 with the validation error and skips the use case when validation fails', async () => {
    const validationError = new Error('Invalid body.')
    validator.validate.mockReturnValue({ success: false, error: validationError })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(400)
    expect(response.body).toBe(validationError)
    expect(useCase.execute.mock.calls).toHaveLength(0)
  })

  it('returns 200 with the signed download url when tracking succeeds', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockResolvedValue({ downloadUrl: 'https://storage.test/download/1' })

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(200)
    expect(useCase.execute.mock.calls[0]?.[0]).toStrictEqual({
      attachmentId: 'attachment-1',
      protocol: 'OUV-2026-K7F9Q2',
      accessCode: 'ABCD-1234',
    })
  })

  it('maps ManifestationTrackingNotFoundError to 404', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    useCase.execute.mockRejectedValue(new ManifestationTrackingNotFoundError())

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(404)
    expect(response.body).toBeInstanceOf(ManifestationTrackingNotFoundError)
  })

  it('returns 500 with a ServerError wrapping unknown failures', async () => {
    validator.validate.mockReturnValue({ success: true, data: baseRequest.body })
    const unexpected = new Error('storage down')
    useCase.execute.mockRejectedValue(unexpected)

    const response = await sut.handle(baseRequest)

    expect(response.statusCode).toBe(500)
    expect(response.body).toBeInstanceOf(ServerError)
    expect((response.body as ServerError).cause).toBe(unexpected)
  })
})
